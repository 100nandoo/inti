# Inti AMO Source Package

This archive is the source package for Firefox AMO review.

## Build environment

- Ubuntu 24.04+ or macOS
- Node.js 18+
- pnpm 10.33.2 via Corepack

## Install dependencies

```bash
corepack enable
pnpm install --frozen-lockfile
```

## Build the Firefox desktop package submitted to AMO

```bash
pnpm run build:firefox-desktop
pnpm run package:firefox-desktop
```

The built Firefox extension is written to `dist/firefox-mv2/` and the packaged archive is written to `dist/firefox-desktop.zip`.

## Other available targets

```bash
pnpm run build:chrome
pnpm run build:firefox-android
```

## Notes

- The extension uses WXT with separate Vite configs for scripts and HTML pages.
- `package.json`, `pnpm-lock.yaml`, and `package-lock.json` are included so reviewers can reproduce the dependency graph used for the submitted build.
