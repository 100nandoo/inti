#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

air_bin=""
web_watch_pid=""

find_air() {
  if command -v air >/dev/null 2>&1; then
    command -v air
    return 0
  fi

  local gobin_dir=""
  local gopath_dir=""

  gobin_dir="$(go env GOBIN 2>/dev/null || true)"
  gopath_dir="$(go env GOPATH 2>/dev/null || true)"

  if [[ -n "$gobin_dir" && -x "$gobin_dir/air" ]]; then
    printf '%s\n' "$gobin_dir/air"
    return 0
  fi

  if [[ -n "$gopath_dir" && -x "$gopath_dir/bin/air" ]]; then
    printf '%s\n' "$gopath_dir/bin/air"
    return 0
  fi

  return 1
}

cleanup() {
  if [[ -n "$web_watch_pid" ]] && kill -0 "$web_watch_pid" 2>/dev/null; then
    kill "$web_watch_pid" 2>/dev/null || true
    wait "$web_watch_pid" 2>/dev/null || true
  fi

  rm -rf "$repo_root/.tmp/inti-unauthorized-watch"
}

if ! air_bin="$(find_air)"; then
  echo "air is not installed"
  echo "install it with: go install github.com/air-verse/air@latest"
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required for the embedded web watch loop"
  echo "install Node.js and npm, then run: npm install"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "node is required for the embedded web watch loop"
  echo "install Node.js and npm, then run: npm install"
  exit 1
fi

if [[ ! -x "$repo_root/node_modules/.bin/vite" ]]; then
  echo "frontend dependencies are missing"
  echo "run: npm install"
  exit 1
fi

echo "Preparing embedded web assets..."
npm run build:web

trap cleanup EXIT INT TERM

echo "Starting embedded web watcher..."
node scripts/watch-web.mjs &
web_watch_pid=$!

echo "Starting Air..."
"$air_bin"
