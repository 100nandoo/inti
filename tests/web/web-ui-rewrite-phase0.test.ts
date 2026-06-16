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
    'icons',
    'index.html',
    'settings.html',
    'style.css',
    'summarizer-models',
    'tailwind.css',
    'theme.js',
  ]);
});

test('compatibility CSS does not carry known dead legacy selectors or assets', () => {
  const publicCss = read('web-src/public/style.css');
  const appCss = read('web-src/src/app.css');
  const removedPublicSelectors = [
    '.logo-badge',
    '.icon-brackets-horizontal',
    '.panel-ocr',
    '.workspace-actions',
    '.tucked-action',
    '.action-hidden',
    '.btn-spinner',
    '.feed-header',
    '.settings-value',
    '.rate-usage-empty',
    '.provider-sections',
    '.provider-section-link',
  ];

  for (const selector of removedPublicSelectors) {
    assert.equal(publicCss.includes(selector), false, `expected ${selector} to stay removed from web-src/public/style.css`);
  }

  assert.equal(appCss.includes('.workspace-actions'), false, 'expected .workspace-actions to stay removed from web-src/src/app.css');
  assert.equal(existsSync(new URL('../../web-src/public/icons/brackets-horizontal.svg', import.meta.url)), false);
});
