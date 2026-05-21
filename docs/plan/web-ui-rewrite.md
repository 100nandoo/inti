# Plan: Web UI Rewrite

## Table of Contents

- [Context](#context)
- [Current Problems](#current-problems)
- [Target Architecture](#target-architecture)
- [Design Constraints](#design-constraints)
- [Target Directory Shape](#target-directory-shape)
- [Migration Strategy](#migration-strategy)
  - [1. Freeze the Legacy Boundary](#1-freeze-the-legacy-boundary)
  - [2. Establish the App Shell and Shared Contracts](#2-establish-the-app-shell-and-shared-contracts)
  - [3. Rewrite the Main Workspace as Native Svelte Features](#3-rewrite-the-main-workspace-as-native-svelte-features)
  - [4. Move Side Effects Behind Services](#4-move-side-effects-behind-services)
  - [5. Remove Legacy Runtime and Bridge Code](#5-remove-legacy-runtime-and-bridge-code)
  - [6. Harden the Build and Embedded Output Contract](#6-harden-the-build-and-embedded-output-contract)
- [Phase Breakdown](#phase-breakdown)
- [Critical Files](#critical-files)
- [Risks and Guardrails](#risks-and-guardrails)
- [Definition of Done](#definition-of-done)
- [Verification](#verification)

## Context

The current web UI is not primarily suffering from a styling problem. It is suffering from a split architecture:

- `web-src/` is the intended modern source tree built with Svelte and Vite
- `web/` is both build output and a place where runtime logic still exists
- the main app mounts Svelte and then bootstraps legacy imperative modules from `web/js/*`
- some state already lives in `web-src/src/lib/*`, while behavior and DOM ownership remain split across old and new code

This produces the worst possible middle state: two active runtimes, two ownership models, and no single clear source of truth for the main page.

The rewrite should finish the migration already underway instead of introducing a third architecture.

## Current Problems

1. The main page has two live architectures at once.
   `web-src/src/App.svelte` mounts the app shell, then defers the real workspace behavior to legacy modules in `web/js/*`.

2. `web/` is not treated as build output only.
   Generated assets and handwritten runtime code live side by side, which makes ownership and cleanup ambiguous.

3. Markup ownership is split.
   Svelte components exist for page shells and secondary pages, but large parts of the main page still render via HTML string helpers and DOM mutation.

4. State and side effects are not separated cleanly.
   The repo already has a good store boundary in `workspace-state.js`, but user flows still rely on imperative DOM wiring.

5. Styling is hybrid and sticky.
   Tailwind/daisyUI is the chosen direction, but compatibility CSS continues to act like a second styling system instead of a shrinking bridge.

## Target Architecture

The rewrite should standardize on:

- `Svelte 5` for all page markup and interaction wiring
- `Vite` for build orchestration
- `Tailwind CSS + daisyUI` as the default styling system
- `web-src/` as the only handwritten web source tree
- `web/` as generated output only

The main architectural rule:

The browser UI should be composed from feature modules that own their markup, state subscriptions, and user interactions, while network/audio/download behavior is delegated to explicit service modules.

## Design Constraints

1. Preserve the current deployment model.
   Inti ships as a single Go binary with embedded web assets. The rewrite should keep the current Vite build to `web/` and Go embedding flow.

2. Preserve the current product shape.
   The core UX model in `docs/web-frontend-ux-spec.md` remains valid: one canonical `Working Text`, one shared `Transform Result`, one separate `Audio Result`, replace-only `Promotion`, and speech generation from `Working Text`.

3. Do not introduce a client-side router.
   Separate entry pages for `/`, `/settings.html`, `/api-keys.html`, and `/401.html` are appropriate for the embedded app.

4. Keep migration incremental.
   The app must remain runnable while features move from legacy modules into Svelte.

5. Prefer deletion over compatibility.
   Temporary adapters are acceptable only when they shorten the migration path. They should not become permanent infrastructure.

## Target Directory Shape

```text
web-src/
  index.html
  settings.html
  api-keys.html
  src/
    entries/
      app.js
      settings.js
      api-keys.js
    app/
      shell/
      theme/
      auth/
    features/
      workspace/
      ocr/
      summarize/
      speech/
      settings/
      api-keys/
    lib/
      api/
      state/
      utils/
    components/
      PageShell.svelte
      Icon.svelte
      ButtonGroup.svelte
```

Notes:

- `app/` holds boot and cross-cutting app concerns
- `features/` holds product slices with clear ownership
- `lib/api/` holds thin HTTP clients only
- `lib/state/` holds shared stores and state transition helpers
- `components/` holds reusable presentational building blocks, not product logic

## Migration Strategy

### 1. Freeze the Legacy Boundary

Before rewriting, make the boundary explicit:

- no new product logic in `web/js/*`
- no new handwritten product logic in `web/` or `web/assets/*`
- no new direct DOM mutation from `web-src/src/App.svelte`
- no new `web-src/src/lib/*` imports from `web/js/*` without a named deletion target

`web/js/*` should be treated as legacy adapters that exist only until their owning feature has a native Svelte replacement.

Phase 0 does not mean every handwritten file under `web/` disappears immediately. Existing support files such as `web/theme.js` may remain temporarily, but they are tolerated exceptions rather than the desired long-term source tree. No new product behavior should be added there.

Phase 0 should also reconcile documentation before the code freeze is considered complete. `CONTEXT.md`, ADRs, the UX spec, and the rewrite plan must all describe the same product contract:

- `Working Text` is the single canonical editable text source
- `Transform Result` is the canonical text-result concept; `Latest Text Result` is display copy only when used
- `Promotion` is replace-only
- speech generation runs from `Working Text`
- `Audio Result` is the canonical audio concept; `Latest Audio Result` is display copy only when used
- `Audio Result` remains independent after later text edits

### 2. Establish the App Shell and Shared Contracts

Create a clean baseline in `web-src/src/`:

- keep page entrypoints in `src/entries/*`
- replace HTML-string shell helpers with real Svelte components
- move the full main-page shell and static workspace skeleton into Svelte instead of leaving it in `renderAppShell()`
- move shared contracts into stable `lib/state/` and `lib/api/` modules
- ensure theme, auth, and page-shell behavior are owned by the Svelte app layer
- keep any temporary legacy bridges behind feature-owned Svelte roots with explicit deletion targets

At the end of this phase, the app shell and workspace skeleton should be fully Svelte even if feature behavior is still partially legacy.

### 3. Rewrite the Main Workspace as Native Svelte Features

Rewrite the main page in vertical slices, not by utility file:

1. `workspace`
   Own the canonical Working Text surface, input mode selection, run mode selection, and shared layout composition.

2. `ocr`
   Own file staging UI, OCR trigger flow, OCR result creation, and promotion actions.

3. `summarize`
   Own provider/model selectors, summary execution, summary result rendering, and promotion actions.

4. `speech`
   Own provider/model/voice selectors, generate action, playback/download affordances, and `Audio Result` surface.

5. `feed` or activity history
   Keep secondary and compact. Do not let it dominate the primary workspace flow.

Each feature should render its own Svelte components and talk to shared stores through explicit imports, not DOM ids. Temporary DOM-id compatibility is acceptable only as a migration seam while a feature is still backed by a named legacy bridge.

### 4. Move Side Effects Behind Services

Every side effect should have a narrow service boundary:

- API calls in `lib/api/*`
- file download helpers in `lib/*` or a feature-local service
- audio blob lifecycle in a speech service
- OCR request orchestration in an OCR service
- summary request orchestration in a summarize service

Components should not parse fetch responses, build download filenames, or manipulate audio elements directly unless that behavior is truly local UI state.

### 5. Remove Legacy Runtime and Bridge Code

Once a feature has a native Svelte implementation:

- delete the corresponding `web/js/*` module
- remove any bridge import from `App.svelte`
- remove compatibility CSS that only existed for the deleted markup
- remove legacy HTML string helpers that are no longer referenced

The intended end state is simple:

- `App.svelte` mounts the real app
- there is no runtime bootstrap of legacy workspace code
- `web/` contains only compiled assets and static pages

### 6. Harden the Build and Embedded Output Contract

After the migration:

- keep Vite building from `web-src/` into `web/`
- keep Go tests asserting that embedded secondary pages reference built Svelte entrypoints
- add tests that fail if `App.svelte` imports legacy runtime modules
- document `web/` as generated output only in repo docs if not already explicit

This prevents architectural regression after the rewrite lands.

## Phase Breakdown

### Phase 0: Stabilize

- reconcile the UX spec and rewrite plan with `CONTEXT.md`, existing ADRs, and current code behavior
- declare `web-src/` the only preferred home for new handwritten app logic
- stop adding new runtime feature logic to `web/js/*`
- stop adding new handwritten product logic under `web/`
- inventory every active bridge from Svelte-owned code into legacy runtime code and give each bridge a named deletion target
- add a short repo note or test guard that makes the freeze enforceable

Phase 0 exit criteria:

- no new runtime feature code is added under `web/js/*`
- no new handwritten product logic is added under `web/`
- the authoritative docs agree on `Working Text`, `Transform Result`, `Audio Result`, and replace-only `Promotion`
- every remaining legacy bridge has an owner and a deletion target

### Phase 1: Shell and Shared State

- convert remaining shell HTML-string rendering into Svelte components
- move the full main-page shell and static workspace skeleton out of `renderAppShell()` and into Svelte components
- normalize theme and auth wiring behind shared app-layer modules rather than page-specific globals
- keep `web/theme.js` only as a minimal first-paint helper while runtime theme behavior moves behind Svelte-owned app services
- move shared state modules into a durable `lib/state/` home if needed
- remove dead product-shape contracts such as append-capable promotion from public shared contract types

### Phase 2: Workspace Rewrite

- implement `Working Text`, `Transform Result`, and `Audio Result` as native Svelte surfaces
- keep feature behavior identical where possible
- preserve the current UX spec rather than redesigning mid-migration

### Phase 3: Side-Effect Cleanup

- migrate OCR, summarize, and speech orchestration out of legacy modules
- tighten service boundaries
- simplify tests around feature contracts instead of DOM plumbing

### Phase 4: Deletion

- delete `web/js/*` modules that have been absorbed
- delete unused compatibility CSS
- remove `App.svelte` legacy bootstrap path entirely

## Critical Files

| File | Why it matters |
|------|----------------|
| `web-src/src/App.svelte` | Current mixed-runtime entrypoint; primary place to remove legacy bootstrap |
| `web-src/src/components/PageShell.svelte` | Existing shell direction worth keeping |
| `web-src/src/lib/workspace-state.js` | Current best candidate for canonical workspace state |
| `web-src/src/lib/summary-flow.js` | Likely summarize orchestration boundary |
| `web-src/src/lib/speech-flow.js` | Likely speech orchestration boundary |
| `web-src/src/lib/app-shell.js` | HTML-string shell helper to replace with component ownership |
| `web/js/*.js` | Legacy runtime surface to absorb feature by feature |
| `web/style.css` | Compatibility layer to shrink aggressively |
| `vite.config.js` | Source-to-output contract from `web-src/` to `web/` |
| `docs/web-frontend-ux-spec.md` | Product behavior contract to preserve during migration |
| `docs/adr/0002-tailwind-daisyui-web-styling.md` | Styling system decision to enforce during rewrite |

## Current Bridge Inventory

The current mixed-runtime seam is already small enough to name directly. Phase 0 should keep this inventory explicit and shrink it over time rather than letting new bridges appear.

- `web-src/src/App.svelte` bootstraps legacy runtime modules from `web/js/feed.js`, `web/js/metrics.js`, `web/js/ocr.js`, `web/js/providers.js`, `web/js/summarizer.js`, `web/js/tts.js`, and `web/js/voices.js`
- `web-src/src/lib/summary-flow.js` imports `web/js/markdown.js`
- `web-src/src/lib/speech-flow.js` imports `web/js/filename.js`, `web/js/download.js`, and `web/js/text.js`
- `web-src/src/lib/result-surface.js` imports `web/js/filename.js`, `web/js/download.js`, `web/js/markdown.js`, and `web/js/text.js`
- `web-src/src/lib/app-shell.js` still owns main-page markup as HTML strings and should be treated as transitional shell code, not a stable end-state component boundary

## Risks and Guardrails

1. Risk: accidental second rewrite during migration.
   Guardrail: keep the current UX model stable and defer product redesign until after architecture cleanup.

2. Risk: permanent bridge code.
   Guardrail: every adapter introduced during migration must have a named deletion target.

3. Risk: feature regressions hidden by visual changes.
   Guardrail: preserve existing behavior and write or extend tests around flow contracts before deleting legacy modules.

4. Risk: `web/` keeps attracting handwritten edits.
   Guardrail: treat any new manual product-logic change under `web/` or `web/assets/` as a process failure unless it is a deliberate temporary exception with a named deletion target.

5. Risk: styling cleanup stalls.
   Guardrail: each feature migration should remove some compatibility CSS instead of only adding new component classes.

## Definition of Done

The rewrite is complete when all of the following are true:

- the main workspace is rendered and controlled entirely from `web-src/src/*`
- `App.svelte` no longer imports or bootstraps `web/js/*`
- `web/` contains generated artifacts only
- OCR, summarize, speech, and workspace flows each have clear feature ownership
- Tailwind/daisyUI is the default styling path, with only minimal leftover compatibility CSS
- the app still builds into embedded static assets consumed by the Go server without special-case runtime shims

## Verification

```sh
npm run typecheck:web
npm run test:web
npm run build:web
go test ./...
```

Manual checks:

1. Main page loads with no legacy bootstrap dependency from `App.svelte`
2. Working Text remains the single canonical text source
3. OCR writes to `Transform Result` and supports promotion
4. Summarization runs from `Working Text` and updates `Transform Result`
5. Speech generation works from the intended source and preserves `Audio Result` after text edits
6. Settings and API Keys pages still load through their Svelte entrypoints
7. Embedded server output still serves the rewritten assets correctly
