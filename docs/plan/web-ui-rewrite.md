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

The current web UI is not primarily suffering from a styling problem. Most of the architectural rewrite has already landed, but the repo is still carrying cleanup debt from the migration:

- `web-src/` is the intended modern source tree built with Svelte and Vite
- `web/` is still both build output and a place where handwritten runtime files exist
- the main app now mounts the real Svelte workspace directly
- some shared helpers in `web-src/src/lib/*` still import legacy modules from `web/js/*`

The repo is no longer in the worst middle state of two active workspace runtimes, but it has not reached the intended end state either. The remaining work is to finish deleting compatibility seams and make `web/` generated output only.

## Current Problems

1. Compatibility styling cleanup is still incomplete.
   The main runtime is Svelte-owned and `web/` is generated again, but the repo still carries a large compatibility stylesheet that should keep shrinking.

2. Some copied static assets still live in a compatibility shape rather than a fully normalized app-asset structure.
   They now source from `web-src/public/`, but the remaining surface should keep getting simpler.

3. Styling is still hybrid and sticky.
   Tailwind/daisyUI is the chosen direction, but compatibility CSS continues to act like a second styling system instead of a shrinking bridge.

4. Build and test guardrails still need to expand beyond the current import boundary checks.
   The repo now protects against `web-src/src/*` drifting back to `web/js/*`, but later phases still need stronger enforcement around styling cleanup and public-asset hygiene.

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

Current status: complete. The app shell and workspace skeleton are Svelte-owned.

### 3. Rewrite the Main Workspace as Native Svelte Features

Rewrite the main page in vertical slices, not by utility file:

1. `workspace`
   Own the canonical Working Text surface, input mode selection, run mode selection, and shared layout composition.

2. `summarize`
   Own provider/model selectors, summary execution, summary result rendering, and promotion actions.

3. `speech`
   Own provider/model/voice selectors, generate action, playback/download affordances, and `Audio Result` surface.

4. `ocr`
   Own file staging UI, OCR trigger flow, OCR result creation, and promotion actions.

5. `feed` or activity history
   Keep secondary and compact. Do not let it dominate the primary workspace flow.

Phase 2 is complete only when the three primary product surfaces are both rendered and interaction-wired by Svelte-owned feature code:

- `Working Text`
- `Transform Result`
- `Audio Result`

That means this phase is not satisfied by moving markup alone. If the user can still interact with one of those primary surfaces only through a legacy runtime bridge, that feature has not finished Phase 2.

Current status: complete. The primary workspace flow is now rendered and interaction-wired from `web-src/src/*`.

Each feature should render its own Svelte components and talk to shared stores through explicit imports, not DOM ids. Temporary DOM-id compatibility is acceptable only as a migration seam while a feature is still backed by a named legacy bridge. Control ownership belongs to the feature slice even when request orchestration still sits behind a transitional service boundary until Phase 3.

Phase 2 should preserve the current product contract rather than redesign it:

- `Transform Result` remains one shared latest-result surface for OCR and summarization
- `Audio Result` remains one latest audio snapshot, overwritten by the next speech generation
- speech continues to run from `Working Text` only; there is no separate editable speech-input concept
- OCR may still auto-promote only when `Working Text` is empty; otherwise it lands in `Transform Result` until promoted
- display copy such as `Latest Text Result` or `Latest Audio Result` may remain where useful, but the canonical product concepts stay `Transform Result` and `Audio Result`

### 4. Move Side Effects Behind Services

Every side effect should have a narrow service boundary:

- API calls in `lib/api/*`
- file download helpers in `lib/*` or a feature-local service
- audio blob lifecycle in a speech service
- OCR request orchestration in an OCR service
- summary request orchestration in a summarize service

Components should not parse fetch responses, build download filenames, or manipulate audio elements directly unless that behavior is truly local UI state.

For this phase, use two implementation terms precisely:

- `HTTP client` means a thin module that talks to `/api/*`, parses transport responses, and raises normalized errors
- `feature service` means browser-side orchestration for one feature, such as request shaping, result normalization, playback, export, or activity metadata

Do not use `service` as a catch-all for unrelated helpers. Keep feature ownership explicit.

#### Step 4 decisions

1. Extract by feature first, not by generic utility bucket.
   Each primary feature keeps its own orchestration boundary even when multiple features share lower-level helpers.

2. Split thin API transport from feature orchestration.
   The intended shape is:
   - shared HTTP helpers in `lib/api/*`
   - per-feature API clients such as `lib/api/summarize.*`, `lib/api/speech.*`, and `lib/api/ocr.*`
   - per-feature browser orchestration such as summarize, speech, and OCR feature services

