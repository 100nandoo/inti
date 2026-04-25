# Plan: Combine config.json + api_keys.json → vocalize.toml

## Table of Contents

- [Context](#context)
- [Target Format](#target-format)
- [Critical Files](#critical-files)
- [Implementation Steps](#implementation-steps)
  - [1. Add TOML Dependency](#1-add-toml-dependency)
  - [2. Create config_store.go](#2-create-config_storego)
  - [3. Update server.go](#3-update-servergo)
  - [4. Update apikeys.go](#4-update-apikeysgo)
- [Concurrency Design](#concurrency-design)
- [Migration Behavior](#migration-behavior)
- [Verification](#verification)

## Context

Two separate JSON files currently store configuration for the vocalize server:
- `~/.config/vocalize/config.json` — summarizer provider/model/API key
- `~/.config/vocalize/api_keys.json` — array of hashed API keys for auth

JSON lacks comment support and splits logically related config across files. Combining them into a single TOML file makes it easier to hand-edit, supports inline comments, and reduces mental overhead.

**Format choice: TOML**
- Native comment support (unlike JSON)
- Standard in the Go ecosystem (Hugo, etc.)
- Clear table/array-of-tables syntax
- Library: `github.com/BurntSushi/toml` (no transitive deps)

## Target Format

Target file: `~/.config/vocalize/vocalize.toml`

```toml
[summarizer]
provider = "gemini"
model = "gemini-2.0-flash"
api_key = "your_api_key_here"

[[api_keys]]
id = "a1b2c3d4"
name = "My Production Key"
prefix = "voc_abc123d..."
hash = "sha256_hex"
created_at = "2026-04-25T21:30:00Z"
last_used_at = "2026-04-25T22:15:00Z"
```

## Critical Files

- `internal/server/server.go` — `persistedSumConfig`, `configFilePath()`, `loadActiveConfig()`, `saveActiveConfig()`
- `internal/server/apikeys.go` — `storedKey`, `apiKeysFilePath()`, `loadAPIKeyStore()`, `save()`
- `go.mod` / `go.sum`

## Implementation Steps

### 1. Add TOML Dependency

```sh
go get github.com/BurntSushi/toml@latest
go mod tidy
```

### 2. Create `config_store.go`

New file: `internal/server/config_store.go`

Define the combined top-level struct and coordination layer:

```go
type vocalizeConfig struct {
    Summarizer summarizerSection `toml:"summarizer"`
    APIKeys    []storedKey       `toml:"api_keys"`
}

type summarizerSection struct {
    Provider string `toml:"provider"`
    Model    string `toml:"model"`
    APIKey   string `toml:"api_key"`
}
```

Add `toml` tags to `storedKey` (keep `json` tags for migration):

```go
type storedKey struct {
    ID         string     `toml:"id"           json:"id"`
    Name       string     `toml:"name"         json:"name"`
    Prefix     string     `toml:"prefix"       json:"prefix"`
    Hash       string     `toml:"hash"         json:"hash"`
    CreatedAt  time.Time  `toml:"created_at"   json:"createdAt"`
    LastUsedAt *time.Time `toml:"last_used_at" json:"lastUsedAt,omitempty"`
}
```

Also add to this file:
- `vocalizeConfigPath()` — single path helper (replaces both old helpers)
- `var fileMu sync.Mutex` — serializes all disk writes
- `readVocalizeConfigUnlocked()` / `writeVocalizeConfigUnlocked()` — low-level I/O (callers must hold `fileMu`)
- `migrateOldConfigFiles()` — reads old JSON files, writes TOML, deletes old files; skips if `vocalize.toml` already exists

### 3. Update `server.go`

- Remove `configFilePath()` and `persistedSumConfig`
- Replace `loadActiveConfig()` — load via `readVocalizeConfigUnlocked()`, same merge logic as before
- Replace `saveActiveConfig()` — acquire `fileMu`, read current TOML, patch `Summarizer` section, write back (preserves `api_keys`)
- Add `migrateOldConfigFiles()` call at the top of `Start()`
- Remove `encoding/json` import

### 4. Update `apikeys.go`

- Remove `apiKeysFilePath()` and `encoding/json` import
- Move `storedKey` struct definition to `config_store.go`
- Replace `loadAPIKeyStore()` — load via `readVocalizeConfigUnlocked()`
- Replace `save()` — acquire `fileMu`, read current TOML, patch `APIKeys`, write back (preserves `summarizer`)

## Concurrency Design

Two in-memory mutexes remain unchanged:
- `activeSumConfig.mu` — guards in-memory summarizer state (RWMutex, fast)
- `apiKeyStore.mu` — guards in-memory key slice (RWMutex, fast)

One new file-level mutex:
- `fileMu` (Mutex) — guards all disk reads+writes; acquired by both `saveActiveConfig` and `apiKeyStore.save()`

The save pattern (read-modify-write under `fileMu`) prevents either subsystem from overwriting the other's section. No deadlock risk — `fileMu` is never nested with the in-memory mutexes.

## Migration Behavior

- On startup, `migrateOldConfigFiles()` runs before any load
- If `vocalize.toml` already exists → skip (idempotent)
- Otherwise: parse old JSON files (either/both may be absent) → write merged TOML → delete old JSON files
- Old files are only deleted after a successful TOML write

## Verification

```sh
go build ./...      # must compile cleanly
./vocalize serve    # start server
```

Manual checks:
- First run: `~/.config/vocalize/` should contain `vocalize.toml`; old `config.json` and `api_keys.json` should be gone
- Manually edit `vocalize.toml` and restart — changes must take effect
- `POST /api/summarizer-config` — summarizer section in TOML must update, `api_keys` section unchanged
- `POST /api/admin/keys` — `api_keys` section in TOML must update, `summarizer` section unchanged
- Concurrent auth requests (`touchLastUsed`) — no data corruption in the file
