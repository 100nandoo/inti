# Workspace Simplification Direction

## Goal

Simplify the web workspace so it feels like a small, focused tool instead of a dense multi-panel dashboard.

## What This Chat Is Driving Toward

The target interaction model is:

1. A separate intro or landing page.
2. A much simpler workspace page.
3. The workspace centered around three main areas:
   - `Input`
   - `Run`
   - `Output`

## Input Direction

The input area should use a mode toggle between:

- `OCR`
- `Working Text`

Only the active input mode should be visible at a time.

If `OCR` is selected:

- show OCR import/staging UI
- hide the working text editor

If `Working Text` is selected:

- show the text editor
- hide the OCR import/staging UI

## Run Direction

The run area should be mode-based and minimal.

Available run modes:

- `OCR`
- `Summary`
- `Voice`

Behavior:

- If input mode is `OCR`, the run area should only expose `OCR`.
- If input mode is `Working Text`, the run area should hide `OCR` and expose only `Summary` and `Voice`.
- When switching to `Working Text`, the run area should auto-select `Summary`.

Layout preferences called out in this chat:

- In summary mode, `provider` and `model` should be on one row.
- `clear` and `summarize` should be on another row.
- In voice mode, the source should come from input directly.
- The visible voice action UI should not show a separate “speech source preview”.

## Output Direction

The output area should be as simple as possible.

Behavior:

- No visible output tab indicator.
- The app should decide internally whether the visible output is:
  - OCR/text result
  - summary result
  - generated voice result

When input mode is `OCR`:

- OCR output is relevant
- summary/voice indicators should not be shown as visible tabs

When input mode is `Working Text`:

- OCR-specific output controls should not be shown as visible tabs

Promotion behavior:

- Remove visible `Append` and `Replace` buttons.
- Keep a single primary action to move the latest text result into working text.
- When that primary promotion action is used, auto-switch input to `Working Text`.

## Activity Direction

Activity should be minimized in the workspace for now.

Short-term:

- keep only a minimal activity strip

Longer-term:

- move activity to its own separate page

## Design Intent

The overall intent is not just visual cleanup. It is to make the workspace:

- easier to understand at a glance
- more mode-driven
- less cluttered
- more opinionated about the next action
- more like a focused tool than a control panel
