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
_Avoid_: latest text result, temporary copy, output box, second editor

**Result Surface**:
The part of the **Text Workspace** that presents the latest **Transform Result** and the action that replaces **Working Text** with it.
_Avoid_: output panel, result box

**Audio Result**:
Generated speech for a specific text snapshot that can be played or downloaded independently of later text edits.
_Avoid_: latest audio result, TTS state, player buffer

**Promotion**:
The explicit action that replaces **Working Text** with the latest **Transform Result**.
_Avoid_: append rule, implicit sync, auto-copy

**Text Processing**:
The core capability that turns images into extracted text and text into summaries or speech.
_Avoid_: pipeline, engine

**Runtime Settings**:
The persisted preferences and credentials that shape how the product behaves across sessions.
_Avoid_: config blob, app state

**Visual Theme**:
The named appearance mode applied to the web interface and stored in **Runtime Settings**.
_Avoid_: skin, palette, CSS mode

**Provider Policy**:
The rules that select summarizer providers and models and account for provider-specific capabilities.
_Avoid_: provider picker logic, backend routing

**Speech Provider Policy**:
The rules that select which speech provider generates an **Audio Result**, including provider-specific voice and model capabilities.
_Avoid_: TTS backend switch, voice routing, provider hack

## Relationships

- The **Text Workspace** owns exactly one **Working Text**
- **Text Processing** can produce a **Transform Result** from imported images or **Working Text**
- The **Result Surface** presents the latest **Transform Result** and lets the user trigger **Promotion**
- A **Transform Result** does not change **Working Text** until **Promotion** is triggered
- **Runtime Settings** may store one explicit **Visual Theme** for the web interface
- The default **Visual Theme** is `dark`; `light` is the only other valid persisted mode
- An **Audio Result** belongs to the text snapshot used to generate it and may remain available after **Working Text** changes
- **Speech Provider Policy** governs how **Text Processing** turns a text snapshot into an **Audio Result**

## Example dialogue

> **Dev:** "If OCR finishes while the workspace already has notes, should we overwrite them?"
> **Domain expert:** "No. OCR creates a **Transform Result** first. The user can then trigger **Promotion** to replace the **Working Text**."

## Flagged ambiguities

- "source text", "OCR output", and "text to speak" were being used as separate editable concepts in the UI. Resolved: the web frontend has one **Working Text**
- The numbered four-panel frontend implied a fixed process. Resolved: the product is a **Text Workspace** with optional transforms
- "theme" was overloaded between implementation details and the user-facing appearance choice. Resolved: use **Visual Theme** for the persisted product setting
- "append" and "replace" were both treated as valid ways to move a **Transform Result** into **Working Text**. Resolved: promotion is replace-only
- "latest text result" and "latest audio result" were being used as if they were canonical product concepts. Resolved: the canonical concepts are **Transform Result** and **Audio Result**; "latest" is optional UI copy only
