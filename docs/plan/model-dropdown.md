# Plan: Add Model Dropdown to Settings UI

## Table of Contents

- [Context](#context)
- [Current State](#current-state)
- [Goal](#goal)
- [Critical Files](#critical-files)
- [Implementation Steps](#implementation-steps)
  - [1. Backend — Provider/Model Catalog Endpoint](#1-backend--providermodel-catalog-endpoint)
  - [2. Backend — Expose Current Model in Config Response](#2-backend--expose-current-model-in-config-response)
  - [3. Frontend HTML — Add Model Dropdown](#3-frontend-html--add-model-dropdown)
  - [4. Frontend JS — Wire Provider Change to Model Options](#4-frontend-js--wire-provider-change-to-model-options)
  - [5. Frontend JS — Persist and Restore Model Selection](#5-frontend-js--persist-and-restore-model-selection)
- [Model Catalog](#model-catalog)
- [Edge Cases](#edge-cases)
- [Verification](#verification)

## Context

The Settings page (`/settings.html`) lets users pick a summarizer provider (Gemini, Groq, OpenRouter). However, the `save()` function always sends `model: ''` to `POST /api/summarizer-config`, so the model is always the server default. Users have no way to switch between, e.g., Groq's `llama-3.3-70b-versatile` vs `llama-3.1-8b-instant` from the UI.

This is a pure frontend-plus-light-backend feature. No new Go packages are needed.

## Current State

- `settings.html` — has `#sum-provider-select` dropdown; no model dropdown
- `settings.js` — `save()` always sends `model: ''`; provider value is persisted to `localStorage`
- `GET /api/summarizer-config` — returns `{ provider, model }` but `model` is always the server default
- `POST /api/summarizer-config` — accepts `{ provider, apiKey, model }` — model field already wired in Go

The Go side is already complete: `handleSummarizerConfig` (handlers.go:289) accepts a model, `modelForProvider` (handlers.go:325) provides per-provider defaults, and `saveActiveConfig` persists all three fields.

## Goal

1. After selecting a provider, a second dropdown appears with that provider's known models.
2. The selected model is sent to `POST /api/summarizer-config` on Save.
3. On page load, the current model (fetched from `GET /api/summarizer-config`) is pre-selected.
4. The model list is defined in one place on the backend, served via a new `GET /api/summarizer-providers` endpoint so the frontend stays in sync if models are added later.

## Critical Files

- `internal/server/handlers.go` — add `handleSummarizerProviders`; register route in `server.go`
- `internal/server/server.go` — register `/api/summarizer-providers` route
- `web/settings.html` — add `#sum-model-select` dropdown below the provider dropdown
- `web/settings.js` — populate model dropdown on provider change, persist/restore selection, send model on save

## Implementation Steps

### 1. Backend — Provider/Model Catalog Endpoint

Add a new handler in `internal/server/handlers.go`:

```go
type providerInfo struct {
    ID     string   `json:"id"`
    Label  string   `json:"label"`
    Models []string `json:"models"`
}

type summarizerProvidersResponse struct {
    Providers []providerInfo `json:"providers"`
}

func handleSummarizerProviders() http.HandlerFunc {
    providers := summarizerProvidersResponse{
        Providers: []providerInfo{
            {
                ID:    "gemini",
                Label: "Gemini",
                Models: []string{
                    "gemini-2.0-flash",
                    "gemini-2.5-flash",
                    "gemini-2.5-pro",
                },
            },
            {
                ID:    "groq",
                Label: "Groq",
                Models: []string{
                    "llama-3.3-70b-versatile",
                    "llama-3.1-8b-instant",
                    "meta-llama/llama-4-scout-17b-16e-instruct",
                    "mixtral-8x7b-32768",
                },
            },
            {
                ID:    "openrouter",
                Label: "OpenRouter",
                Models: []string{
                    "google/gemma-3-27b-it:free",
                    "mistralai/mistral-7b-instruct:free",
                    "meta-llama/llama-3.2-3b-instruct:free",
                },
            },
        },
    }
    return func(w http.ResponseWriter, r *http.Request) {
        writeJSON(w, http.StatusOK, providers)
    }
}
```

Register in `internal/server/server.go` alongside the other API routes:

```go
mux.HandleFunc("/api/summarizer-providers", handleSummarizerProviders())
```

### 2. Backend — Expose Current Model in Config Response

`GET /api/summarizer-config` already returns `{ provider, model }` (handlers.go:293–296). No change needed — the JS just needs to use it.

### 3. Frontend HTML — Add Model Dropdown

In `web/settings.html`, inside the summarizer card's `.settings-form`, add a second field below the provider field:

```html
<div class="settings-field" id="sum-model-field" hidden>
  <label class="settings-label" for="sum-model-select">Model</label>
  <div class="select-wrap">
    <select id="sum-model-select" title="Active summarizer model">
      <!-- populated dynamically by settings.js -->
    </select>
  </div>
</div>
```

The field starts `hidden` and becomes visible once a provider with known models is selected.

### 4. Frontend JS — Wire Provider Change to Model Options

In `web/settings.js`, fetch the provider catalog once on load and rebuild the model dropdown whenever the provider changes:

```js
const sumModelField  = document.getElementById('sum-model-field');
const sumModelSelect = document.getElementById('sum-model-select');

let providerCatalog = []; // filled after fetch

async function loadProviderCatalog() {
  try {
    const res = await fetch('/api/summarizer-providers', { headers: withAPIKey() });
    const data = await res.json();
    providerCatalog = data.providers || [];
  } catch {}
  applyProviderModels(sumProviderSelect.value);
}

function applyProviderModels(providerId) {
  const info = providerCatalog.find(p => p.id === providerId);
  sumModelSelect.innerHTML = '';
  if (!info || info.models.length === 0) {
    sumModelField.hidden = true;
    return;
  }
  for (const m of info.models) {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    sumModelSelect.appendChild(opt);
  }
  sumModelField.hidden = false;
}

sumProviderSelect.addEventListener('change', () => {
  applyProviderModels(sumProviderSelect.value);
});
```

Call `loadProviderCatalog()` at the bottom of the file (after `load()` and `renderGroqUsage()`).

### 5. Frontend JS — Persist and Restore Model Selection

**Save** — update the `save()` function to include the model:

```js
// in save(), replace:
body: JSON.stringify({ provider, apiKey, model: '' }),
// with:
body: JSON.stringify({ provider, apiKey, model: sumModelSelect.value }),
```

Also persist the model to `localStorage`:

```js
localStorage.setItem(STORAGE_KEY, JSON.stringify({ provider, model: sumModelSelect.value, keys }));
```

**Load** — in `load()`, after setting the provider, restore the model:

```js
if (saved.provider) {
  sumProviderSelect.value = saved.provider;
  // model will be restored after the catalog loads via loadProviderCatalog()
}
```

After fetching the catalog in `loadProviderCatalog()`, restore the saved model value:

```js
async function loadProviderCatalog() {
  // ... fetch ...
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  applyProviderModels(sumProviderSelect.value);
  if (saved.model) sumModelSelect.value = saved.model;
}
```

Also seed from server config as fallback (if localStorage is empty, use `GET /api/summarizer-config`):

```js
async function loadServerConfig() {
  try {
    const res = await fetch('/api/summarizer-config', { headers: withAPIKey() });
    const data = await res.json();
    if (!sumProviderSelect.value && data.provider) {
      sumProviderSelect.value = data.provider;
      applyProviderModels(data.provider);
    }
    if (!sumModelSelect.value && data.model) {
      sumModelSelect.value = data.model;
    }
  } catch {}
}
```

Call `loadServerConfig()` after `loadProviderCatalog()`.

## Model Catalog

| Provider   | Model ID                                          | Notes                    |
|------------|---------------------------------------------------|--------------------------|
| Gemini     | `gemini-2.0-flash`                                | Default (fast, free tier)|
| Gemini     | `gemini-2.5-flash`                                | Faster preview           |
| Gemini     | `gemini-2.5-pro`                                  | Highest quality          |
| Groq       | `llama-3.3-70b-versatile`                         | Default (high quality)   |
| Groq       | `llama-3.1-8b-instant`                            | Fastest / lowest latency |
| Groq       | `meta-llama/llama-4-scout-17b-16e-instruct`       | Llama 4                  |
| Groq       | `mixtral-8x7b-32768`                              | Long context             |
| OpenRouter | `google/gemma-3-27b-it:free`                      | Default (free)           |
| OpenRouter | `mistralai/mistral-7b-instruct:free`              | Free, fast               |
| OpenRouter | `meta-llama/llama-3.2-3b-instruct:free`           | Free, small              |

## Edge Cases

- **Provider with no catalog entry** (e.g. `mock`, empty): hide the model dropdown, send `model: ''`.
- **Saved model no longer in list**: `<select>` will silently fall back to the first option — acceptable.
- **API call fails**: `loadProviderCatalog()` fails silently; model dropdown stays hidden. User can still save with an empty model and the server default kicks in.
- **`clearAll()`**: reset `sumModelSelect.value = ''` and hide `sumModelField`.

## Verification

```sh
go build ./...    # must compile cleanly
./vocalize serve
```

Manual checks:
- Select **Groq** → model dropdown appears with Groq models; select **Gemini** → Groq models replaced by Gemini models
- Select a non-default model → click Save → reload page → same model pre-selected
- `GET /api/summarizer-providers` returns JSON with `providers` array
- `POST /api/summarize` uses the selected model (check response `"model"` field)
- Click **Clear all** → model dropdown disappears
