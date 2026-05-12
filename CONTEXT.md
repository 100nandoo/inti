# Context

## Concepts

### Text Processing

The module that owns Inti's core workflows:

- image bytes to extracted text
- text to summary
- text to speech

It accepts explicit request values from adapters and returns transport-neutral results. HTTP, CLI, and Telegram are adapters around this seam.

### Runtime Settings

The module that owns persisted user and operator settings, including:

- active summarizer settings
- appearance settings
- API keys
- Telegram sessions

Persistence and storage rules belong here, not in callers.

### Provider Policy

The summary-side module that owns summarizer provider selection rules, default model rules, provider capability differences, and resolved provider/model metadata.

### Workspace

The web module that is the single owner of browser-side working state, including:

- working text
- staged OCR files
- summary result
- provider selection
- generated audio

UI modules render from this module and invoke its operations instead of coordinating each other directly.
