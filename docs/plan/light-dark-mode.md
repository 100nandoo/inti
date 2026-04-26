# Plan: Light / Dark Mode Switch

## Table of Contents

- [Context](#context)
- [Current State](#current-state)
- [Approach](#approach)
- [Light Theme Palette](#light-theme-palette)
- [Critical Files](#critical-files)
- [Implementation Steps](#implementation-steps)
  - [1. Add Light Theme Variables to style.css](#1-add-light-theme-variables-to-stylecss)
  - [2. Add Toggle Button HTML (all three pages)](#2-add-toggle-button-html-all-three-pages)
  - [3. Add Toggle Logic in a Shared JS Snippet](#3-add-toggle-logic-in-a-shared-js-snippet)
  - [4. Wire Per-Page Scripts](#4-wire-per-page-scripts)
- [Persistence](#persistence)
- [Edge Cases](#edge-cases)
- [Verification](#verification)

## Context

The app is dark-only. All colors are defined as CSS custom properties in `:root` inside `style.css` (lines 6–20), so adding a light theme requires only overriding those variables under a `[data-theme="light"]` selector — no per-component color changes needed.

The toggle should live in the header (present on all three pages: `index.html`, `settings.html`, `api-keys.html`) and persist across page loads via `localStorage`.

## Current State

`style.css` `:root` defines one fixed set of dark-mode values:

```
--bg:      #0a0a0f   --surface: #13131a   --card:   #1a1a24
--border:  #2a2a3a   --border2: #3a3a50   --text:   #f1f0ff
--text2:   #c4c3d8   --muted:   #6b7280
--accent:  #7c6af7   --accent2: #a78bfa
```

No `prefers-color-scheme` query, no `.dark`/`.light` class, no existing toggle UI.

## Approach

1. Add `[data-theme="light"]` on `<html>` with overridden CSS variables — no changes to any component selectors.
2. A single `theme.js` shared module reads localStorage, applies the attribute on page load (before first paint), and exposes a toggle function.
3. Each page's `<head>` loads `theme.js` as the **first** script to avoid flash of wrong theme.
4. A sun/moon icon button in each page's header calls the toggle.

## Light Theme Palette

| Variable | Dark | Light |
|----------|------|-------|
| `--bg` | `#0a0a0f` | `#f4f4fa` |
| `--surface` | `#13131a` | `#ffffff` |
| `--card` | `#1a1a24` | `#ebebf5` |
| `--border` | `#2a2a3a` | `#d0d0e4` |
| `--border2` | `#3a3a50` | `#b8b8d0` |
| `--text` | `#f1f0ff` | `#1a1a2e` |
| `--text2` | `#c4c3d8` | `#48486a` |
| `--muted` | `#6b7280` | `#7272a0` |
| `--accent` | `#7c6af7` | `#7c6af7` (unchanged) |
| `--accent2` | `#a78bfa` | `#6d5fe6` |
| `--success` | `#34d399` | `#059669` |
| `--error` | `#f87171` | `#dc2626` |

Accent colors stay the same — the purple brand is legible on both backgrounds.

## Critical Files

| File | What changes |
|------|-------------|
| `web/style.css` | Add `[data-theme="light"]` block with overridden variables |
| `web/theme.js` | New shared module: read/write/toggle theme in localStorage |
| `web/index.html` | Load `theme.js` first; add toggle button to header |
| `web/settings.html` | Same |
| `web/api-keys.html` | Same |

## Implementation Steps

### 1. Add Light Theme Variables to `style.css`

Append after the `:root` block (after line 20):

```css
[data-theme="light"] {
  --bg:      #f4f4fa;
  --surface: #ffffff;
  --card:    #ebebf5;
  --border:  #d0d0e4;
  --border2: #b8b8d0;
  --text:    #1a1a2e;
  --text2:   #48486a;
  --muted:   #7272a0;
  --accent2: #6d5fe6;
  --success: #059669;
  --error:   #dc2626;
}
```

Also update the two hardcoded `rgba` values in feed items (lines 279–280) to use variables so they adapt:

```css
/* replace: */
.feed-item.ok   { border-color: rgba(52,211,153,.2); }
.feed-item.fail { border-color: rgba(248,113,113,.2); }

/* with: */
.feed-item.ok   { border-color: color-mix(in srgb, var(--success) 25%, transparent); }
.feed-item.fail { border-color: color-mix(in srgb, var(--error)   25%, transparent); }
```

### 2. Add Toggle Button HTML (all three pages)

Add the button inside each page's `<header>` div, alongside the existing action links:

```html
<button id="theme-toggle" class="header-settings-link" title="Toggle light/dark mode" style="background:none;border:none;cursor:pointer;padding:6px 8px;">
  <svg id="theme-icon-moon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
  <svg id="theme-icon-sun" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" hidden>
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
</button>
```

Show moon icon in dark mode (default), sun icon in light mode.

### 3. Add Toggle Logic in a Shared JS Snippet

New file: `web/theme.js`

```js
(function () {
  const STORAGE_KEY = 'inti:theme';

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme === 'light' ? 'light' : '';
    const moon = document.getElementById('theme-icon-moon');
    const sun  = document.getElementById('theme-icon-sun');
    if (moon) moon.hidden = theme === 'light';
    if (sun)  sun.hidden  = theme !== 'light';
  }

  function getStored() {
    return localStorage.getItem(STORAGE_KEY) || 'dark';
  }

  // Apply on load immediately (before first paint)
  applyTheme(getStored());

  // Expose toggle for button wiring
  window.__toggleTheme = function () {
    const next = getStored() === 'light' ? 'dark' : 'light';
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  };

  // Wire button once DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.addEventListener('click', window.__toggleTheme);
  });
})();
```

Loading this as the first `<script>` in `<head>` (before CSS renders) eliminates any flash of wrong theme.

### 4. Wire Per-Page Scripts

In each HTML file, add to `<head>` **before** the stylesheet:

```html
<script src="/theme.js"></script>
```

No changes needed to `app.js`, `settings.js`, or `api-keys.js`.

## Persistence

| State | Storage |
|-------|---------|
| User preference | `localStorage['inti:theme']` = `'light'` or `'dark'` |
| Default (no entry) | Dark mode |
| Cross-page | All three pages share the same key |

`prefers-color-scheme` is intentionally **not** used as the default — the app is designed dark-first and the explicit preference should win. A future improvement could fall back to the OS setting when no entry exists.

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| First visit | No localStorage entry → dark mode |
| `color-mix()` unsupported (very old browsers) | Feed item borders fall back to `transparent`; functional but borderless |
| JavaScript disabled | Theme stays dark (CSS default); toggle button exists but is inert |
| Rapid toggling | IIFE is synchronous; no debounce needed |

## Verification

```sh
go build ./...
./inti serve
```

Manual checks:
1. Default load → dark mode, moon icon visible in header
2. Click toggle → light mode applies instantly, sun icon shown, no flash
3. Reload page → light mode persists (localStorage preserved)
4. Navigate to Settings, API Keys pages → theme carries over
5. Toggle back → dark mode restores, moon icon returns
6. Check all cards, buttons, feed items, dropdowns, textarea for correct contrast in both modes
