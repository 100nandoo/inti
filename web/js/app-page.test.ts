import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

test('App owns the main page through Svelte components and named legacy bridges', () => {
  const appSource = readFileSync(new URL('../../web-src/src/App.svelte', import.meta.url), 'utf8');
  const pageSource = readFileSync(new URL('../../web-src/src/pages/MainWorkspacePage.svelte', import.meta.url), 'utf8');

  assert.doesNotMatch(appSource, /renderAppShell|bootstrapLegacyWorkspace/);
  assert.match(appSource, /MainWorkspacePage\.svelte/);
  assert.match(appSource, /LegacyOCRBridge\.svelte/);
  assert.match(appSource, /LegacyProvidersBridge\.svelte/);
  assert.match(appSource, /LegacySpeechBridge\.svelte/);
  assert.doesNotMatch(appSource, /LegacySummaryBridge\.svelte/);
  assert.doesNotMatch(appSource, /LegacyMetricsBridge\.svelte/);
  assert.match(pageSource, /<PageShell \{navLinks\}>/);
  assert.match(pageSource, /workspaceStore\.subscribe/);
  assert.match(pageSource, /executeMainWorkspaceSummary/);
  assert.match(pageSource, /buildMainWorkspaceViewModel/);
  assert.match(pageSource, /promoteLatestTextResult/);
  assert.match(pageSource, /<h2>Text Workspace<\/h2>/);
  assert.match(pageSource, /<h2>Latest Text Result<\/h2>/);
  assert.match(pageSource, /<h2>Speech<\/h2>/);
  assert.match(pageSource, /<h2>Activity<\/h2>/);
  assert.match(pageSource, /id="working-text"/);
  assert.match(pageSource, /id="text-result-content"/);
  assert.match(pageSource, /id="audio-result-card"/);
});

test('embedded main-page output keeps the generated Svelte entrypoint and removes the legacy bootstrap file', () => {
  const sourceHtml = readFileSync(new URL('../../web-src/index.html', import.meta.url), 'utf8');
  const builtHtml = readFileSync(new URL('../../web/index.html', import.meta.url), 'utf8');

  assert.match(sourceHtml, /<script type="module" src="\.\/src\/entries\/app\.js"><\/script>/);
  assert.doesNotMatch(sourceHtml, /main\.js/);
  assert.match(builtHtml, /\/assets\/index\.js/);
  assert.match(builtHtml, /\/assets\/PageShell\.js/);
  assert.match(builtHtml, /\/assets\/PageShell\.css/);
  assert.doesNotMatch(builtHtml, /main\.js/);
  assert.equal(existsSync(new URL('../../web/main.js', import.meta.url)), false);
});
