# Plan: Keyboard Shortcuts

## Table of Contents

- [Context](#context)
- [Current State](#current-state)
- [Target Shortcuts](#target-shortcuts)
- [Critical Files](#critical-files)
- [Implementation Steps](#implementation-steps)
  - [1. Extend Submit Shortcut to Global Scope](#1-extend-submit-shortcut-to-global-scope)
  - [2. Add Global Shortcut Handler](#2-add-global-shortcut-handler)
  - [3. Show Shortcut Hints in UI](#3-show-shortcut-hints-in-ui)
- [Guard Conditions](#guard-conditions)
- [Verification](#verification)

## Context

The app has one keyboard shortcut today: `Cmd/Ctrl + Enter` fires the Submit button, but **only when the textarea is focused**. Every other action requires a mouse click. Adding global shortcuts removes friction for keyboard-first users — especially for summarize, which is a separate button flow from Submit.

## Current State

| Location | Shortcut | Behavior |
|----------|----------|----------|
| `textInput` keydown listener (`app.js:431`) | `Cmd/Ctrl + Enter` | Clicks `#submit-btn` |
| `document` keydown listener (`app.js:44`) | `Escape` | Closes image preview modal |

All other buttons (Summarize, Summarize + Speak, OCR) are mouse-only.

## Target Shortcuts

| Shortcut | Action | Notes |
|----------|--------|-------|
| `Cmd/Ctrl + Enter` | Submit (speak/synthesize) | Already exists in textarea; make **global** |
| `Cmd/Ctrl + Shift + Enter` | Summarize + Speak | Global |
| `Cmd/Ctrl + Shift + S` | Summarize only | Global |
| `Cmd/Ctrl + K` | Focus textarea | Global; clears nothing, just moves focus |
| `Escape` | Close image preview | Already works |

**Why these?**
- `Cmd+Enter` → submit is the industry standard (Slack, Linear, GitHub).
- `Cmd+Shift+Enter` mirrors the "Summarize + Speak" button sitting next to the main submit flow.
- `Cmd+Shift+S` follows the mnemonic **S**ummarize without conflicting with browser Save (`Cmd+S`).
- `Cmd+K` is the focus-search convention familiar from VS Code and Linear.

## Critical Files

| File | What changes |
|------|-------------|
| `web/app.js` | Remove textarea-scoped `Cmd+Enter`; add global `onGlobalKey` handler; wire all shortcuts |
| `web/index.html` | Add `<kbd>` hint text to button labels (optional but recommended) |

## Implementation Steps

### 1. Extend Submit Shortcut to Global Scope

Remove the textarea-scoped listener (app.js lines 431–436):

```js
// REMOVE this block:
textInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    submitBtn.click();
  }
});
```

The new global handler (step 2) covers this case for all focus states.

### 2. Add Global Shortcut Handler

Add one `document.addEventListener('keydown', onGlobalKey)` near the existing modal key handler:

```js
document.addEventListener('keydown', onGlobalKey);

function onGlobalKey(e) {
  // Skip when user is typing in an input/textarea (except our own textarea for Cmd+Enter)
  const tag = document.activeElement?.tagName;
  const inInput = (tag === 'INPUT' || tag === 'SELECT');
  if (inInput) return;

  // Cmd/Ctrl + K → focus textarea
  if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 'k') {
    e.preventDefault();
    textInput.focus();
    return;
  }

  // Cmd/Ctrl + Enter → Submit
  if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 'Enter') {
    e.preventDefault();
    if (!submitBtn.disabled) submitBtn.click();
    return;
  }

  // Cmd/Ctrl + Shift + Enter → Summarize + Speak
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'Enter') {
    e.preventDefault();
    if (!summarizeSpeakBtn.disabled) summarizeSpeakBtn.click();
    return;
  }

  // Cmd/Ctrl + Shift + S → Summarize
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'S') {
    e.preventDefault();
    if (!summarizeBtn.disabled) summarizeBtn.click();
    return;
  }
}
```

**Why skip `INPUT`/`SELECT` but not `TEXTAREA`?**
The textarea is our primary editing surface — `Cmd+Enter` inside it should still fire. Inputs and selects (voice, model dropdowns) have their own native keyboard behavior that should not be hijacked.

### 3. Show Shortcut Hints in UI

Add `<kbd>` labels to button titles so shortcuts are discoverable. This is a tooltip / `title` attribute update, not visible in the main layout. Alternatively, append inline `<kbd>` text to button labels on wider screens via CSS.

Minimal approach — update `title` attributes in `index.html`:

```html
<!-- Submit button -->
<button id="submit-btn" class="btn-primary" title="Submit (⌘↵)">Submit</button>

<!-- Summarize button -->
<button id="summarize-btn" class="btn-secondary" title="Summarize (⌘⇧S)">…Summarize</button>

<!-- Summarize + Speak button -->
<button id="summarize-speak-btn" class="btn-secondary" title="Summarize + Speak (⌘⇧↵)">…Summarize + Speak</button>
```

The `⌘` symbol works cross-platform as a generic "modifier" hint; `Ctrl` users will understand it maps to their key.

## Guard Conditions

Every shortcut checks `disabled` before calling `.click()` — this ensures shortcuts respect the same loading/processing lock that mouse clicks do. The `processing` flag and `setControlsDisabled()` already disable the buttons during active requests, so no additional state is needed.

## Verification

```sh
go build ./...
./inti serve
```

Manual checks:
1. Focus **outside** the textarea → `Cmd+Enter` fires Submit
2. Focus **inside** the textarea → `Cmd+Enter` still fires Submit
3. Focus a **dropdown** → `Cmd+Enter` does nothing (guard prevents hijack)
4. `Cmd+Shift+S` → Summarize runs without touching the textarea
5. `Cmd+Shift+Enter` → Summarize + Speak runs
6. `Cmd+K` → textarea receives focus from any other element
7. During an active request (processing = true, buttons disabled) → shortcuts are no-ops
