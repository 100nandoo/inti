import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('App owns the main page through Svelte components and named legacy bridges', () => {
  const appSource = readFileSync(new URL('../../web-src/src/App.svelte', import.meta.url), 'utf8');
  const pageSource = readFileSync(new URL('../../web-src/src/pages/MainWorkspacePage.svelte', import.meta.url), 'utf8');

  assert.doesNotMatch(appSource, /renderAppShell|bootstrapLegacyWorkspace/);
  assert.match(appSource, /MainWorkspacePage\.svelte/);
  assert.match(appSource, /LegacyOCRBridge\.svelte/);
  assert.match(appSource, /LegacyProvidersBridge\.svelte/);
  assert.match(appSource, /LegacySummaryBridge\.svelte/);
  assert.match(appSource, /LegacySpeechBridge\.svelte/);
  assert.match(pageSource, /<PageShell \{navLinks\}>/);
  assert.match(pageSource, /<h2>Text Workspace<\/h2>/);
  assert.match(pageSource, /<h2>Latest Text Result<\/h2>/);
  assert.match(pageSource, /<h2>Speech<\/h2>/);
  assert.match(pageSource, /<h2>Activity<\/h2>/);
  assert.match(pageSource, /id="working-text"/);
  assert.match(pageSource, /id="text-result-content"/);
  assert.match(pageSource, /id="audio-result-card"/);
});