3. Move summarizer and speech config persistence under `lib/api/*`.
   UI control modules may shape options and selected values, but they should not own `fetch` calls or response parsing.

4. Keep promotion policy out of feature services.
   OCR, summarize, and speech services may return normalized feature results, but workspace decisions such as when **Promotion** occurs remain in workspace-owned state and actions.

5. Put summary result normalization in the summarize feature service.
   The summarize boundary owns provider/model normalization, rate-limit normalization, and conversion from markdown response payloads into the canonical **Transform Result** shape.

6. Prefer DOM-free normalization helpers where practical.
   If a temporary browser-only markdown-to-plain-text step remains necessary, keep it inside the summarize feature service rather than in components.

7. Treat the speech service as the owner of the full audio blob lifecycle.
   That includes:
   - speech request execution
   - base64 Opus decode to bytes and `Blob`
   - audio snapshot metadata assembly
   - playback start and decode behavior
   - audio export behavior

8. Move shared export helpers into handwritten `web-src/src/lib/*`.
   Filename generation and download helpers are shared implementation utilities, not legacy runtime dependencies or feature-specific product rules.

9. Keep inline status and activity history as separate concepts.
   They may be updated together, but transient status messaging in the **Text Workspace** should not be collapsed into the retained activity history model.

10. Keep strictly local UI resource lifecycle in components when it is not cross-feature behavior.
    For example, image preview object URLs for OCR staging may remain component-owned local UI state.

11. Enforce the boundary before performing a large directory reshuffle.
    First make the side-effect ownership real in the current tree. Move files into `features/*` only after the new boundaries are stable.

Current status: complete. OCR, summarize, speech, and settings transport/orchestration now live behind handwritten `web-src/src/lib/*` modules, and `web-src/src/*` no longer imports shared markdown/text helpers from `web/js/*`.

12. Include feed-side effects in Step 4 only to the extent needed to unblock bridge deletion.
    `feed` remains secondary in the product model, but any remaining `web/js/feed.js` dependency that blocks Step 5 should be absorbed behind a Svelte-owned boundary during or immediately after Step 4.

#### Step 4 completion checks

Step 4 is complete only when all of the following are true:

- no Svelte page or component performs `fetch`, parses `response.json`, builds download filenames, or directly owns cross-feature audio playback behavior
- `/api/*` calls originate from thin handwritten modules in `web-src/src/lib/api/*`
- summarize, speech, and OCR each have one explicit feature-owned orchestration entrypoint
- shared export helpers no longer come from legacy `web/js/*`
- any remaining `web/js/*` dependency is either gone or explicitly documented as a temporary utility seam with a named deletion target
- feed/status side effects no longer force `App.svelte` or the main workspace to keep a legacy runtime bridge alive unintentionally

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

Current status: partially complete. `App.svelte` mounts the real app and no longer bootstraps legacy workspace behavior, but the repo still contains leftover bridge files, legacy helper dependencies, and handwritten files under `web/`.

### 6. Harden the Build and Embedded Output Contract

After the migration:

- keep Vite building from `web-src/` into `web/`
- keep Go tests asserting that embedded secondary pages reference built Svelte entrypoints
- add tests that fail if `App.svelte` imports legacy runtime modules
- document `web/` as generated output only in repo docs if not already explicit

This prevents architectural regression after the rewrite lands.

Current status: not complete. The build still succeeds with the new architecture, but guardrails have not yet been tightened enough to enforce the intended end state.

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

Current status: complete. The repo now documents the source/output boundary explicitly, the remaining legacy seams are named below, and tests enforce that `App.svelte` stays free of legacy runtime imports and that the Phase 0 seam inventory does not expand accidentally.

### Phase 1: Shell and Shared State

- convert remaining shell HTML-string rendering into Svelte components
- move the full main-page shell and static workspace skeleton out of `renderAppShell()` and into Svelte components
- normalize theme and auth wiring behind shared app-layer modules rather than page-specific globals
- keep `web/theme.js` only as a minimal first-paint helper while runtime theme behavior moves behind Svelte-owned app services
- move shared state modules into a durable `lib/state/` home if needed
- remove dead product-shape contracts such as append-capable promotion from public shared contract types

Current status: complete in the main app. The main page shell, workspace skeleton, theme/auth runtime, and shared workspace store now live on the Svelte side.

### Phase 2: Workspace Rewrite

- implement `Working Text`, `Transform Result`, and `Audio Result` as native Svelte-owned surfaces with Svelte-owned interaction wiring
- keep feature behavior identical where possible
- preserve the current UX spec rather than redesigning mid-migration
- migrate in this order unless a local dependency forces a smaller resequencing:
  1. `workspace`
  2. `summarize`
  3. `speech`
  4. `ocr`
