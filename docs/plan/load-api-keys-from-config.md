# Plan: Load AI API Keys from Config

## Table of Contents

- [Context](#context)
- [Current State](#current-state)
- [Goal](#goal)
- [Critical Files](#critical-files)
- [Implementation Steps](#implementation-steps)
  - [1. Backend — Add `[provider_keys]` Section to `inti.toml`](#1-backend--add-provider_keys-section-to-initoml)
  - [2. Backend — Merge Config Keys at Startup](#2-backend--merge-config-keys-at-startup)
  - [3. Backend — `GET /api/provider-keys`](#3-backend--get-apiprovider-keys)
  - [4. Backend — `POST /api/provider-keys`](#4-backend--post-apiprovider-keys)
  - [5. Backend — Register Routes](#5-backend--register-routes)
  - [6. Frontend JS — Load Keys from Server on Page Open](#6-frontend-js--load-keys-from-server-on-page-open)
  - [7. Frontend JS — Save Keys to Server on Save](#7-frontend-js--save-keys-to-server-on-save)
  - [8. Frontend HTML — Add "Configured" Status Indicator](#8-frontend-html--add-configured-status-indicator)
- [Data Flow](#data-flow)
- [Edge Cases](#edge-cases)
- [Verification](#verification)

## Context

The app reads API keys for Gemini, Groq, and OpenRouter exclusively from environment variables (`.env` or shell). When a user enters keys in the Settings UI, they are stored in `localStorage` (browser-side only) and a single active provider key is written into `inti.toml`. On server restart all other keys vanish from the backend — the next summarize request fails unless the browser happens to still have them in `localStorage` and re-sends them inline.

This is friction for self-hosted setups: users shouldn't need to edit `.env` after the initial run. The fix is to persist all three provider keys in `inti.toml` and load them at startup, making the Settings UI the single place to configure keys.

## Current State

- `internal/config/config.go` — `Load()` reads keys from env vars / `.env` only
- `internal/server/config_store.go` — `inti.toml` has `[summarizer]` (provider, model, one api_key) and `[api_keys]` (auth tokens); no per-provider key storage
- `web/settings.js` — `save()` sends only the active provider's key to `POST /api/summarizer-config`; all three keys live in `localStorage`
- `web/settings.html` — three password inputs (Gemini, Groq, OpenRouter); no server-loaded state indicator

After a server restart, any key entered via the Settings UI and not in `.env` is gone from the backend.

## Goal

1. All three provider keys can be saved from the Settings UI into `inti.toml` via a new `POST /api/provider-keys` endpoint.
2. On server startup, `inti.toml` keys fill in any keys not already set by environment variables (env var wins, config is the fallback).
3. The Settings page fetches existing keys from `GET /api/provider-keys` on load and shows which are already configured server-side (masked prefix), so users know what is persisted.
4. No behavioural change for users who set keys via `.env` — those continue to take priority.

## Critical Files

| File | Change |
|------|--------|
| `internal/server/config_store.go` | Add `providerKeysSection`; add helpers to read/write it |
| `internal/config/config.go` | `Load()` remains env-only; expose a `MergeFromFile` function |
| `internal/server/server.go` | Call `MergeFromFile` after `config.Load()`; register new routes |
| `internal/server/handlers.go` | Add `handleProviderKeys` GET + POST |
| `web/settings.js` | `loadFromServer()` on page open; send all keys on Save |
| `web/settings.html` | Add per-provider "configured" status badge |

## Implementation Steps

### 1. Backend — Add `[provider_keys]` Section to `inti.toml`

In `internal/server/config_store.go`, extend `intiConfig` with a new section:

```go
type intiConfig struct {
    Summarizer   summarizerSection   `toml:"summarizer"`
    ProviderKeys providerKeysSection `toml:"provider_keys"`
    APIKeys      []storedKey         `toml:"api_keys"`
}

type providerKeysSection struct {
    GeminiAPIKey      string `toml:"gemini_api_key"`
    GroqAPIKey        string `toml:"groq_api_key"`
    OpenRouterAPIKey  string `toml:"openrouter_api_key"`
}
```

Add two helpers (caller must NOT hold `fileMu`):

```go
func readProviderKeys() providerKeysSection {
    fileMu.Lock()
    defer fileMu.Unlock()
    return readIntiConfigUnlocked().ProviderKeys
}

func saveProviderKeys(pk providerKeysSection) error {
    fileMu.Lock()
    defer fileMu.Unlock()
    cfg := readIntiConfigUnlocked()
    cfg.ProviderKeys = pk
    return writeIntiConfigUnlocked(cfg)
}
```

### 2. Backend — Merge Config Keys at Startup

Add a function to `internal/config/config.go` that fills in zero-value keys from a map:

```go
// MergeProviderKeys backfills any API key fields that are empty with values
// from the supplied map. Environment-variable-set keys are never overwritten.
func (c *Config) MergeProviderKeys(keys map[string]string) {
    if c.GeminiAPIKey == "" {
        c.GeminiAPIKey = keys["gemini"]
    }
    if c.GroqAPIKey == "" {
        c.GroqAPIKey = keys["groq"]
    }
    if c.OpenRouterAPIKey == "" {
        c.OpenRouterAPIKey = keys["openrouter"]
    }
}
```

In `cmd/serve.go` (or wherever `config.Load()` is called before the server starts), call merge immediately after loading:

```go
cfg, err := config.Load()
// ...
pk := server.ReadProviderKeys() // exported thin wrapper around readProviderKeys()
cfg.MergeProviderKeys(map[string]string{
    "gemini":      pk.GeminiAPIKey,
    "groq":        pk.GroqAPIKey,
    "openrouter":  pk.OpenRouterAPIKey,
})
```

Export `ReadProviderKeys` from `config_store.go` so `cmd/` can call it:

```go
func ReadProviderKeys() map[string]string {
    pk := readProviderKeys()
    return map[string]string{
        "gemini":     pk.GeminiAPIKey,
        "groq":       pk.GroqAPIKey,
        "openrouter": pk.OpenRouterAPIKey,
    }
}
```

### 3. Backend — `GET /api/provider-keys`

Returns each key's configured state without exposing the raw value. Clients use the prefix to confirm a key is set.

```go
type providerKeyStatus struct {
    Provider    string `json:"provider"`
    Configured  bool   `json:"configured"`
    Prefix      string `json:"prefix,omitempty"` // first 8 chars, e.g. "AIzaSyAB"
    Source      string `json:"source"`            // "env" | "config" | "none"
}

type providerKeysResponse struct {
    Keys []providerKeyStatus `json:"keys"`
}

func handleProviderKeysGet(cfg *config.Config) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        pk := readProviderKeys()
        status := func(envVal, cfgVal, provider string) providerKeyStatus {
            if envVal != "" {
                return providerKeyStatus{Provider: provider, Configured: true,
                    Prefix: prefix(envVal), Source: "env"}
            }
            if cfgVal != "" {
                return providerKeyStatus{Provider: provider, Configured: true,
                    Prefix: prefix(cfgVal), Source: "config"}
            }
            return providerKeyStatus{Provider: provider, Configured: false, Source: "none"}
        }
        // Note: cfg already has merged values, so re-read env directly for source detection.
        writeJSON(w, http.StatusOK, providerKeysResponse{Keys: []providerKeyStatus{
            status(os.Getenv("GEMINI_API_KEY"),      pk.GeminiAPIKey,     "gemini"),
            status(os.Getenv("GROQ_API_KEY"),        pk.GroqAPIKey,       "groq"),
            status(os.Getenv("OPENROUTER_API_KEY"),  pk.OpenRouterAPIKey, "openrouter"),
        }})
    }
}

func prefix(s string) string {
    if len(s) <= 8 { return s }
    return s[:8] + "…"
}
```

### 4. Backend — `POST /api/provider-keys`

Accepts partial updates — only non-empty fields are written (so sending `{"gemini": ""}` does not wipe a key already in `inti.toml`). This lets the UI selectively update without re-sending all keys.

```go
type providerKeysSaveRequest struct {
    Gemini     string `json:"gemini"`
    Groq       string `json:"groq"`
    OpenRouter string `json:"openrouter"`
}

func handleProviderKeysPost(cfg *config.Config) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        var req providerKeysSaveRequest
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
            writeJSON(w, http.StatusBadRequest, errResponse{"invalid request body"})
            return
        }
        // Read existing to merge — never blank a key that wasn't submitted.
        existing := readProviderKeys()
        if req.Gemini != "" {
            existing.GeminiAPIKey = req.Gemini
            cfg.GeminiAPIKey = req.Gemini  // update in-memory config
        }
        if req.Groq != "" {
            existing.GroqAPIKey = req.Groq
            cfg.GroqAPIKey = req.Groq
        }
        if req.OpenRouter != "" {
            existing.OpenRouterAPIKey = req.OpenRouter
            cfg.OpenRouterAPIKey = req.OpenRouter
        }
        if err := saveProviderKeys(existing); err != nil {
            writeJSON(w, http.StatusInternalServerError, errResponse{"failed to save keys"})
            return
        }
        writeJSON(w, http.StatusOK, struct{ OK bool `json:"ok"` }{true})
    }
}
```

> **Note:** Updating `cfg` in-memory means the running server uses the new key immediately without a restart.

### 5. Backend — Register Routes

In `internal/server/server.go`:

```go
mux.Handle("/api/provider-keys", requireAuth(aks, func(w http.ResponseWriter, r *http.Request) {
    switch r.Method {
    case http.MethodGet:
        handleProviderKeysGet(cfg)(w, r)
    case http.MethodPost:
        handleProviderKeysPost(cfg)(w, r)
    default:
        writeJSON(w, http.StatusMethodNotAllowed, errResponse{"method not allowed"})
    }
}))
```

### 6. Frontend JS — Load Keys from Server on Page Open

In `web/settings.js`, add a `loadFromServer()` call after the existing `load()`:

```js
async function loadFromServer() {
  try {
    const res = await fetch('/api/provider-keys', { headers: withAPIKey() });
    if (!res.ok) return;
    const data = await res.json();
    for (const k of data.keys) {
      const badge = document.getElementById(`key-status-${k.provider}`);
      if (!badge) continue;
      if (k.configured) {
        badge.textContent = k.source === 'env'
          ? `Set via env (${k.prefix})`
          : `Saved (${k.prefix})`;
        badge.className = 'key-status key-status--ok';
        // If set only in env, grey out the input to signal it's read-only
        if (k.source === 'env') {
          const input = document.getElementById(`key-${k.provider}`);
          if (input && !input.value) input.placeholder = '(set via environment variable)';
        }
      } else {
        badge.textContent = 'Not configured';
        badge.className = 'key-status key-status--missing';
      }
    }
  } catch {}
}
```

Call both at the bottom of the file:

```js
load();
loadFromServer();
```

### 7. Frontend JS — Save Keys to Server on Save

Update `save()` to send all three keys to the new endpoint after updating `localStorage`:

```js
async function save() {
  const provider = sumProviderSelect.value;
  const keys = {
    gemini:     keyGemini.value.trim(),
    groq:       keyGroq.value.trim(),
    openrouter: keyOpenRouter.value.trim(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ provider, keys }));

  // 1. Persist provider selection + active key (existing behaviour)
  const apiKey = provider && keys[provider] ? keys[provider] : '';
  await fetch('/api/summarizer-config', {
    method: 'POST',
    headers: withAPIKey({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ provider, apiKey, model: '' }),
  }).catch(() => {});

  // 2. Persist all non-empty provider keys to inti.toml (new)
  const toSave = {};
  if (keys.gemini)     toSave.gemini     = keys.gemini;
  if (keys.groq)       toSave.groq       = keys.groq;
  if (keys.openrouter) toSave.openrouter = keys.openrouter;
  if (Object.keys(toSave).length > 0) {
    await fetch('/api/provider-keys', {
      method: 'POST',
      headers: withAPIKey({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(toSave),
    }).catch(() => {});
  }

  sumSaveStatus.textContent = 'Saved';
  sumSaveStatus.className = 'status-text';
  setTimeout(() => { sumSaveStatus.textContent = ''; }, 2000);
  loadFromServer(); // refresh status badges
}
```

### 8. Frontend HTML — Add "Configured" Status Indicator

In `web/settings.html`, add a small status span below each API key input:

```html
<!-- Gemini card -->
<div class="settings-field">
  <label class="settings-label" for="key-gemini">API Key</label>
  <input type="password" id="key-gemini" class="settings-key-input" placeholder="AIza…" autocomplete="off" />
  <span id="key-status-gemini" class="key-status"></span>
  <p class="settings-hint">
    Get your key at
    <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" class="settings-link">aistudio.google.com</a>
  </p>
</div>
```

Repeat for `key-status-groq` and `key-status-openrouter`. Add minimal CSS to `style.css`:

```css
.key-status          { display: block; font-size: 11px; margin-top: 4px; color: var(--muted); }
.key-status--ok      { color: var(--success, #4caf50); }
.key-status--missing { color: var(--muted); }
```

## Data Flow

```
First run (no .env, no inti.toml):
  config.Load() → all keys empty
  ReadProviderKeys() → all empty
  MergeProviderKeys() → no change
  Server starts with no keys; summarize returns 503

User opens Settings, enters Groq key, clicks Save:
  POST /api/provider-keys { groq: "gsk_..." }
  → inti.toml [provider_keys] groq_api_key = "gsk_..."
  → cfg.GroqAPIKey updated in-memory immediately

Server restarts:
  config.Load() → GROQ_API_KEY env not set → cfg.GroqAPIKey = ""
  ReadProviderKeys() → groq_api_key = "gsk_..."
  MergeProviderKeys() → cfg.GroqAPIKey = "gsk_..."
  Server starts with Groq configured ✓

User with .env GROQ_API_KEY set:
  config.Load() → cfg.GroqAPIKey = "gsk_from_env"
  MergeProviderKeys() → groq already set, no change (env wins) ✓
```

## Edge Cases

- **Clearing a key**: the UI sends only non-empty keys; to explicitly remove a key from `inti.toml`, the user can clear the input and a separate "Clear" action should send `{ "gemini": "" }` — but since the handler ignores empty strings, a dedicated `DELETE` or a special sentinel (`"-"`) would be needed. For now, manual edit of `inti.toml` is the escape hatch. Can be addressed in a follow-up.
- **No auth (`INTI_MASTER_KEY` not set)**: `requireAuth` passes through, so the endpoints are unguarded. This is consistent with the rest of the API in that configuration.
- **`cfg` pointer mutation in handler**: `handleProviderKeysPost` mutates the `*config.Config` passed from `server.go`. This is safe as long as the same pointer is used everywhere (which it is — the server threads it into all handlers).
- **`GET /api/provider-keys` reveals key prefixes**: This is intentional for UX (confirm which key is active) and consistent with the API key management page pattern. Raw key values are never returned.

## Verification

```sh
go build ./...
./inti serve   # without GEMINI_API_KEY in .env
```

1. Open Settings → all three status badges read "Not configured"
2. Enter a Groq key → Save → badge reads "Saved (gsk_1234…)"
3. Kill and restart the server; open Settings → Groq badge still reads "Saved (…)"
4. Set `GEMINI_API_KEY=... ./inti serve` → Gemini badge reads "Set via env (AIzaSy…)"
5. `GET /api/provider-keys` returns correct JSON with `source` field
6. Summarize with Groq after restart → succeeds without re-entering the key
