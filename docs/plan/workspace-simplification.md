# Workspace Simplification Direction

## Goal

Simplify the web workspace so it feels like a small, focused tool instead of a dense multi-panel dashboard.

## Decision Summary

- Keep a single workspace page. Do not add a separate intro or landing page.
- Keep `Input`, `Run`, and `Output` as UI grouping labels only, not as replacements for the existing domain language.
- Keep one visible input surface at a time, but preserve hidden state when switching modes.
- Keep the current activity area unchanged for now.

## Workspace Shape

The target interaction model is a simpler workspace centered around three visible areas:

- `Input`
- `Run`
- `Output`

These are layout labels. The product language remains **Working Text**, **Transform Result**, **Result Surface**, and **Audio Result**.

## Input Direction

The input area should use a mode toggle between:

- `OCR`
- `Working Text`

Only the active input mode should be visible at a time.

If `OCR` is selected:

- show OCR import and staging UI
- hide the working text editor
- preserve any existing working text

If `Working Text` is selected:

- show the text editor
- hide OCR import and staging UI
- preserve any staged OCR files

Mode switches are visibility changes, not destructive resets.

## Run Direction

The run area should be mode-based and minimal.

Available run modes:

- `OCR`
- `Summary`
- `Voice`

Behavior:

- If input mode is `OCR`, the run area should only expose `OCR`.
- If input mode is `Working Text`, the run area should hide `OCR` and expose only `Summary` and `Voice`.
- When switching from `OCR` to `Working Text`, the run area should auto-select `Summary`.
- After the user is already in `Working Text`, switching between `Summary` and `Voice` should preserve the last selected run mode.

Layout preferences:

- In summary mode, `provider` and `model` should be on one row.
- `clear` and `summarize` should be on another row.
- `clear` means clear **Working Text** only.
- In voice mode, the source should come from **Working Text** directly.
- The visible voice action UI should not show a separate speech source preview.
- The visible voice action UI should not offer a separate "generate from latest result" path.

## Output Direction

The output area should be as simple as possible.

Behavior:

- No visible output tab indicator.
- The app should decide internally whether the visible output is:
  - OCR/text result
  - summary result
  - generated voice result
- The default precedence rule is "last completed result wins", unless the current input mode restricts what kind of output is relevant.

When input mode is `OCR`:

- OCR/text output is the relevant visible output
- summary/voice indicators should not be shown as visible tabs
- existing audio snapshots may still exist internally, but OCR mode should not foreground them

When input mode is `Working Text`:

- OCR-specific output controls should not be shown as visible tabs

Promotion behavior:

- Remove visible `Append` and `Replace` buttons.
- Keep a single primary action to move the latest text result into working text.
- That action means replace **Working Text** with the latest **Transform Result**.
- When that primary promotion action is used, auto-switch input to `Working Text`.

## Activity Direction

Keep the current activity area unchanged for now.

## Design Intent

The overall intent is not just visual cleanup. It is to make the workspace:

- easier to understand at a glance
- more mode-driven
- less cluttered
- more opinionated about the next action
- more like a focused tool than a control panel
