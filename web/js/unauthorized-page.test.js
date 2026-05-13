import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('unauthorized page renderer source preserves the server-side message injection contract', () => {
  const source = readFileSync(new URL('../../web-src/src/unauthorized/render.js', import.meta.url), 'utf8');

  assert.match(source, /renderUnauthorizedPage\(message = '__MESSAGE__'\)/);
  assert.match(source, /UnauthorizedPage\.svelte/);
  assert.match(source, /<link rel="stylesheet" href="\/style\.css" \/>/);
  assert.match(source, /<script defer src="\/theme\.js"><\/script>/);
});

test('built unauthorized page keeps the generated Svelte output on disk', () => {
  const html = readFileSync(new URL('../../web/401.html', import.meta.url), 'utf8');

  assert.match(html, /401 Unauthorized/);
  assert.match(html, /__MESSAGE__/);
  assert.match(html, /<main class="card/);
});
