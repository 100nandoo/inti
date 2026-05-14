# Dev Loop Contract

This document describes the expected local development loop for the embedded Inti web app. It is the contract future changes should preserve.

## Prerequisites

- Go toolchain
- Node.js and `npm`
- Frontend dependencies installed with `npm install`
- [Air](https://github.com/air-verse/air) installed with `go install github.com/air-verse/air@latest`

## Single Entry Point

Use one command:

```sh
make dev
```

`make dev` must:

1. Fail fast if `air`, `node`, `npm`, or the installed frontend dependencies are missing.
2. Refresh the embedded `web/` output once with `npm run build:web`.
3. Start the persistent embedded web watcher.
4. Start Air for Go rebuilds and `serve` restarts.

## Ownership Split

- Raw `web-src/` edits belong to `scripts/watch-web.mjs`.
- Generated embedded output in `web/` belongs to Air.
- Go source edits belong directly to Air.
- `npm run build:web` remains the one-shot production build contract.

The point of this split is to avoid premature restarts. Air should only react after the watcher has produced updated embedded assets.

## Validation Matrix

When changing the dev-loop tooling, verify these cases:

1. Frontend edit rebuild
   Save a file in `web-src/`.
   Expect the watcher to rebuild embedded assets.
   Expect Air to restart only if generated `web/` output actually changed.

2. Go edit rebuild
   Save a `.go` file in `cmd/`, `internal/`, `main.go`, or `embed.go`.
   Expect Air to rebuild and restart without involving the web watcher.

3. Frontend failure recovery
   Introduce a temporary syntax error in `web-src/`.
   Expect the watcher to log a clear build failure and stay running.
   Fix the file and save again.
   Expect the next successful save to rebuild normally without restarting the session.

4. Production parity
   Run `npm run build:web`.
   Expect the main embedded web assets and `web/401.html` to regenerate successfully.

5. Product safety baseline
   Run `npm run test:web` and `npm run typecheck:web`.
   Expect the existing Text Workspace and related pages to behave the same after tooling changes.

6. Theme-model baseline
   Verify dark first paint, explicit light/dark persistence, protected secondary pages, and the migrated Text Workspace behavior still pass under `npm run test:web`.

## Notes For Maintainers

- The watcher uses a dedicated temp directory under `.tmp/inti-unauthorized-watch` and should clean it up on shutdown.
- If `make dev` exits unexpectedly, the next run should still start from a clean watcher temp directory.
- If you need web-only rebuilding without Air, use `npm run watch:web`.
