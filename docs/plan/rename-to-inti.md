# Plan: Rename vocalize → inti

## Table of Contents

- [Context](#context)
- [Scope of Changes](#scope-of-changes)
- [Critical Files](#critical-files)
- [Implementation Steps](#implementation-steps)
  - [1. Go Module Path](#1-go-module-path)
  - [2. Binary Name](#2-binary-name)
  - [3. Config Directory and File Name](#3-config-directory-and-file-name)
  - [4. Environment Variables](#4-environment-variables)
  - [5. Internal Go Names](#5-internal-go-names)
  - [6. Web UI — Display Names](#6-web-ui--display-names)
  - [7. Web UI — localStorage Keys and Download Filename](#7-web-ui--localstorage-keys-and-download-filename)
  - [8. Docker](#8-docker)
  - [9. Shell Script](#9-shell-script)
  - [10. Config Directory Migration](#10-config-directory-migration)
- [Find-and-Replace Reference](#find-and-replace-reference)
- [Verification](#verification)

## Context

The project is being renamed from **vocalize** to **inti**. This is a cosmetic + structural rename with no behavior changes. Every reference falls into one of five categories: Go module path, binary/CLI name, config paths, env var names, and UI display text.

The rename must also handle users who already have data at `~/.config/vocalize/` by migrating the config directory to `~/.config/inti/` on first run (the same pattern used for `migrateOldConfigFiles`).

## Scope of Changes

| Category | Old | New |
|---|---|---|
| Go module | `github.com/100nandoo/vocalize` | `github.com/100nandoo/inti` |
| Binary / CLI `Use` | `vocalize` | `inti` |
| Config dir | `~/.config/vocalize/` | `~/.config/inti/` |
| Config file | `vocalize.toml` | `inti.toml` |
| Env var — master key | `VOCALIZE_MASTER_KEY` | `INTI_MASTER_KEY` |
| Env var — config dir | `VOCALIZE_CONFIG_DIR` | `INTI_CONFIG_DIR` |
| Go type | `vocalizeConfig` | `intiConfig` |
| Go func | `vocalizeConfigPath()` | `intiConfigPath()` |
| Go func | `readVocalizeConfigUnlocked()` | `readIntiConfigUnlocked()` |
| Go func | `writeVocalizeConfigUnlocked()` | `writeIntiConfigUnlocked()` |
| UI title / logo | `Vocalize` | `Inti` |
| localStorage key | `vocalize:summarizer` | `inti:summarizer` |
| localStorage key | `vocalize:apiKey` | `inti:apiKey` |
| Download filename | `vocalize-<ts>.opus` | `inti-<ts>.opus` |
| Docker service | `vocalize:` | `inti:` |
| Root repo dir (optional) | `vocalize/` | `inti/` |

## Critical Files

- `go.mod` — module declaration
- `main.go` — import path
- All `*.go` files that import `github.com/100nandoo/vocalize/...`
- `internal/server/config_store.go` — config dir, file name, env vars, type/func names
- `internal/config/config.go` — `VOCALIZE_MASTER_KEY` env var
- `cmd/root.go` — `Use:` and `Long:` cobra fields
- `web/index.html`, `web/settings.html`, `web/api-keys.html` — `<title>` and `.logo-name`
- `web/app.js`, `web/settings.js`, `web/api-keys.js` — localStorage keys, download filename
- `Dockerfile` — binary name in build and CMD
- `docker-compose.yml` — service name
- `open-config.sh` — config dir path
- `.env.example` — env var names
- `CLAUDE.md`, `README.md` — docs references

## Implementation Steps

### 1. Go Module Path

In `go.mod`, change the module declaration:

```diff
-module github.com/100nandoo/vocalize
+module github.com/100nandoo/inti
```

Then do a global find-and-replace across all `.go` files:

```
github.com/100nandoo/vocalize  →  github.com/100nandoo/inti
```

Files affected (confirmed via grep): `main.go`, all files under `cmd/`, and all files under `internal/` that import sibling packages.

Run `go build ./...` after to verify no broken imports.

### 2. Binary Name

**`cmd/root.go`** — update the Cobra root command:

```diff
-	Use:   "vocalize",
-	Long:  "Vocalize converts text to speech using Google Gemini. Run without subcommands for interactive TUI.",
+	Use:   "inti",
+	Long:  "Inti converts text to speech using Google Gemini. Run without subcommands for interactive TUI.",
```

**`Dockerfile`** — update the build output name and CMD:

```diff
-RUN CGO_ENABLED=1 GOOS=linux go build -o vocalize .
-COPY --from=builder /app/vocalize .
-CMD ["./vocalize", "serve"]
+RUN CGO_ENABLED=1 GOOS=linux go build -o inti .
+COPY --from=builder /app/inti .
+CMD ["./inti", "serve"]
```

**`CLAUDE.md`** — update build and run commands:

```diff
-go build -o vocalize .
-./vocalize serve
-./vocalize speak ...
+go build -o inti .
+./inti serve
+./inti speak ...
```

### 3. Config Directory and File Name

**`internal/server/config_store.go`** — four locations:

```diff
-func vocalizeConfigPath() string {
-	if dir := os.Getenv("VOCALIZE_CONFIG_DIR"); dir != "" {
-		return filepath.Join(dir, "vocalize.toml")
+func intiConfigPath() string {
+	if dir := os.Getenv("INTI_CONFIG_DIR"); dir != "" {
+		return filepath.Join(dir, "inti.toml")
 	}
 	...
-	return filepath.Join(base, "vocalize", "vocalize.toml")
+	return filepath.Join(base, "inti", "inti.toml")
 }

-func configDir() string {
-	if dir := os.Getenv("VOCALIZE_CONFIG_DIR"); dir != "" {
+func configDir() string {
+	if dir := os.Getenv("INTI_CONFIG_DIR"); dir != "" {
 		return dir
 	}
 	...
-	return filepath.Join(base, "vocalize")
+	return filepath.Join(base, "inti")
 }
```

Also update all call sites of `vocalizeConfigPath()` → `intiConfigPath()` within the same file.

### 4. Environment Variables

**`internal/config/config.go`**:

```diff
-		MasterKey: os.Getenv("VOCALIZE_MASTER_KEY"),
+		MasterKey: os.Getenv("INTI_MASTER_KEY"),
```

**`internal/server/config_store.go`** — already covered in step 3 (`VOCALIZE_CONFIG_DIR` → `INTI_CONFIG_DIR`).

**`.env.example`** — rename every `VOCALIZE_*` variable:

```diff
-VOCALIZE_MASTER_KEY=
+INTI_MASTER_KEY=
```

**`web/api-keys.html`** — update the help text that mentions `VOCALIZE_MASTER_KEY`:

```diff
-If <code>VOCALIZE_MASTER_KEY</code> is set in your <code>.env</code>…
+If <code>INTI_MASTER_KEY</code> is set in your <code>.env</code>…
```

### 5. Internal Go Names

**`internal/server/config_store.go`** — rename the struct and functions (purely cosmetic, no behavior change):

```diff
-type vocalizeConfig struct {
+type intiConfig struct {

-func readVocalizeConfigUnlocked() vocalizeConfig {
-	var cfg vocalizeConfig
+func readIntiConfigUnlocked() intiConfig {
+	var cfg intiConfig

-func writeVocalizeConfigUnlocked(cfg vocalizeConfig) error {
+func writeIntiConfigUnlocked(cfg intiConfig) error {
```

Update all call sites in `config_store.go`, `server.go`, and `apikeys.go`.

### 6. Web UI — Display Names

**`web/index.html`**:
```diff
-  <title>Vocalize — Gemini TTS</title>
+  <title>Inti — Gemini TTS</title>
...
-        <span class="logo-name">Vocalize</span>
+        <span class="logo-name">Inti</span>
```

**`web/settings.html`**:
```diff
-  <title>Vocalize — Settings</title>
+  <title>Inti — Settings</title>
-        <span class="logo-name">Vocalize</span>
+        <span class="logo-name">Inti</span>
```

**`web/api-keys.html`**:
```diff
-  <title>Vocalize — API Keys</title>
+  <title>Inti — API Keys</title>
-        <span class="logo-name">Vocalize</span>
+        <span class="logo-name">Inti</span>
```

### 7. Web UI — localStorage Keys and Download Filename

All three JS files use the same storage key constants. Update each file:

**`web/app.js`** (lines 252–253 and 424):
```diff
-const STORAGE_KEY    = 'vocalize:summarizer';
-const API_KEY_STORAGE = 'vocalize:apiKey';
+const STORAGE_KEY    = 'inti:summarizer';
+const API_KEY_STORAGE = 'inti:apiKey';
...
-    a.download = `vocalize-${Date.now()}.opus`;
+    a.download = `inti-${Date.now()}.opus`;
```

**`web/settings.js`** (lines 1–2):
```diff
-const STORAGE_KEY    = 'vocalize:summarizer';
-const API_KEY_STORAGE = 'vocalize:apiKey';
+const STORAGE_KEY    = 'inti:summarizer';
+const API_KEY_STORAGE = 'inti:apiKey';
```

**`web/api-keys.js`** (line 1):
```diff
-const API_KEY_STORAGE = 'vocalize:apiKey';
+const API_KEY_STORAGE = 'inti:apiKey';
```

> **Note on existing browser data:** Users who saved settings under the old keys will lose them after the rename (the new keys start empty). This is acceptable for a rename; no migration shim needed in the JS.

### 8. Docker

**`docker-compose.yml`** — rename the service:
```diff
-  vocalize:
+  inti:
```

Binary references are already covered in step 2 (Dockerfile).

### 9. Shell Script

**`open-config.sh`**:
```diff
-  dir="$HOME/Library/Application Support/vocalize"
+  dir="$HOME/Library/Application Support/inti"
...
-  dir="${XDG_CONFIG_HOME:-$HOME/.config}/vocalize"
+  dir="${XDG_CONFIG_HOME:-$HOME/.config}/inti"
```

### 10. Config Directory Migration

Add a `migrateOldConfigDir()` function to `internal/server/config_store.go`, called at the top of `Start()` alongside `migrateOldConfigFiles()`:

```go
// migrateOldConfigDir moves ~/.config/vocalize → ~/.config/inti if the old
// directory exists and the new one does not yet.
func migrateOldConfigDir() {
    base, err := os.UserConfigDir()
    if err != nil {
        return
    }
    oldDir := filepath.Join(base, "vocalize")
    newDir := filepath.Join(base, "inti")
    if _, err := os.Stat(newDir); err == nil {
        return // new dir already exists, nothing to do
    }
    if _, err := os.Stat(oldDir); err != nil {
        return // old dir doesn't exist either
    }
    _ = os.Rename(oldDir, newDir)
}
```

Call order in `Start()`:

```go
migrateOldConfigDir()   // move ~/.config/vocalize → ~/.config/inti
migrateOldConfigFiles() // move config.json + api_keys.json → inti.toml
```

## Find-and-Replace Reference

A single `sed` pass to verify nothing is missed after manual edits:

```sh
# Confirm no old references remain in Go source
grep -r "vocalize\|VOCALIZE" --include="*.go" .

# Confirm no old references remain in web assets
grep -ri "vocalize" web/

# Confirm module path updated
head -1 go.mod
```

## Verification

```sh
go build -o inti .    # must compile cleanly
./inti serve          # server starts at http://localhost:8282
```

Manual checks:
- Browser tab shows "Inti — Gemini TTS"
- Logo in header reads "Inti"
- `~/.config/inti/inti.toml` is created on first request that writes config
- Old `~/.config/vocalize/` directory is renamed on startup (if it existed)
- `INTI_MASTER_KEY` env var is respected for auth
- Docker: `docker compose up` starts the `inti` service successfully
