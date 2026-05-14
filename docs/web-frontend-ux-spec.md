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

### Latest Text Result

- OCR and summarization both write to a shared result surface
- The result surface is non-destructive by default
- The result surface exposes promotion actions:
  - `Replace working text`
  - `Append to working text`
- The default promotion behavior is configurable in Settings per transform type

### Latest Audio Result

- Speech generation creates a separate audio result surface
- The audio result remains available for playback and download after **Working Text** changes
- Audio generation should work from:
  - **Working Text**
  - the current **Latest Text Result** without forcing promotion first

### Activity History

- History is secondary, not a primary panel
- The page should show compact inline status for current work
- A fuller activity log can exist behind a disclosure, drawer, or compact section

## Layout direction

The page should be reorganized around the following visual hierarchy:

1. Import affordance and **Working Text**
2. **Latest Text Result**
3. Speech controls and **Latest Audio Result**
4. Secondary history and utilities

The import affordance should remain easy to discover, but it should not dominate the page more than **Working Text**.

## OCR flow

1. User stages or pastes images
2. OCR runs and produces a **Latest Text Result**
3. If **Working Text** is empty, OCR may auto-promote by replacing it
4. If **Working Text** already has content, the OCR result stays separate until promoted
5. Promotion supports both `Replace working text` and `Append to working text`
6. The user's default OCR promotion behavior is configurable in Settings

## Summarization flow

1. Summarization runs against **Working Text**
2. The app produces one canonical summary result
3. The summary appears in **Latest Text Result**
4. Promotion supports both `Replace working text` and `Append to working text`
5. The user's default summary promotion behavior is configurable in Settings

`Summarize + TTS` is not a primary action in this model. If it remains at all, it should be a secondary shortcut.

## Speech flow

1. The user generates speech from **Working Text** or from **Latest Text Result**
2. The app creates a **Latest Audio Result**
3. The user can play or download the result without losing it when the workspace text changes

The separate editable `Text to speak` field should be removed because it duplicates **Working Text** and recreates multiple sources of truth.

## Controls

- Summarizer provider and model controls belong with summarization actions
- TTS model and voice controls belong with speech actions
- Controls should not imply global effect unless they truly affect the whole workspace

## Settings

Settings should include separate defaults for:

- Visual Theme: `light` or `dark`, with `dark` as the first-paint default
- OCR promotion behavior: `append` or `replace`
- Summary promotion behavior: `append` or `replace`

These settings define the default action when a user promotes a result. The result should still expose both explicit actions in the UI.

## Out of scope for the first pass

- Multiple summary modes such as brief vs. bullet vs. speakable
- Full version history for workspace text
- Advanced branching result trees

A lightweight recent-results list or strong browser undo support is enough for the initial design.
