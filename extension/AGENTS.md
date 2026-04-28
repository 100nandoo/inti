# Inti — AGENTS.md

Browser extension that summarizes articles using AI. Targets Chrome desktop, Firefox desktop, and Firefox Android from a single codebase.

## Commands

```bash
pnpm install                  # install dependencies
pnpm run icons                # generate placeholder icons (first time only)
pnpm run build:chrome         # build Chrome target → dist/chrome/
pnpm run build:firefox-desktop
pnpm run build:firefox-android
pnpm run build                # all three targets
pnpm run dev                  # watch mode (both Vite configs in parallel)
```

There is no test runner. Verify by loading `dist/{target}/` as an unpacked extension in the browser.

## Architecture

**Two separate Vite builds** (critical — do not merge them):

| Config | Entries | Format | Why |
|---|---|---|---|
| `vite.scripts.config.ts` | service worker, content script | ES, no exports | Must load as classic scripts in Firefox (`background.scripts`) |
| `vite.config.ts` | popup, sidebar, options (HTML) | ES module | Run in HTML page context, can share chunks |

The scripts build runs first (`emptyOutDir: true`), the pages build appends (`emptyOutDir: false`). Output lands in `build/`, then `scripts/build-manifests.ts` copies it to `dist/{target}/` and writes the merged manifest.

**Why classic scripts for the background?** Firefox MV3 uses `background.scripts` (not `background.service_worker`), which loads files as classic scripts. Classic scripts reject ES module syntax (`import`/`export`). The scripts build uses `preserveEntrySignatures: false` so Rollup never adds a synthetic `export {}`, producing import/export-free output.

## Message flow

```
Popup / Sidebar
  │  TRIGGER_SUMMARY
  ▼
Service Worker
  │  reads apiUrl from chrome.storage.local (Settings)
  │  sets badge: …
  │  EXTRACT
  ▼
Content Script  →  Readability.parse(document.cloneNode())
  │  ArticleData
  ▼
Service Worker  →  POST apiUrl  →  { summary }
  │  saves SummaryData to chrome.storage.local
  │  sets badge: ✓ or !
  ├── SUMMARY_READY → Sidebar / Popup   (desktop only)
  └── SHOW_OVERLAY → Content Script     (all platforms)
                          │
                          ▼
                   Shadow DOM (closed)
                   Overlay.svelte
```

Platform routing in service worker: `navigator.userAgent.includes('Android')` — Android skips `SUMMARY_READY` (no sidebar), desktop sends both.

## Key files

| File | Role |
|---|---|
| `src/shared/types.ts` | All shared TypeScript types (`Message`, `ArticleData`, `SummaryData`, `Settings`, `UIState`) |
| `src/shared/constants.ts` | Storage keys (`lastSummary`, `settings`), badge config |
| `src/shared/storage.ts` | Typed `chrome.storage.local` wrappers (`getStorage`, `setStorage`, `clearStorage`) |
| `src/background/service-worker.ts` | Message hub, reads `apiUrl` from storage, calls API, updates badge |
| `src/content/content-script.ts` | Handles `EXTRACT` (Readability) and `SHOW_OVERLAY` (Shadow DOM mount) |
| `src/content/overlay/Overlay.svelte` | Root overlay component, mounted into a closed Shadow DOM |
| `src/options/Options.svelte` | Settings page — user enters and saves API URL |
| `manifests/base.json` | Shared MV3 fields (no `background` — that's per-target) |
| `manifests/chrome.json` | Adds `background.service_worker`, `sidePanel` |
| `manifests/firefox-desktop.json` | Adds `background.scripts`, `sidebar_action` |
| `manifests/firefox-android.json` | Adds `background.scripts`, `gecko_android` |
| `scripts/build-manifests.ts` | Deep-merges base + target overlay, copies `build/` → `dist/{target}/` |

## Manifest strategy

`background` is **not** in `base.json` — it differs per target:
- Chrome: `{ "service_worker": "background/service-worker.js" }`
- Firefox: `{ "scripts": ["background/service-worker.js"] }`

`scripts/build-manifests.ts` deep-merges base + overlay. Arrays are unioned (no duplicates). Objects recurse. Scalars: overlay wins.

## Storage

All state lives in `chrome.storage.local`. Never use `localStorage` or `storage.sync`.

| Key | Type | Contents |
|---|---|---|
| `lastSummary` | `SummaryData` | Last successful summary (restored on popup/sidebar open) |
| `settings` | `Settings` | User config — currently just `apiUrl` |

## Svelte conventions

- **Svelte 5 runes only**: `$state`, `$derived`, `$effect`, `$props`
- All styles in scoped `<style>` blocks — no external CSS, no Tailwind
- Overlay sub-components (`SummaryView`, `LoadingState`, `ErrorState`) are shared by both the overlay (shadow DOM) and the popup/sidebar pages
- Shadow DOM: host element `#inti-root` is `position:fixed; top:0; right:0; pointer-events:none`. The Svelte component sets `pointer-events:all` on the panel itself

## API contract

The service worker POSTs to `settings.apiUrl`:

```
POST {apiUrl}
Content-Type: application/json

{ "title": "string", "text": "string" }
```

Expected response:

```json
{ "summary": "string" }
```

Any non-2xx response or network error sets the badge to `!` and broadcasts an `ERROR` message with the error string as payload.

## Adding a new setting

1. Add the field to the `Settings` interface in `src/shared/types.ts`
2. Add an input in `src/options/Options.svelte`
3. Read it in whichever module needs it via `getStorage<Settings>(STORAGE_KEY_SETTINGS)`

## Node / tooling constraints

- Node.js 18+ required; Vite 5 is pinned (`^5`) because Vite 6 requires Node 22.12+ and the project targets Node 22.2
- Package manager: pnpm (declared via `packageManager` in package.json)
- Icons are generated via `scripts/generate-icons.ts` — pure Node, no canvas dependency
