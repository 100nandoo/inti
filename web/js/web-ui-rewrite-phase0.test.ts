import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = new URL('../../', import.meta.url);
const srcRoot = new URL('../../web-src/src/', import.meta.url);

function read(relativePath: string): string {
  return readFileSync(new URL(relativePath, repoRoot), 'utf8');
}

function walk(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const absolute = join(dir, entry.name);
    if (entry.isDirectory()) return walk(absolute);
    return [absolute];
  });
}

test('App.svelte does not bootstrap legacy web/js runtime modules', () => {
  const app = read('web-src/src/App.svelte');
  assert.doesNotMatch(app, /web\/js\//);
});

test('web-src no longer imports legacy web/js modules', () => {
  const files = walk(srcRoot.pathname).filter((file) => file.endsWith('.js') || file.endsWith('.svelte'));
  const legacyImporters = files
    .map((file) => {
      const source = readFileSync(file, 'utf8');
      const matches = [...source.matchAll(/from ['"]([^'"]*web\/js\/[^'"]+)['"]/g)].map((match) => match[1]);
      if (matches.length === 0) return null;
      return {
        file: file.replace(`${srcRoot.pathname}`, ''),
        imports: matches.sort(),
      };
    })
    .filter((value): value is { file: string; imports: string[] } => value !== null)
    .sort((a, b) => a.file.localeCompare(b.file));

  assert.deepEqual(legacyImporters, []);
});

test('legacy bridge files are removed from the live app tree', () => {
  const bridgesDir = new URL('../../web-src/src/bridges/', import.meta.url);
  if (existsSync(bridgesDir)) {
    const bridgeFiles = readdirSync(bridgesDir).filter((name) => name.endsWith('.svelte'));
    assert.deepEqual(bridgeFiles, []);
  }

  const appSources = walk(srcRoot.pathname)
    .filter((file) => file.endsWith('.js') || file.endsWith('.svelte'))
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n');

  assert.doesNotMatch(appSources, /bridges\/Legacy(?:Metrics|OCR|Providers|Summary)Bridge\.svelte/);
});

test('handwritten files at the web root stay on the current temporary allowlist', () => {
  const rootFiles = readdirSync(new URL('../../web/', import.meta.url))
    .filter((name) => !name.startsWith('.') && !name.endsWith('.map'))
    .sort();

  assert.deepEqual(rootFiles, [
    '401.html',
    'api-keys.html',
    'assets',
    'auth.js',
    'icons',
    'index.html',
    'js',
    'settings.html',
    'style.css',
    'summarizer-models',
    'summarizer-models.js',
    'tailwind.css',
    'theme.js',
  ]);
});
