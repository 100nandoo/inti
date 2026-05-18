# Multi-provider speech with Opus boundary

Inti will support multiple speech providers, starting with `gemini` and `kokoro-heart`, while preserving one stable product-facing **Audio Result** contract at the application boundary. The user-facing label for `kokoro-heart` is `kokoro heart`, but the stable configuration and request identifier remains `kokoro-heart`.

Speech provider choice is a persisted runtime setting with request override support, mirroring the existing summarizer behavior closely enough that users can understand it as one deliberate product capability rather than a special-case integration. `kokoro heart` has provider-specific constraints: it exposes voice selection, does not expose model selection, accepts the whole input rather than Inti-owned chunking, and depends on a public upstream service that the product deliberately treats as breakable.

Inti will continue returning base64-encoded Ogg Opus from `/api/speak` for every speech provider, even when an upstream provider returns another format such as WAV. We chose this because changing the public response contract to mixed output formats would spread provider-specific branching into the web client, CLI expectations, playback code, download behavior, and documentation. The main alternative was to expose upstream-native formats directly, but that would make **Speech Provider Policy** leak through the product boundary and create a more fragile client surface.

## Consequences

- Web, CLI, and request handlers can choose a speech provider explicitly, but playback and download surfaces continue to reason about a single Opus-based **Audio Result**.
- Provider-aware voice and model catalogs become part of the speech configuration surface, including the ability to express providers with no model selection.
- The public Hugging Face-hosted KoboldCpp + Kokoro integration is documented as experimental and accepted-breakage infrastructure, not a stability promise.
