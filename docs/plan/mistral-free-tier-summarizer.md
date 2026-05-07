# Plan: Add Mistral Free-Tier Support for `summarize`

## Context

The repository already supports summarization through provider-specific backends:

- `gemini` via `internal/gemini`
- `groq` via `internal/summarizer/groq.go`
- `openrouter` via `internal/summarizer/openrouter.go`
- `mock` for testing

The cleanest way to support Mistral's free API tier is to add `mistral` as a first-class summarizer provider, not to hide it behind `openrouter`.

That recommendation is based on two facts:

1. The current `openrouter` flow intentionally suppresses model selection in both request handling and persisted config.
2. Mistral's current docs expose a direct quickstart path for the Experiment plan: create a `MISTRAL_API_KEY`, call `client.chat.complete(...)`, and handle `401`, `402`, and `429` as the main first-request errors.

Sources used for the API shape:

- Mistral quickstart page you linked: [Send your first API request](https://docs.mistral.ai/getting-started/quickstarts/developer/first-api-request)
- Mistral platform docs via Context7 (`/mistralai/platform-docs-public`) on May 7, 2026

## Goal

Allow users to run `summarize` through Mistral's API free tier from:

- CLI: `inti summarize`
- Web UI: `/settings.html` and `/api/summarize`
- Telegram summarization flow

without changing the existing Gemini TTS path.

## Recommendation

Implement a dedicated `mistral` provider with its own API key and model config.

Do not route this through `openrouter` unless the product goal is specifically "support Mistral-family models from multiple gateways." For the stated goal, direct Mistral integration is simpler, clearer to users, and easier to debug.

## Current State

Relevant code paths:

- `internal/summarizer/summarizer.go`
- `internal/summarizer/groq.go`
- `internal/summarizer/openrouter.go`
- `internal/server/summarizer_handlers.go`
- `internal/config/config.go`
- `internal/appstate/state.go`
- `cmd/summarize.go`
- `internal/telegrambot/bot.go`
- `web/settings.html`
- `web/settings.js`
- `web/app.js`
- `web/summarizer-models/*.json`

Important constraints in the current implementation:

- The provider registry is hardcoded in multiple places.
- Persisted summarizer keys only include `gemini`, `groq`, and `openrouter`.
- `openrouter` intentionally discards requested/stored model values in `requestModelForProvider()` and `storedModelForProvider()`.
- The web UI only shows providers when a key exists for that provider, except `mock`.

## Implementation Plan

### 1. Add config support for Mistral

Update `internal/config/config.go`:

- Extend `Config` with:
  - `MistralAPIKey string`
  - `MistralModel string`
- Load `MISTRAL_API_KEY` via `loadSecret(...)`.
- Add a default model for summarization, but keep the exact default conservative:
  - prefer a current lightweight chat model available to the account
  - do not hardcode a speculative "free-only" model id unless verified against current Mistral entitlement
- Extend provider auto-detection:
  - after `gemini`
  - before or after `groq` depending on desired precedence

Suggested precedence for lowest surprise:

1. explicit `SUMMARIZER_PROVIDER`
2. `GEMINI_API_KEY`
3. `MISTRAL_API_KEY`
4. `GROQ_API_KEY`
5. `OPENROUTER_API_KEY`

### 2. Add persisted app-state support

Update `internal/appstate/state.go`:

- Extend `SummarizerSection` with `MistralAPIKey string`.
- Add `"mistral"` to in-memory `Keys` maps in:
  - `LoadActiveSummarizerConfig`
  - `Get`
  - `Set`
  - `SaveActiveSummarizerConfig`
- Preserve backward compatibility with existing TOML files by treating the new field as optional.

This is required so the settings page and runtime selection logic can store a Mistral key the same way they already store Groq and OpenRouter keys.

### 3. Add a new provider client

Create `internal/summarizer/mistral.go`.

Mirror the existing Groq/OpenRouter implementation style:

- `type MistralClient struct { apiKey string; model string; resolvedModel string }`
- `func (c *MistralClient) Summarize(ctx context.Context, text, instruction string) (string, error)`
- Optional: implement `ResolvedModel() string`

HTTP behavior:

- `POST https://api.mistral.ai/v1/chat/completions`
- headers:
  - `Content-Type: application/json`
  - `Accept: application/json`
  - `Authorization: Bearer <key>`
- JSON body:
  - `model`
  - `messages`
    - system message for instruction
    - user message for source text

Response parsing:

- decode `model` from the response so the UI can display the effective model
- extract `choices[0].message.content`
- treat `429` as rate limiting
- treat `401` as missing/invalid key
- surface `402` clearly because the quickstart documents it as "no payment method on account"
- surface structured error bodies when available

Keep the request format aligned with the existing provider implementations so higher layers do not need provider-specific branching.

### 4. Register the provider in the summarizer factory

Update `internal/summarizer/summarizer.go`:

- add `case "mistral":`
- select API key from `cfg.MistralAPIKey` with request override support
- select model from `cfg.MistralModel` with request override support
- error if no key is configured

Also update user-facing provider lists in error/help strings:

- `cmd/summarize.go` flag help
- any provider validation messages

### 5. Wire Mistral into HTTP request handling

Update `internal/server/summarizer_handlers.go`:

- add `"mistral"` to `validProviders`
- extend `modelForProvider()` to return `cfg.MistralModel`
- keep `requestModelForProvider()` and `storedModelForProvider()` as pass-through for Mistral

No special-case suppression like `openrouter` should apply here. Users need explicit model selection for Mistral.

### 6. Wire Mistral into CLI and Telegram flows

CLI:

- `cmd/summarize.go` already flows through `summarizer.NewFromRequest(...)`
- once the provider factory supports `mistral`, the CLI path should work automatically
- update flag help text to mention `mistral`

Telegram:

- `internal/telegrambot/bot.go` already resolves the active summarizer through app state
- once config/app-state/provider registry are updated, Mistral should work automatically

This is a good candidate for regression tests because the runtime path is indirect.

### 7. Add settings and web UI support

Update `web/settings.html`:

- add a Mistral provider card with:
  - API key input
  - short note that the free tier has restrictive rate limits
  - link to Mistral key management/docs

Update `web/settings.js`:

- add `keyMistral`
- include `mistral` in `serverConfig.keys`
- include the field in save/load/clear logic

Update `web/app.js`:

- add `mistral` to the provider dropdown catalog
- allow it to appear when a Mistral key exists

Update `web/summarizer-models/`:

- add `mistral.json`
- populate with a curated list of currently supported summarization-capable chat models
- keep this list small and maintainable

Important: because Mistral model availability can vary by account/tier, this JSON should be treated as a shortlist of tested defaults, not a full entitlement catalog.

The quickstart uses `mistral-large-latest` as the first example request. That is a good smoke-test value during development, but not necessarily the best default for a free-tier summarizer, so default-model selection should still be verified against the actual Experiment-plan entitlement.

### 8. Add tests

Add or extend tests for:

- `internal/appstate/state_test.go`
  - verify Mistral keys persist and reload
- new `internal/summarizer/mistral_test.go`
  - success response parsing
  - empty choices handling
  - rate-limit handling
  - non-200 error propagation
- server handler tests, if present or added
  - `validProviders`
  - model selection fallback for `mistral`

At minimum, cover config persistence and HTTP response decoding. Those are the two failure-prone areas for this change.

## Suggested File Changes

- `internal/config/config.go`
- `internal/appstate/state.go`
- `internal/appstate/state_test.go`
- `internal/summarizer/summarizer.go`
- `internal/summarizer/mistral.go`
- `internal/summarizer/mistral_test.go`
- `internal/server/summarizer_handlers.go`
- `cmd/summarize.go`
- `internal/telegrambot/bot.go` if any provider-name strings need updating
- `web/settings.html`
- `web/settings.js`
- `web/app.js`
- `web/summarizer-models/mistral.json`
- `.env.example`
- `README.md` or equivalent user docs

## Open Decisions

### A. Exact default model

This should be validated against the current Mistral account tier during implementation.

Reason:

- the docs confirm the free API tier exists
- the docs queried here do not guarantee one universal free-tier model id across all accounts

So the implementation should avoid baking policy assumptions into code without one live verification pass.

### B. Whether to expose rate-limit telemetry

Groq already stores usage headers and renders a usage widget. Mistral support can ship without this.

Recommendation:

- phase 1: no usage widget
- phase 2: add rate-limit header capture only if Mistral returns stable, useful headers on the free tier

### C. Whether `openrouter` should also expose Mistral models

This is a separate UX decision.

Recommendation:

- keep this change focused on direct `mistral`
- only revisit `openrouter` if the product goal becomes "model marketplace" rather than "named provider selection"

## Verification Plan

### Manual

1. Set `MISTRAL_API_KEY` and `SUMMARIZER_PROVIDER=mistral`.
2. Run `go build -o inti .`
3. Run `./inti summarize "Long text..." --provider mistral`
4. Start `./inti serve`
5. In `/settings.html`, save the Mistral key and select the Mistral provider.
6. Summarize from the web UI.
7. Restart the server and verify provider, model, and key persistence.
8. If Telegram is configured, trigger a summary and verify it uses the saved provider.

### Automated

1. `go test ./...`
2. Add focused tests for new config persistence and Mistral response parsing.

### Error-path checks

Validate the first-request failures documented by Mistral's quickstart:

1. invalid key returns a clear auth error
2. `429` maps to the existing rate-limit UX
3. `402` is not mislabeled as a generic server error

## Scope Control

Keep this change limited to summarization.

Do not:

- generalize TTS providers
- refactor all summarizer backends into a shared HTTP abstraction
- redesign the provider settings UX

Those are valid follow-ups, but they would dilute a straightforward provider addition.
