# Vocalize

Text-to-speech powered by Google Gemini, with a modern web UI and an interactive terminal — all in a single Go binary.

## Features

- **Web UI** — dark interface with model & voice dropdowns, gender filter, waveform indicator, and WAV download
- **Interactive TUI** — Bubble Tea terminal UI with scrollable history and a command menu
- **One-shot CLI** — pipe-friendly `speak` subcommand for scripts and automation
- **Single binary** — web assets embedded via `go:embed`, no separate file serving
- **Rate limit handling** — quota errors surface as a friendly message instead of a raw API error

## Setup

```sh
cp .env.example .env
# add your GEMINI_API_KEY to .env
```

```sh
go build -o vocalize .
```

## Usage

### Web server

```sh
./vocalize serve
# Open http://localhost:8080
```

Choose a **model** and **voice** from the dropdowns, type your text, and hit **Speak**. Download the result with the **WAV** button.

Flags: `--port 3000`, `--host 0.0.0.0`

### Interactive TUI

```sh
./vocalize
```

Press **Enter** on an empty prompt to open the command menu. Navigate with **↑ ↓**, select with **Enter**, dismiss with **Esc**. Use **↑ ↓** while typing to scroll the history.

| Command          | Description              |
| ---------------- | ------------------------ |
| `speak <text>`   | Synthesize and play      |
| `voice <name>`   | Switch voice             |
| `model <name>`   | Switch TTS model         |
| `export [path]`  | Save last audio as WAV   |
| `status`         | Show current config      |
| `clear`          | Clear the history        |
| `help`           | List commands            |
| `q` / `Ctrl+C`   | Quit                     |

### One-shot CLI

```sh
./vocalize speak "Hello, world!"

# Choose a voice
./vocalize speak --voice Puck "Hello, world!"

# Choose a TTS model
./vocalize speak --model gemini-2.5-pro-preview-tts "Hello, world!"

# Save to file (no playback)
./vocalize speak --export hello.wav "Hello, world!"

# Save and play
./vocalize speak --export hello.wav --play "Hello, world!"
```

## Models

| Model                          | Notes            |
| ------------------------------ | ---------------- |
| `gemini-2.5-flash-preview-tts` | Default — fast   |
| `gemini-2.5-pro-preview-tts`   | Higher quality   |
| `gemini-3.1-flash-tts-preview` | Latest preview   |

## Voices

30 voices available, filterable by gender in the web UI:

| Voice                | Style         | Voice         | Style       |
| -------------------- | ------------- | ------------- | ----------- |
| **Kore** _(default)_ | Firm          | Zephyr        | Bright      |
| Puck                 | Upbeat        | Charon        | Informative |
| Fenrir               | Excitable     | Leda          | Youthful    |
| Orus                 | Firm          | Aoede         | Breezy      |
| Callirrhoe           | Easy-going    | Autonoe       | Bright      |
| Enceladus            | Breathy       | Iapetus       | Clear       |
| Umbriel              | Easy-going    | Algieba       | Smooth      |
| Despina              | Smooth        | Erinome       | Clear       |
| Algenib              | Gravelly      | Rasalgethi    | Informative |
| Laomedeia            | Upbeat        | Achernar      | Soft        |
| Alnilam              | Firm          | Schedar       | Even        |
| Gacrux               | Mature        | Pulcherrima   | Forward     |
| Achird               | Friendly      | Zubenelgenubi | Casual      |
| Vindemiatrix         | Gentle        | Sadachbia     | Lively      |
| Sadaltager           | Knowledgeable | Sulafat       | Warm        |

## Configuration

| Variable         | Default                        | Description                        |
| ---------------- | ------------------------------ | ---------------------------------- |
| `GEMINI_API_KEY` | —                              | Required. Your Gemini API key      |
| `DEFAULT_VOICE`  | `Kore`                         | Default voice name                 |
| `DEFAULT_MODEL`  | `gemini-2.5-flash-preview-tts` | Default TTS model                  |
| `PORT`           | `8080`                         | Web server port                    |
| `HOST`           | `127.0.0.1`                    | Web server bind address            |

## Project structure

```
├── main.go                    # Entry point
├── embed.go                   # Embeds web/ into binary
├── cmd/                       # CLI commands (root, speak, serve)
├── internal/
│   ├── config/                # Env/config loading and validation
│   ├── gemini/                # Gemini TTS client + rate-limit detection
│   ├── audio/                 # WAV encoder, platform audio player
│   ├── tui/                   # Bubble Tea TUI (model, view, update)
│   └── server/                # HTTP server + REST handlers
└── web/                       # Embedded frontend (HTML/CSS/JS)
```

## API

```
POST /api/speak
  Body:     { "text": "...", "voice": "Kore", "model": "gemini-2.5-flash-preview-tts" }
  Response: { "wav": "<base64 WAV>" }
  Errors:   429 on rate limit, 400 on invalid voice/model

GET /api/voices
  Response: { "voices": [...], "default": "Kore" }

GET /api/models
  Response: { "models": [...], "default": "gemini-2.5-flash-preview-tts" }
```

## Requirements

- Go 1.22+
- macOS: `afplay` (pre-installed)
- Linux: `aplay`, `paplay`, or `mplayer`
