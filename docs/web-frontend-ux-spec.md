# Web Frontend UX Spec

This document defines the intended browser flow for Inti's main web app. The goal is to make the product feel like one coherent text workspace instead of several loosely connected panels.

## Product shape

The main page is a **Text Workspace** centered on one canonical **Working Text**.

OCR, summarization, and speech synthesis are actions that operate on the current workspace, not sequential steps in a required funnel.

## Core artifacts

### Working Text

- The page has one primary editable text area
- This is the canonical text value for the session
- If the user wants different speech input, they edit **Working Text**

### Transform Result

- OCR and summarization both write to a shared **Transform Result** surface
- The result surface is non-destructive by default
- The result surface exposes one promotion action: `Replace working text`
- Promotion is replace-only across the product

`Latest Text Result` may still appear as user-facing copy, but the canonical product concept is **Transform Result**.

### Audio Result

- Speech generation creates a separate **Audio Result** surface
- The **Audio Result** remains available for playback and download after **Working Text** changes
- Audio generation works from **Working Text**

`Latest Audio Result` may still appear as user-facing copy, but the canonical product concept is **Audio Result**.

### Activity History

- History is secondary, not a primary panel
- The page should show compact inline status for current work
- A fuller activity log can exist behind a disclosure, drawer, or compact section

## Layout direction

The page should be reorganized around the following visual hierarchy:

1. Import affordance and **Working Text**
2. **Transform Result**
3. Speech controls and **Audio Result**
4. Secondary history and utilities

The import affordance should remain easy to discover, but it should not dominate the page more than **Working Text**.

## OCR flow

1. User stages or pastes images
2. OCR runs and produces a **Transform Result**
3. If **Working Text** is empty, OCR may auto-promote by replacing it
4. If **Working Text** already has content, the OCR result stays separate until promoted
5. Promotion replaces **Working Text**

## Summarization flow

1. Summarization runs against **Working Text**
2. The app produces one canonical summary result
3. The summary appears in **Transform Result**
4. Promotion replaces **Working Text**

`Summarize + TTS` is not a primary action in this model. If it remains at all, it should be a secondary shortcut.

## Speech flow

1. The user generates speech from **Working Text**
2. The app creates an **Audio Result**
3. The user can play or download the result without losing it when the workspace text changes

The separate editable `Text to speak` field should be removed because it duplicates **Working Text** and recreates multiple sources of truth.

## Controls

- Summarizer provider and model controls belong with summarization actions
- TTS model and voice controls belong with speech actions
- Controls should not imply global effect unless they truly affect the whole workspace

## Settings

**Runtime Settings** should include:

- Visual Theme: `light` or `dark`, with `dark` as the first-paint default

## Out of scope for the first pass

- Multiple summary modes such as brief vs. bullet vs. speakable
- Full version history for workspace text
- Advanced branching result trees

A lightweight recent-results list or strong browser undo support is enough for the initial design.