- keep `feed` and other secondary activity UI out of scope unless it blocks the primary workspace flow
- remove append-era workspace APIs and public contracts as soon as no active Svelte-owned feature still depends on them

Phase 2 exit criteria:

- `Working Text`, `Transform Result`, and `Audio Result` are rendered and interaction-wired entirely from `web-src/src/*`
- `LegacySummaryBridge` and `LegacySpeechBridge` are deleted
- no legacy runtime bridge remains responsible for the primary workspace flow
- any remaining DOM ids on the main page are compatibility seams with explicit deletion targets, not the ownership model
- tests cover rewritten feature behavior through Svelte-owned seams rather than only through legacy DOM-plumbing tests

Current status: complete. `Working Text`, `Transform Result`, and `Audio Result` are rendered and interaction-wired from `web-src/src/*`, the live app no longer carries legacy workspace bridge files, and the remaining cleanup is confined to shared helper imports and generated-output hygiene covered by later phases.

### Phase 3: Side-Effect Cleanup

- migrate OCR, summarize, and speech orchestration out of legacy modules
- tighten service boundaries
- simplify tests around feature contracts instead of DOM plumbing

Phase 3 exit criteria:

- summarize, speech, and OCR transport logic lives behind thin `lib/api/*` clients
- summarize, speech, and OCR browser-side orchestration lives behind feature-owned service boundaries
- UI control modules no longer mix option shaping with transport concerns
- shared download and filename helpers are handwritten under `web-src/src/*`, not imported from legacy `web/js/*`
- remaining activity/status side effects no longer depend on legacy bridge ownership for the primary workspace flow

Current status: complete. Shared export/download logic lives in `web-src/src/lib/export-service.js`, activity/status ownership is Svelte-side, and the remaining `web-src -> web/js` helper seams have been removed.

### Phase 4: Deletion

- delete `web/js/*` modules that have been absorbed
- delete unused compatibility CSS
- remove `App.svelte` legacy bootstrap path entirely

Current status: complete. The legacy bootstrap path is gone from `App.svelte`, absorbed runtime modules under `web/js/*` have been removed, tests no longer live under `web/`, static root assets source from `web-src/public/`, and the remaining dead compatibility selectors/assets have been deleted with regression coverage.

## Critical Files

| File | Why it matters |
|------|----------------|
| `web-src/src/App.svelte` | Current main app entrypoint; should remain free of legacy runtime imports |
| `web-src/src/pages/MainWorkspacePage.svelte` | Svelte-owned main workspace surface and current integration point for primary flows |
| `web-src/src/components/PageShell.svelte` | Existing shell direction worth keeping |
| `web-src/src/lib/workspace-state.js` | Current best candidate for canonical workspace state |
| `web-src/src/lib/summary-flow.js` | Likely summarize orchestration boundary |
| `web-src/src/lib/speech-flow.js` | Likely speech orchestration boundary |
| `web-src/src/lib/app-runtime.js` | Cross-cutting runtime wiring for theme/auth/config bootstrap that still needs guardrails |
| `web-src/public/style.css` | Minimal shared theme/icon/static-page layer that should not regrow legacy app-specific selectors |
| `tests/web/*.test.ts` | Regression coverage for the rewritten app and build/output contract |
| `vite.config.js` | Source-to-output contract from `web-src/` to `web/` |
| `docs/web-frontend-ux-spec.md` | Product behavior contract to preserve during migration |
| `docs/adr/0002-tailwind-daisyui-web-styling.md` | Styling system decision to enforce during rewrite |

## Current Bridge Inventory

The active mixed-runtime seam is now minimal. The primary workspace no longer depends on legacy runtime bridge components, `web-src/src/*` no longer imports feature helpers from `web/js/*`, and the remaining cleanup is mostly styling and output-shape hygiene.

Bridge files already removed from the live app runtime and no longer counted as active seams:

- `LegacyOCRBridge.svelte`
- `LegacySummaryBridge.svelte`
- `LegacyProvidersBridge.svelte`
- `LegacyMetricsBridge.svelte`

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

1. Main page loads with no legacy workspace bootstrap dependency from `App.svelte`
2. Working Text remains the single canonical text source
3. OCR writes to `Transform Result` and supports promotion
4. Summarization runs from `Working Text` and updates `Transform Result`
5. Speech generation works from the intended source and preserves `Audio Result` after text edits
6. Settings and API Keys pages still load through their Svelte entrypoints
7. Embedded server output still serves the rewritten assets correctly
