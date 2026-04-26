# Plan: Add TTS Provider Dropdown

## Table of Contents

- [Context](#context)
- [Current State](#current-state)
- [Goal](#goal)
- [Critical Files](#critical-files)
- [Implementation Steps](#implementation-steps)
  - [1. Backend — TTS Provider Interface](#1-backend--tts-provider-interface)
  - [2. Backend — OpenAI TTS Provider](#2-backend--openai-tts-provider)
  - [3. Backend — `GET /api/tts-providers` Endpoint](#3-backend--get-apitts-providers-endpoint)
  - [4. Backend — Update `POST /api/speak` to Accept Provider](#4-backend--update-post-apispeak-to-accept-provider)
  - [5. Frontend HTML — Add Provider Dropdown](#5-frontend-html--add-provider-dropdown)
  - [6. Frontend JS — Wire Provider Change to Voice Options](#6-frontend-js--wire-provider-change-to-voice-options)
  - [7. Frontend JS — Persist and Restore Provider Selection](#7-frontend-js--persist-and-restore-provider-selection)
- [Provider Catalog](#provider-catalog)
- [Edge Cases](#edge-cases)
- [Verification](#verification)

## Context

The app currently only supports Gemini for TTS. The title bar even says "Gemini TTS" and the voices list in `app.js` is Gemini-specific. Adding a provider dropdown lets users switch to OpenAI TTS (which has a different voice set and quality characteristics), making the app genuinely provider-agnostic.

The summarizer side already has a multi-provider pattern (Gemini/Groq/OpenRouter) — this feature brings the same flexibility to TTS.

## Current State

- `web/index.html` — title says "Gemini TTS"; Input card has `#model-select`, `#gender-filter`, `#voice-select` — all Gemini-specific; no provider concept
- `web/app.js` — `VOICES` array is hardcoded Gemini voices; models fetched from `GET /api/models` (Gemini-only)
- `internal/server/handlers.go` — `handleSpeak` uses a single `*gemini.Client`; `handleModels` returns only Gemini models
- `internal/gemini/` — the only TTS implementation; returns raw 24 kHz PCM
- `internal/audio/opus.go` — `EncodePCMToOpus(pcm []byte, sampleRate int)` — already accepts an arbitrary sample rate

There is no TTS provider abstraction. The Go side hardwires `gemini.Client` into `handleSpeak`.

## Goal

1. A **TTS Provider** dropdown appears in the Input card (above/alongside the existing Model dropdown).
2. Selecting a provider swaps the voice list and model list to that provider's options.
3. The chosen provider, voice, and model are sent with `POST /api/speak`.
4. A new `GET /api/tts-providers` endpoint defines the catalog in one place.
5. The page title and badge update to reflect the active provider instead of hard-coding "Gemini TTS".
6. First supported providers: **Gemini** (existing) and **OpenAI TTS**.

## Critical Files

| File | Change |
|------|--------|
| `internal/tts/provider.go` | New — `Provider` interface |
| `internal/tts/gemini.go` | New — wraps `internal/gemini.Client` |
| `internal/tts/openai.go` | New — OpenAI TTS via `POST https://api.openai.com/v1/audio/speech` |
| `internal/server/handlers.go` | `handleSpeak` accepts provider; add `handleTTSProviders` |
| `internal/server/server.go` | Register `/api/tts-providers` route; thread OpenAI key into handler |
| `internal/config/config.go` | Add `OpenAIAPIKey` field |
| `.env.example` | Document `OPENAI_API_KEY` |
| `web/index.html` | Add `#tts-provider-select`; update title/badge |
| `web/app.js` | Load provider catalog; swap voices/models on provider change; send provider on submit |

## Implementation Steps

### 1. Backend — TTS Provider Interface

Create `internal/tts/provider.go`:

```go
package tts

import "context"

// Provider synthesizes text to raw PCM audio.
type Provider interface {
    // Speak returns raw PCM bytes and the sample rate in Hz.
    Speak(ctx context.Context, text, voice, model string) (pcm []byte, sampleRate int, err error)
}
```

This is the only contract. The audio pipeline in `cmd/speak.go` and `internal/server/handlers.go` will program against this instead of `*gemini.Client`.

### 2. Backend — OpenAI TTS Provider

Create `internal/tts/openai.go`:

```go
package tts

import (
    "bytes"
    "context"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

type OpenAIProvider struct {
    APIKey string
    HTTP   *http.Client
}

type openAISpeakRequest struct {
    Model          string  `json:"model"`
    Input          string  `json:"input"`
    Voice          string  `json:"voice"`
    ResponseFormat string  `json:"response_format"` // "pcm"
    Speed          float64 `json:"speed,omitempty"`
}

func (p *OpenAIProvider) Speak(ctx context.Context, text, voice, model string) ([]byte, int, error) {
    if model == "" {
        model = "gpt-4o-mini-tts"
    }
    if voice == "" {
        voice = "nova"
    }
    body, _ := json.Marshal(openAISpeakRequest{
        Model:          model,
        Input:          text,
        Voice:          voice,
        ResponseFormat: "pcm",
    })
    req, err := http.NewRequestWithContext(ctx, http.MethodPost,
        "https://api.openai.com/v1/audio/speech", bytes.NewReader(body))
    if err != nil {
        return nil, 0, err
    }
    req.Header.Set("Authorization", "Bearer "+p.APIKey)
    req.Header.Set("Content-Type", "application/json")

    resp, err := p.HTTP.Do(req)
    if err != nil {
        return nil, 0, err
    }
    defer resp.Body.Close()
    if resp.StatusCode != http.StatusOK {
        b, _ := io.ReadAll(resp.Body)
        return nil, 0, fmt.Errorf("openai tts: %s — %s", resp.Status, b)
    }
    pcm, err := io.ReadAll(resp.Body)
    // OpenAI PCM output is 24 kHz, 16-bit, mono
    return pcm, 24000, err
}
```

Also create `internal/tts/gemini.go` — a thin adapter wrapping `*gemini.Client`:

```go
package tts

import (
    "context"
    "github.com/100nandoo/inti/internal/gemini"
)

type GeminiProvider struct {
    Client *gemini.Client
}

func (p *GeminiProvider) Speak(ctx context.Context, text, voice, model string) ([]byte, int, error) {
    pcm, err := p.Client.GenerateSpeech(ctx, text, voice, model)
    return pcm, 24000, err
}
```

### 3. Backend — `GET /api/tts-providers` Endpoint

Add in `internal/server/handlers.go`:

```go
type ttsVoiceInfo struct {
    Name           string `json:"name"`
    Gender         string `json:"gender,omitempty"`
    Characteristic string `json:"characteristic,omitempty"`
}

type ttsProviderInfo struct {
    ID      string         `json:"id"`
    Label   string         `json:"label"`
    Models  []string       `json:"models"`
    Default string         `json:"default"` // default model ID
    Voices  []ttsVoiceInfo `json:"voices"`
}

type ttsProvidersResponse struct {
    Providers []ttsProviderInfo `json:"providers"`
    Default   string            `json:"default"` // default provider ID
}

func handleTTSProviders(hasGemini, hasOpenAI bool) http.HandlerFunc {
    resp := ttsProvidersResponse{
        Default: "gemini",
        Providers: []ttsProviderInfo{
            {
                ID:      "gemini",
                Label:   "Gemini",
                Default: "gemini-2.5-flash-preview-tts",
                Models:  []string{"gemini-2.5-flash-preview-tts", "gemini-2.5-pro-preview-tts"},
                Voices: []ttsVoiceInfo{
                    {Name: "Zephyr", Gender: "Female", Characteristic: "Bright"},
                    {Name: "Puck",   Gender: "Male",   Characteristic: "Upbeat"},
                    // ... full list omitted for brevity; mirrors app.js VOICES constant
                },
            },
            {
                ID:      "openai",
                Label:   "OpenAI",
                Default: "gpt-4o-mini-tts",
                Models:  []string{"gpt-4o-mini-tts", "tts-1", "tts-1-hd"},
                Voices: []ttsVoiceInfo{
                    {Name: "alloy"},
                    {Name: "ash"},
                    {Name: "coral"},
                    {Name: "echo"},
                    {Name: "fable"},
                    {Name: "nova"},
                    {Name: "onyx"},
                    {Name: "sage"},
                    {Name: "shimmer"},
                },
            },
        },
    }
    return func(w http.ResponseWriter, r *http.Request) {
        writeJSON(w, http.StatusOK, resp)
    }
}
```

Register in `internal/server/server.go`:

```go
mux.HandleFunc("/api/tts-providers", handleTTSProviders(g != nil, cfg.OpenAIAPIKey != ""))
```

### 4. Backend — Update `POST /api/speak` to Accept Provider

Update `speakRequest` in `handlers.go`:

```go
type speakRequest struct {
    Text     string `json:"text"`
    Voice    string `json:"voice"`
    Model    string `json:"model"`
    Provider string `json:"provider"` // "gemini" (default) | "openai"
}
```

Update `handleSpeak` to dispatch on `req.Provider`:

```go
func handleSpeak(geminiProvider *tts.GeminiProvider, openaiProvider *tts.OpenAIProvider, cfg *config.Config) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        // ... decode req as before ...

        var provider tts.Provider
        switch req.Provider {
        case "openai":
            if openaiProvider == nil {
                writeJSON(w, http.StatusServiceUnavailable, errResponse{"OpenAI TTS unavailable — OPENAI_API_KEY not configured"})
                return
            }
            provider = openaiProvider
        default: // "gemini" or empty
            if geminiProvider == nil {
                writeJSON(w, http.StatusServiceUnavailable, errResponse{"TTS unavailable — GEMINI_API_KEY not configured"})
                return
            }
            provider = geminiProvider
        }

        pcm, sampleRate, err := provider.Speak(r.Context(), req.Text, voice, model)
        if err != nil {
            // handle rate limit / generic error as before
            return
        }

        opusBytes, err := audio.EncodePCMToOpus(pcm, sampleRate)
        // ...
    }
}
```

Add `OPENAI_API_KEY` to `internal/config/config.go`:

```go
type Config struct {
    // ...existing fields...
    OpenAIAPIKey string // OPENAI_API_KEY env var
}
```

Load it alongside the others in the config init function.

### 5. Frontend HTML — Add Provider Dropdown

In `web/index.html`, update the Input card's `info-row`:

```html
<div class="info-row">
  <span class="pill" id="provider-badge">Gemini TTS</span>
  <div class="select-wrap select-wrap-sm">
    <select id="tts-provider-select" title="Select TTS provider"></select>
  </div>
  <div class="select-wrap select-wrap-sm">
    <select id="model-select" title="Select TTS model"></select>
  </div>
  <span class="pill audio-spec">24 kHz · PCM-16</span>
</div>
```

Also update `<title>` and the header badge:

```html
<title>Inti — TTS</title>
<!-- header logo-badge -->
<span class="logo-badge" id="logo-badge">TTS</span>
```

### 6. Frontend JS — Wire Provider Change to Voice Options

In `web/app.js`, replace the hardcoded `VOICES` constant and model fetching with a single catalog load:

```js
let ttsCatalog = [];  // filled from /api/tts-providers

async function loadTTSProviders() {
  const res = await fetch('/api/tts-providers', { headers: withAPIKey() });
  const data = await res.json();
  ttsCatalog = data.providers || [];

  ttsProviderSelect.innerHTML = '';
  for (const p of ttsCatalog) {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.label;
    ttsProviderSelect.appendChild(opt);
  }

  const saved = localStorage.getItem('tts-provider') || data.default || 'gemini';
  ttsProviderSelect.value = saved;
  applyProvider(saved);
}

function applyProvider(providerId) {
  const info = ttsCatalog.find(p => p.id === providerId);
  if (!info) return;

  // update badge
  document.getElementById('provider-badge').textContent = info.label + ' TTS';
  document.getElementById('logo-badge').textContent = info.label + ' TTS';

  // rebuild model dropdown
  modelSelect.innerHTML = '';
  for (const m of info.models) {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    modelSelect.appendChild(opt);
  }
  modelSelect.value = localStorage.getItem(`tts-model-${providerId}`) || info.default;

  // rebuild voice dropdown (respecting current gender filter)
  rebuildVoices(info.voices);
}

ttsProviderSelect.addEventListener('change', () => {
  const pid = ttsProviderSelect.value;
  localStorage.setItem('tts-provider', pid);
  applyProvider(pid);
});
```

Update `rebuildVoices` to accept a voices array instead of the hardcoded `VOICES` constant:

```js
function rebuildVoices(voices) {
  const gender = genderFilter.value;
  const filtered = gender === 'All' ? voices : voices.filter(v => v.gender === gender);
  voiceSelect.innerHTML = '';
  for (const v of filtered) {
    const opt = document.createElement('option');
    opt.value = v.name;
    opt.textContent = v.characteristic ? `${v.name} — ${v.characteristic}` : v.name;
    voiceSelect.appendChild(opt);
  }
}
```

### 7. Frontend JS — Persist and Restore Provider Selection

**On submit**, include the provider:

```js
body: JSON.stringify({
  text,
  voice: voiceSelect.value,
  model: modelSelect.value,
  provider: ttsProviderSelect.value,
}),
```

**On model change**, persist per-provider:

```js
modelSelect.addEventListener('change', () => {
  const pid = ttsProviderSelect.value;
  localStorage.setItem(`tts-model-${pid}`, modelSelect.value);
});
```

## Provider Catalog

| Provider | Model | Notes |
|----------|-------|-------|
| Gemini | `gemini-2.5-flash-preview-tts` | Default — fast |
| Gemini | `gemini-2.5-pro-preview-tts` | Higher quality |
| OpenAI | `gpt-4o-mini-tts` | Default — fast, instruction-following |
| OpenAI | `tts-1` | Lower latency |
| OpenAI | `tts-1-hd` | Higher quality |

OpenAI voices: `alloy`, `ash`, `coral`, `echo`, `fable`, `nova`, `onyx`, `sage`, `shimmer`

## Edge Cases

- **No OPENAI_API_KEY**: `handleTTSProviders` can still include OpenAI in the catalog but the web UI should grey it out (or the `POST /api/speak` returns 503 for that provider). Simplest approach: always list all providers; let the backend 503 be the gate.
- **Gender filter on OpenAI voices**: OpenAI voices have no gender metadata — hide the gender filter when provider ≠ `gemini`, or treat all as "All".
- **`audio-spec` badge**: OpenAI PCM is also 24 kHz 16-bit mono, so the badge stays correct for both providers.
- **`cmd/speak.go` CLI**: The `--provider` flag can be added in a follow-up; the CLI defaults to Gemini unchanged.
- **`internal/tui/`**: The TUI calls `internal/gemini` directly; TUI provider switching is out of scope for this plan.

## Verification

```sh
go build ./...   # must compile cleanly
GEMINI_API_KEY=... OPENAI_API_KEY=... ./inti serve
```

Manual checks:
- Page loads → provider dropdown shows "Gemini" and "OpenAI"
- Select **Gemini** → voice dropdown shows Gemini voices; model dropdown shows Gemini models
- Select **OpenAI** → voice dropdown shows OpenAI voices; model dropdown shows OpenAI models; gender filter hidden
- Submit with OpenAI provider → audio plays
- Reload → last selected provider, voice, and model are restored from `localStorage`
- `GET /api/tts-providers` returns correct JSON
- Missing `OPENAI_API_KEY` → `POST /api/speak` with `provider: "openai"` returns 503
