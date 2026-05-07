# Plan: Refactor `web/app.js` into Focused Frontend Modules

## Table of Contents

- [Context](#context)
- [Current State](#current-state)
- [Goal](#goal)
- [Non-Goals](#non-goals)
- [Proposed Module Split](#proposed-module-split)
- [Implementation Steps](#implementation-steps)
  - [1. Establish a Thin Entry Point](#1-establish-a-thin-entry-point)
  - [2. Extract Shared DOM References](#2-extract-shared-dom-references)
  - [3. Extract Pure Formatting Helpers](#3-extract-pure-formatting-helpers)
  - [4. Extract Activity Feed and Status UI](#4-extract-activity-feed-and-status-ui)
  - [5. Extract TTS Workflow](#5-extract-tts-workflow)
  - [6. Extract Summarizer Workflow](#6-extract-summarizer-workflow)
  - [7. Extract OCR Workspace Logic](#7-extract-ocr-workspace-logic)
  - [8. Extract Provider and Voice Selectors](#8-extract-provider-and-voice-selectors)
  - [9. Centralize Shared UI State](#9-centralize-shared-ui-state)
  - [10. Final Cleanup of `web/app.js`](#10-final-cleanup-of-webappjs)
- [Suggested File Layout](#suggested-file-layout)
- [Design Rules](#design-rules)
- [Verification](#verification)

## Context

`web/app.js` has grown into the main control plane for the web UI. It currently handles OCR file staging, summarizer settings, provider/model selection, TTS requests, summary rendering, summary downloads, activity feed updates, and general UI state toggles.

This works, but it increases the cost of routine changes:

- unrelated features sit in the same file and same lexical scope
- new features tend to append more globals and event listeners
- shared helpers are difficult to identify because feature code and generic UI code are interleaved
- small changes carry higher regression risk because one file owns most browser-side behavior

The issue is not only file length. The deeper problem is responsibility sprawl.

## Current State

- `web/app.js` is roughly 1000 lines and is organized only by comment sections
- DOM querying, state, event binding, network requests, rendering, and download helpers all live in one script
- feature boundaries exist conceptually, but not structurally
- the app is still a good fit for vanilla JavaScript; a framework migration is not required to improve maintainability

Current responsibility clusters inside `web/app.js`:

- OCR staging and paste/drag-drop
- summarizer provider and model configuration
- voice selection and filtering
- TTS synthesis and playback
- summary rendering, copy, and download actions
- activity feed and status updates
- shared formatting and filename helpers

## Goal

1. Reduce `web/app.js` to a thin entry point that wires feature modules together.
2. Split browser logic by responsibility, not by arbitrary helper categories.
3. Keep the frontend in vanilla JS with ES modules.
4. Preserve current behavior while making future changes safer and easier.
5. Make it possible to test or reason about one feature without reading the entire frontend script.

## Non-Goals

- Do not migrate the app to React, Vue, Svelte, or another frontend framework.
- Do not redesign the UI as part of this refactor.
- Do not change API contracts unless a feature extraction genuinely requires it.
- Do not rewrite everything in one large patch; the refactor should be incremental.

## Proposed Module Split

Split by responsibility first:

- `web/main.js`
  App entry point. Initializes feature modules and binds high-level events.
- `web/js/dom.js`
  Centralized DOM lookups and exported element references.
- `web/js/state.js`
  Shared mutable UI state such as `processing`, `lastWavBlob`, and summarizer config.
- `web/js/filename.js`
  Filename derivation and sanitization helpers.
- `web/js/date.js`
  Date and time formatting helpers for filenames and activity timestamps.
- `web/js/markdown.js`
  Markdown rendering helpers if the app keeps a local renderer.
- `web/js/text.js`
  Small text helpers such as truncation and HTML escaping.
- `web/js/feed.js`
  Activity feed, status text, and related UI helpers.
- `web/js/tts.js`
  Synthesis requests, audio blob management, playback, and audio downloads.
- `web/js/summarizer.js`
  Summarize request flow, summary rendering, summary download behavior, and “use summary for TTS”.
- `web/js/ocr.js`
  Drag/drop, paste handling, staged files, preview modal, OCR workspace interactions.
- `web/js/providers.js`
  Summarizer provider/model loading, persistence, and selection behavior.
- `web/js/voices.js`
  Voice catalog, gender filter logic, and voice/model select population.

This split aligns with how the UI is already conceptually grouped.

## Implementation Steps

### 1. Establish a Thin Entry Point

Convert the current page bootstrap to a thin module entry point:

- rename or replace `web/app.js` with `web/main.js`
- keep only startup orchestration there
- call initialization functions from feature modules instead of keeping feature bodies inline

Target shape:

```js
import { initOCR } from './js/ocr.js';
import { initTTS } from './js/tts.js';
import { initSummarizer } from './js/summarizer.js';
import { initProviders } from './js/providers.js';
import { initVoices } from './js/voices.js';
import { initUI } from './js/feed.js';

initUI();
initProviders();
initVoices();
initOCR();
initSummarizer();
initTTS();
```

The entry point should not contain feature internals.

### 2. Extract Shared DOM References

Create `web/js/dom.js` and move all `document.getElementById(...)` calls there.

Why:

- removes repetitive DOM lookups from feature files
- makes dependencies explicit
- gives each module a stable import surface

Example:

```js
export const textInput = document.getElementById('text-input');
export const submitBtn = document.getElementById('submit-btn');
export const summaryText = document.getElementById('summary-text');
```

This should be a dumb registry, not a behavior module.

### 3. Extract Pure Helper Modules

Move pure helpers first because they are low-risk, but do not collapse them into one generic formatting file.

Split by helper domain:

- `web/js/filename.js`
  - filename sanitization
  - title/topic extraction for downloads
  - file extension-specific filename assembly
- `web/js/date.js`
  - `formatFilenameDate`
  - activity timestamp formatting
- `web/js/text.js`
  - `truncate`
  - HTML escaping if still needed
  - lightweight string cleanup helpers
- `web/js/markdown.js`
  - `renderMarkdown`
  - `inlineMarkdown`
  - any markdown-specific cleanup helpers
- `web/js/bytes.js`
  - `formatFileSize`

Why this split:

- filenames, markdown, dates, and byte formatting evolve independently
- it avoids recreating a generic `format.js` dumping ground
- dependencies become clearer for feature modules

This is still the safest first extraction because these modules do not require shared mutable state.

### 4. Extract Activity Feed and Status UI

Create `web/js/feed.js` for:

- `addFeed`
- `updateFeedItem`
- `setStatus`
- `setPlaying` if it stays purely visual

This module should depend on DOM refs plus the narrowly scoped helper modules it actually uses, but not on OCR or summarizer internals.

That gives the rest of the app a consistent UI reporting surface.

### 5. Extract TTS Workflow

Create `web/js/tts.js` and move:

- `synthesizeText`
- `playAudio`
- `playWAV`
- direct `.opus` download behavior
- TTS-related button handlers

This module should own:

- calling `/api/speak`
- storing or updating the last generated audio blob
- audio download naming
- reporting feed/status updates via `feed.js`

Do not let summary code reach directly into TTS internals beyond a small public API like:

```js
export async function synthesizeText(text) {}
export function hasGeneratedAudio() {}
export function downloadGeneratedAudio(sourceText) {}
```

### 6. Extract Summarizer Workflow

Create `web/js/summarizer.js` and move:

- `summarizeText`
- summary rendering
- summary copy and download handlers
- summary-to-TTS handoff
- summary action state sync if it stays summary-specific

This module should own:

- calling `/api/summarize`
- rendering markdown into the summary area
- capturing provider/model metadata for display
- deriving summary filenames from headings or topic lines

It should expose a small API to the rest of the app rather than mutating unrelated DOM from outside.

### 7. Extract OCR Workspace Logic

Create `web/js/ocr.js` and move:

- drag/drop handlers
- paste handling
- staged file management
- image preview modal behavior
- OCR result and workspace text interactions

This is likely the most DOM-coupled module, so it should be extracted after the helper and network-driven modules are already isolated.

OCR can then expose only the things other modules actually need, such as:

```js
export function getWorkspaceText() {}
export function setWorkspaceText(text) {}
export function initOCR() {}
```

### 8. Extract Provider and Voice Selectors

Split selector logic into:

- `web/js/providers.js`
  Summarizer provider/model loading and persistence
- `web/js/voices.js`
  TTS voice list, filtering, and default selection

This is a good separation because summarizer provider state and TTS voice state are unrelated domains.

Avoid one “selectors.js” file that recreates the current coupling problem at a smaller scale.

### 9. Centralize Shared UI State

Create `web/js/state.js` for the minimum shared mutable state:

- `processing`
- `lastWavBlob`
- `summarizerConfig`
- staged file list if OCR remains the only owner, keep it inside `ocr.js` instead

Recommended pattern:

- export getter/setter functions
- avoid unconstrained direct mutation from multiple modules

Example:

```js
let processing = false;

export function isProcessing() {
  return processing;
}

export function setProcessing(value) {
  processing = value;
}
```

The goal is not a full state-management architecture. The goal is to stop feature modules from sharing hidden globals.

### 10. Final Cleanup of `web/app.js`

After modules are extracted:

- remove duplicated helpers
- remove dead DOM references
- remove obsolete globals
- ensure there is one clear bootstrap path
- rename the remaining entry script if `main.js` is a better description than `app.js`

At that point the old `web/app.js` should either disappear or shrink to a small orchestrator.

## Suggested File Layout

```text
web/
  index.html
  main.js
  js/
    dom.js
    state.js
    filename.js
    date.js
    markdown.js
    text.js
    bytes.js
    feed.js
    tts.js
    summarizer.js
    ocr.js
    providers.js
    voices.js
```

If the project prefers fewer files, `providers.js` and `voices.js` could be merged later, but they should start separate during the extraction so ownership stays clear.

## Design Rules

Use these rules during the refactor:

- Split by feature ownership, not by arbitrary code size.
- Keep `fetch(...)` calls inside feature modules that own the backend interaction.
- Keep pure helpers separate from DOM mutation code.
- Keep helper modules narrow; avoid a broad `format.js` or `utils.js`.
- Keep DOM references centralized.
- Avoid circular imports between modules.
- Prefer exported functions over exported mutable objects.
- Do not create a generic `utils.js` dumping ground.
- Do not introduce a framework unless the product requirements change enough to justify it.

## Verification

After each extraction step:

1. Run `node --check` on the moved files and the entry file.
2. Run `go test ./...` to verify embedded asset changes did not break server-side behavior.
3. Manually test:
   - OCR staging and preview
   - summarize only
   - summarize then use summary for TTS
   - synthesize, play, and download audio
   - summary copy and download in both `.txt` and `.md`
   - provider/model switching
   - voice filtering and selection
4. Verify no duplicate event handlers were introduced during the migration.
5. Verify browser console stays clean after repeated summarize/synthesize flows.

The safest rollout is incremental:

1. `text.js`, `date.js`, `bytes.js`, `filename.js`, and `markdown.js`
2. `feed.js`
3. `tts.js`
4. `summarizer.js`
5. `providers.js` and `voices.js`
6. `ocr.js`
7. final entry-point cleanup
