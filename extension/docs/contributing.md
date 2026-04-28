# Contributing to Inti

## Table of Contents

- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Development](#development)
- [Building](#building)
- [Packaging for release](#packaging-for-release)
- [Project structure](#project-structure)
- [Architecture](#architecture)
- [Message types](#message-types)
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

Vite watches `src/` and rebuilds to `build/` on every change. To load the extension during development, run a full build first (see below) then reload the unpacked extension in your browser.

For UI-only changes in the popup, sidebar, overlay, or options page, the main manual check is to rebuild and reload the unpacked extension for the target browser you changed.

## Building

```bash
# All three targets at once
pnpm run build

# Individual targets
pnpm run build:chrome
pnpm run build:firefox-desktop
pnpm run build:firefox-android
```

Output lands in `dist/{target}/` — load this folder as an unpacked extension in your browser.

## Packaging for release

```bash
pnpm run package:chrome           # → dist/chrome.zip
pnpm run package:firefox-desktop  # → dist/firefox-desktop.zip
pnpm run package:firefox-android  # → dist/firefox-android.zip
```

## Project structure

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

manifests/
├── base.json                  # Shared MV3 manifest
├── chrome.json                # Adds sidePanel
├── firefox-desktop.json       # Adds sidebar_action
└── firefox-android.json       # Adds gecko_android settings

scripts/
├── build-manifests.ts         # Deep-merges base + target overlay → dist/{target}/
└── generate-icons.ts          # Generates placeholder PNG icons
```

## Architecture

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

**Platform routing:**

| Platform | Primary UI | SUMMARY_READY | SHOW_OVERLAY |
|---|---|---|---|
| Chrome desktop | Side panel | ✓ | ✓ |
| Firefox desktop | Sidebar | ✓ | ✓ |
| Firefox Android | Page overlay | — | ✓ |

## Settings and storage

Inti stores all persistent state in extension storage, not page `localStorage`.

| Key | Type | Notes |
|---|---|---|
| `settings` | `Settings` | Includes `apiUrl`, optional `apiKey`, optional `instruction`, and optional `theme` |
| `lastSummary` | `SummaryData` | Last successful summary shown in popup/sidebar/overlay |
| `uiState` | `UIState` | Current UI state such as `loading` or `error` |

Settings surfaces:

- [src/options/Options.svelte](/Users/fernando/Codes/inti-web-extensions/src/options/Options.svelte:1) is the full settings page. It manages `apiUrl`, optional `instruction`, and `theme`.
- [src/shared/SettingsPanel.svelte](/Users/fernando/Codes/inti-web-extensions/src/shared/SettingsPanel.svelte:1) is the compact in-extension settings panel shared by popup and sidebar. It manages `apiUrl`, optional `apiKey`, and `theme`.
- The compact panel uses one shared save button for `apiUrl` and `apiKey`. That button is disabled until either field differs from the last saved values, and status feedback resets as soon as the user edits a field again.

Implementation details:

- [src/shared/storage.ts](/Users/fernando/Codes/inti-web-extensions/src/shared/storage.ts:1) wraps extension storage reads and writes.
- [src/shared/webext.ts](/Users/fernando/Codes/inti-web-extensions/src/shared/webext.ts:7) prefers `browser` on Firefox and falls back to `chrome`.
- [src/background/service-worker.ts](/Users/fernando/Codes/inti-web-extensions/src/background/service-worker.ts:137) reads `settings` before each summarization request.
- If `settings.apiKey` is present, the service worker sends it as the `X-API-Key` header in [src/background/service-worker.ts](/Users/fernando/Codes/inti-web-extensions/src/background/service-worker.ts:191).

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

## Tech stack

| Concern | Choice |
|---|---|
| Build | Vite 5 + Rollup |
| Language | TypeScript (strict) |
| UI | Svelte 5 (runes API) |
| Styling | Scoped CSS in `<style>` blocks |
| Extraction | `@mozilla/readability` |
| State | `chrome.storage.local` |
| Overlay isolation | Closed Shadow DOM |
| Manifest | MV3 unified base + per-target overlays |
