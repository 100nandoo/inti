# Inti

Inti helps users turn imported or pasted material into usable text, summaries, and speech. The web frontend is a text workspace, not a fixed wizard, so users can move between transforms without losing track of the current text they are working on.

## Language

**Text Workspace**:
The primary web experience where users edit, transform, and reuse text.
_Avoid_: wizard, funnel, step flow

**Working Text**:
The single canonical text value in the web frontend that transforms operate on by default.
_Avoid_: source text, OCR text, TTS text

**Transform Result**:
The latest text output produced by OCR or summarization, kept separate from **Working Text** until the user promotes it.
_Avoid_: temporary copy, output box, second editor

**Result Surface**:
The part of the **Text Workspace** that presents the latest **Transform Result** and the available **Promotion Rule** actions.
_Avoid_: output panel, result box

**Audio Result**:
Generated speech for a specific text snapshot that can be played or downloaded independently of later text edits.
_Avoid_: TTS state, player buffer

**Promotion Rule**:
The user-controlled decision to replace or append **Working Text** from a **Transform Result**, with default behavior configured in settings.
_Avoid_: implicit sync, auto-copy

**Text Processing**:
The core capability that turns images into extracted text and text into summaries or speech.
_Avoid_: pipeline, engine

**Runtime Settings**:
The persisted preferences and credentials that shape how the product behaves across sessions.
_Avoid_: config blob, app state

**Provider Policy**:
The rules that select summarizer providers and models and account for provider-specific capabilities.
_Avoid_: provider picker logic, backend routing

## Relationships

- The **Text Workspace** owns exactly one **Working Text**
- **Text Processing** can produce a **Transform Result** from imported images or **Working Text**
- The **Result Surface** presents the latest **Transform Result** and lets the user apply a **Promotion Rule**
- A **Transform Result** does not change **Working Text** until a **Promotion Rule** is applied
- **Runtime Settings** stores the default **Promotion Rule** for OCR imports and summary promotions
- An **Audio Result** belongs to the text snapshot used to generate it and may remain available after **Working Text** changes

## Example dialogue

> **Dev:** "If OCR finishes while the workspace already has notes, should we overwrite them?"
> **Domain expert:** "No. OCR creates a **Transform Result** first. The user then applies the configured **Promotion Rule** to replace or append the **Working Text**."

## Flagged ambiguities

- "source text", "OCR output", and "text to speak" were being used as separate editable concepts in the UI. Resolved: the web frontend has one **Working Text**
- The numbered four-panel frontend implied a fixed process. Resolved: the product is a **Text Workspace** with optional transforms
