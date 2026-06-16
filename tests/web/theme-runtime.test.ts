import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

import { initializeAppRuntime } from '../../web-src/src/lib/app-runtime.js';

const themeSource = readFileSync(new URL('../../web-src/public/theme.js', import.meta.url), 'utf8');

function installThemeDom({
  url = 'http://localhost:8282/settings.html?key=secret',
  storedTheme = null,
}: {
  url?: string;
  storedTheme?: string | null;
} = {}) {
  const dom = new JSDOM(
    `<!DOCTYPE html><html><body>
      <button id="theme-toggle" type="button"><span id="theme-toggle-label"></span></button>
      <select id="appearance-theme-select" data-inti-dropdown title="Server theme">
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </body></html>`,
    {
      url,
      runScripts: 'outside-only',
    },
  );

  if (storedTheme !== null) {
    dom.window.localStorage.setItem('inti-theme', storedTheme);
  }
  dom.window.eval(themeSource);
  return dom;
}

function buildAPIURL(path: string, dom: JSDOM) {
  const url = new URL(path, dom.window.location.origin);
  const key = new URLSearchParams(dom.window.location.search).get('key');
  if (key) url.searchParams.set('key', key);
  return url.toString();
}

test('theme bootstrap paints dark before app runtime loads when nothing valid is stored', () => {
  const dom = installThemeDom();
  assert.equal(dom.window.document.documentElement.dataset.theme, 'dark');
  assert.equal(dom.window.document.documentElement.style.colorScheme, 'dark');
});

test('theme bootstrap falls back to dark for removed themes', () => {
  const dom = installThemeDom({ storedTheme: 'minimal-dark' });
  assert.equal(dom.window.document.documentElement.dataset.theme, 'dark');
});

test('app runtime owns interactive theme behavior and authenticated persistence', async () => {
  const requests: Array<{ url: string; method: string; body: unknown }> = [];
  const dom = installThemeDom({ storedTheme: 'minimal-dark' });

  const fetchImpl: typeof fetch = async (url, options = {}) => {
    const method = options.method || 'GET';
    const urlText = String(url);
    const body = options.body ? JSON.parse(options.body as string) : null;
    requests.push({ url: urlText, method, body });

    if (method === 'GET') {
      return Response.json({
        theme: 'dark',
        summaryDownloadFormat: 'md',
        ocrPromotionBehavior: 'replace',
        summaryPromotionBehavior: 'replace',
      });
    }

    return Response.json(body);
  };

  const runtime = initializeAppRuntime({
    apiURL: (path) => buildAPIURL(path, dom),
    win: dom.window as unknown as Window & typeof globalThis,
    doc: dom.window.document,
    fetchImpl,
    loadServerThemeOnInit: false,
  });

  await runtime.loadServerTheme?.();

  const root = dom.window.document.documentElement;
  const toggle = dom.window.document.getElementById('theme-toggle') as HTMLButtonElement;
  const select = dom.window.document.getElementById('appearance-theme-select') as HTMLSelectElement;
  const trigger = dom.window.document.querySelector('.dropdown > .btn');

  assert.ok(trigger);
  assert.equal(select.value, 'dark');
  assert.equal(runtime.summaryDownloadFormat, 'md');

  toggle.click();
  await Promise.resolve();
  await Promise.resolve();

  assert.equal(root.dataset.theme, 'light');
  assert.equal(dom.window.localStorage.getItem('inti-theme'), 'light');
  assert.deepEqual(requests.at(-1), {
    url: 'http://localhost:8282/api/theme-config?key=secret',
    method: 'POST',
    body: {
      theme: 'light',
      summaryDownloadFormat: 'md',
      ocrPromotionBehavior: 'replace',
      summaryPromotionBehavior: 'replace',
    },
  });
});

test('shipped theme assets do not retain removed minimal theme variants', () => {
  const styleSource = readFileSync(new URL('../../web-src/public/style.css', import.meta.url), 'utf8');
  assert.doesNotMatch(styleSource, /minimal-dark|minimal"/);
  assert.equal(existsSync(new URL('../../web/assets/page-auth.js', import.meta.url)), false);
});
