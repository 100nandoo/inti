# Plan: Add Download Button for Summary Result

## Table of Contents

- [Context](#context)
- [Current State](#current-state)
- [Target Behavior](#target-behavior)
- [Critical Files](#critical-files)
- [Implementation Steps](#implementation-steps)
  - [1. Add Button to index.html](#1-add-button-to-indexhtml)
  - [2. Wire Handler in app.js](#2-wire-handler-in-appjs)
- [Filename Format](#filename-format)
- [Edge Cases](#edge-cases)
- [Verification](#verification)

## Context

After summarizing text, users can **Copy** the summary to clipboard or **Speak** it aloud. There is no way to save the summary as a file. The TODO item "Add button Download summary result" addresses this gap.

No backend changes needed — the summary is already held in the DOM as rendered HTML and available as raw markdown text from the API response.

## Current State

The `#summary-result` section (`index.html` lines 97–114) renders two action buttons:

```html
<div class="summary-actions">
  <button id="summary-copy-btn" class="btn-secondary">…Copy</button>
  <button id="summary-speak-btn" class="btn-primary">…Speak</button>
</div>
```

`app.js` stores the raw API response in `summaryText.innerHTML` via `renderMarkdown(summary)`. The original markdown string from the server response is what we want to download — it's richer than `innerText` (preserves headings, lists, etc.).

## Target Behavior

- A **Download** button appears in `summary-actions` between Copy and Speak.
- Clicking it triggers a browser file download of the summary as `inti-summary-<timestamp>.md`.
- The file contains the raw markdown text (not the HTML-rendered version).
- Button is disabled / hidden when no summary is present (same lifecycle as the rest of `#summary-result`).

## Critical Files

| File | What changes |
|------|-------------|
| `web/index.html` | Add `#summary-download-btn` button in `.summary-actions` |
| `web/app.js` | Store raw markdown string; add click handler; wire disable/enable |

## Implementation Steps

### 1. Add Button to `index.html`

Insert between `#summary-copy-btn` and `#summary-speak-btn`:

```html
<button id="summary-download-btn" class="btn-secondary">
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 8h14v2H5v-2z"/>
  </svg>
  Download
</button>
```

### 2. Wire Handler in `app.js`

**Declare variable** near the other summary element refs (around line 82):

```js
const summaryDownloadBtn = document.getElementById('summary-download-btn');
```

**Store raw markdown** — in the summarize response handler (around line 575), save the raw string alongside the rendered HTML:

```js
// existing:
summaryText.innerHTML = renderMarkdown(summary || '');
summaryResult.hidden = false;

// add:
summaryDownloadBtn.dataset.md = summary || '';
```

**Download handler:**

```js
summaryDownloadBtn.addEventListener('click', () => {
  const md = summaryDownloadBtn.dataset.md;
  if (!md) return;
  const blob = new Blob([md], { type: 'text/markdown' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `inti-summary-${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
});
```

**Disable during loading** — in the `setControlsDisabled(val)` function (around line 642), add:

```js
summaryDownloadBtn.disabled = val;
```

**Reset on clear** — wherever `summaryResult.hidden = true` and `summaryText.innerHTML = ''` are called (around line 213), also clear:

```js
summaryDownloadBtn.dataset.md = '';
```

## Filename Format

```
inti-summary-1745000000000.md
```

Using `Date.now()` (Unix ms) keeps filenames unique and sortable without any date-formatting logic. Adding a human date (`2026-04-25`) is a possible improvement but adds complexity for minimal gain.

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Summary is empty string | Button stores `''`; click is a no-op (early return) |
| User clicks while summarizing | `disabled` during loading prevents double-download |
| Summary contains non-ASCII (emoji, CJK) | `Blob` with UTF-8 encoding handles this correctly |
| Browser blocks programmatic clicks | Standard pattern — no special handling needed |

## Verification

```sh
go build ./...   # ensure no Go changes break compilation
./inti serve
```

Manual checks:
1. Summarize any text → **Download** button appears in summary actions row
2. Click Download → browser saves `inti-summary-<ts>.md` to downloads
3. Open the file — contents match the raw summary (markdown syntax intact)
4. Clear / start a new summarize → previous download data does not persist
5. During active summarize request → Download button is disabled
