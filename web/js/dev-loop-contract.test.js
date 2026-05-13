import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const airConfig = readFileSync(new URL('../../.air.toml', import.meta.url), 'utf8');
const devScript = readFileSync(new URL('../../scripts/dev.sh', import.meta.url), 'utf8');
const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

test('Air watches Go sources and generated web output, not raw web sources', () => {
  assert.match(airConfig, /include_dir = \["cmd", "internal", "web"\]/);
  assert.match(airConfig, /include_file = \["main\.go", "embed\.go"\]/);
  assert.match(airConfig, /exclude_dir = \["tmp", "\.tmp", "dist", "build", "node_modules", "extension", "web-src", "\.git",\]/);
  assert.match(airConfig, /exclude_unchanged = true/);
});

test('dev entrypoint verifies prerequisites and preserves build parity', () => {
  assert.match(devScript, /air is not installed/);
  assert.match(devScript, /npm is required for the embedded web watch loop/);
  assert.match(devScript, /node is required for the embedded web watch loop/);
  assert.match(devScript, /frontend dependencies are missing/);
  assert.match(devScript, /npm run build:web/);
  assert.match(devScript, /node scripts\/watch-web\.mjs &/);
  assert.match(devScript, /"\$air_bin"/);
});

test('package scripts preserve one-shot build parity and separate watch mode', () => {
  assert.equal(packageJson.scripts['build:web'], 'vite build && node scripts/render-unauthorized-page.mjs');
  assert.equal(packageJson.scripts['watch:web'], 'node scripts/watch-web.mjs');
});
