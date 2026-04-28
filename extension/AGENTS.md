# Inti Extension Agent Notes

Use [../README.md](../README.md) for product-level behavior and [../docs/contributing.md](../docs/contributing.md) for the canonical developer documentation. Do not duplicate architecture notes here.

## Working Rules

- Keep `../README.md` user-facing.
- Keep `../docs/contributing.md` as the single source of truth for build, architecture, storage, and packaging details.
- Update `AGENTS.md` and `CLAUDE.md` only when agent-specific workflow guidance changes.

## Local Commands

```bash
pnpm install
pnpm run icons
pnpm run dev
pnpm run build
pnpm run build:chrome
pnpm run build:firefox-desktop
pnpm run build:firefox-android
```

## Critical Constraints

- The project intentionally uses two Vite configs. Do not merge `vite.config.ts` and `vite.scripts.config.ts`.
- Firefox background scripts must remain classic-script compatible.
- Persistent state belongs in extension storage, never page `localStorage`.
- There is no automated test suite. Verify changes by rebuilding and loading the unpacked target from `dist/{target}/`.
