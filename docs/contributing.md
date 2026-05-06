# Contributing to Inti

## Table of Contents

- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Development](#development)
- [Building](#building)
- [Packaging for release](#packaging-for-release)
- [Project structure](#project-structure)
- [Architecture](#architecture)
- [Platform routing](#platform-routing)
- [Manifest strategy](#manifest-strategy)
- [Settings and storage](#settings-and-storage)
- [Message types](#message-types)
- [API contract](#api-contract)
- [Adding a new setting](#adding-a-new-setting)
- [Tech stack](#tech-stack)

---

## Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io/installation)

## Setup

```bash
pnpm install
pnpm run icons   # generate placeholder icons (first time only)
```

## Development

```bash
pnpm run dev
```

WXT watches the extension entrypoints and rebuilds the active browser target during development. For manual verification, rebuild when needed and reload the unpacked extension in your browser.

For UI-only changes in the popup, sidebar, overlay, or options page, the main manual check is to rebuild and reload the unpacked extension for the browser target you changed.

## Building

```bash
# All three targets at once
pnpm run build

# Individual targets
pnpm run build:chrome
pnpm run build:firefox
```

Output lands in `dist/chrome-mv3/` or `dist/firefox-mv2/` — load that folder as an unpacked extension in your browser.

## Packaging for release

```bash
pnpm run package:chrome           # → dist/chrome.zip
pnpm run package:firefox          # → dist/firefox.zip
```

The Firefox package is built for one AMO listing that supports both Firefox desktop and Firefox for Android. Compatibility comes from a single manifest that declares both `browser_specific_settings.gecko` and `browser_specific_settings.gecko_android`.

## Project Structure

```
src/
├── background/
│   └── service-worker.ts      # Message hub, API call, badge updates
├── content/
│   ├── content-script.ts      # Readability extraction + Shadow DOM mount
│   └── overlay/
│       ├── Overlay.svelte     # Root overlay (injected into closed Shadow DOM)
│       ├── SummaryView.svelte
│       ├── LoadingState.svelte
│       └── ErrorState.svelte
├── sidebar/
│   ├── sidebar.html
│   ├── sidebar.ts
│   └── Sidebar.svelte
├── popup/
│   ├── popup.html
│   ├── popup.ts
│   └── Popup.svelte           # Desktop launcher / Android full UI
├── options/
│   ├── options.html
│   ├── options.ts
│   └── Options.svelte         # Settings page (API URL, instruction, theme)
└── shared/
    ├── types.ts               # Shared TypeScript types
    ├── constants.ts           # Storage keys and badge config
    ├── storage.ts             # chrome.storage.local / browser.storage.local typed wrappers
    └── SettingsPanel.svelte   # In-extension settings panel (API URL, API key, theme)

wxt.config.ts                  # Single manifest source of truth for Chrome + Firefox

scripts/
├── clean-firefox-dist.mjs     # Removes stale Firefox build output before WXT runs
└── generate-icons.ts          # Generates placeholder PNG icons
```

## Architecture

Two separate Vite builds are intentional and should not be merged:

| Config | Entries | Format | Why |
|---|---|---|---|
| `vite.scripts.config.ts` | service worker, content script | ES, no exports | Firefox `background.scripts` must load classic-script-compatible output |
| `vite.config.ts` | popup, sidebar, options (HTML) | ES module | HTML pages can use module output and shared chunks |

WXT generates the final manifest and entrypoint files directly in `dist/chrome-mv3/` and `dist/firefox-mv2/`. The Firefox build is cleaned first so stale output cannot leak across rebuilds.

Firefox MV3 uses `background.scripts`, not `background.service_worker`. That means the background bundle cannot contain `import` or `export` syntax. The scripts build keeps the generated output compatible with that constraint.

```
User click
    │
    ▼
Popup / Sidebar
    │  TRIGGER_SUMMARY
    ▼
Service Worker ──── badge: …
    │  reads settings from storage
    │  EXTRACT
    ▼
Content Script (Readability)
    │  ArticleData
    ▼
Service Worker ──── POST {apiUrl}/api/summarize ──── { summary }
    │                                     │
    │  save to extension storage ◄────────┘
    │
    ├── badge: ✓ / !
    ├── SUMMARY_READY → Sidebar / Popup
    └── SHOW_OVERLAY → Content Script
                           │
                           ▼
                    Shadow DOM (closed)
                    Overlay.svelte
```

## Platform Routing

| Platform | Primary UI | SUMMARY_READY | SHOW_OVERLAY |
|---|---|---|---|
| Chrome desktop | Side panel | ✓ | ✓ |
| Firefox desktop | Sidebar | ✓ | ✓ |
| Firefox Android | Page overlay | — | ✓ |

The service worker routes by platform. Android skips `SUMMARY_READY` because there is no sidebar UI and relies on the overlay path.

## Manifest Strategy

`wxt.config.ts` is the only manifest source of truth.

- Chrome builds to MV3 with the side panel manifest entries.
- Firefox builds to MV2 with one package that supports both desktop and Android.
- Firefox compatibility is declared in one manifest via both `browser_specific_settings.gecko` and `browser_specific_settings.gecko_android`.
- The Firefox package includes both `popup.html` and `sidebar.html` so the same AMO listing can serve desktop and Android.

## Settings and Storage

Inti stores all persistent state in extension storage, not page `localStorage`.

| Key | Type | Notes |
|---|---|---|
| `settings` | `Settings` | Includes `apiUrl`, optional `apiKey`, optional `instruction`, and optional `theme` |
| `lastSummary` | `SummaryData` | Last successful summary shown in popup/sidebar/overlay |
| `uiState` | `UIState` | Current UI state such as `loading` or `error` |

Settings surfaces:

- `src/options/Options.svelte` is the full settings page. It manages `apiUrl`, optional `instruction`, and `theme`.
- `src/shared/SettingsPanel.svelte` is the compact in-extension settings panel shared by popup and sidebar. It manages `apiUrl`, optional `apiKey`, and `theme`.
- The compact panel uses one shared save button for `apiUrl` and `apiKey`. That button is disabled until either field differs from the last saved values, and status feedback resets as soon as the user edits a field again.

Implementation details:

- `src/shared/storage.ts` wraps extension storage reads and writes.
- `src/shared/webext.ts` prefers `browser` on Firefox and falls back to `chrome`.
- `src/background/service-worker.ts` reads `settings` before each summarization request.
- If `settings.apiKey` is present, the service worker sends it as the `X-API-Key` header.

Firefox debugging:

- Open `about:debugging`
- Inspect the extension
- In the extension toolbox, open `Storage`
- Check `Extension Storage` for the `settings`, `lastSummary`, and `uiState` entries

## Message types

Defined in `src/shared/types.ts`:

| Action | Direction | Payload |
|---|---|---|
| `TRIGGER_SUMMARY` | Popup/Sidebar → SW | — |
| `EXTRACT` | SW → Content Script | — |
| `SHOW_OVERLAY` | SW → Content Script | `SummaryData` |
| `SUMMARY_READY` | SW → Popup/Sidebar | `SummaryData` |
| `ERROR` | SW → Popup/Sidebar | `string` |

## API Contract

The service worker posts to the configured `settings.apiUrl` with:

```json
{ "title": "string", "text": "string" }
```

Expected response:

```json
{ "summary": "string" }
```

Any non-2xx response or network error sets the badge to `!` and broadcasts an `ERROR` message.

## Adding a New Setting

1. Add the field to the `Settings` interface in `src/shared/types.ts`.
2. Expose it in the appropriate settings surface.
3. Read it where needed via the storage helpers in `src/shared/storage.ts`.
4. Update both `README.md` and this file if the setting changes user-visible behavior.

## Tech Stack

| Concern | Choice |
|---|---|
| Build | Vite 5 + Rollup |
| Language | TypeScript (strict) |
| UI | Svelte 5 (runes API) |
| Styling | Scoped CSS in `<style>` blocks |
| Extraction | `@mozilla/readability` |
| State | `chrome.storage.local` |
| Overlay isolation | Closed Shadow DOM |
| Manifest | WXT-generated from `wxt.config.ts` |
