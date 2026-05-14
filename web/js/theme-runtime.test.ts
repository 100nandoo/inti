import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const themeSource = readFileSync(new URL('../../web/theme.js', import.meta.url), 'utf8');

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
      <select id="appearance-theme-select">
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </body></html>`,
    {
      url,
      runScripts: 'outside-only',
    },
  );

  dom.window.fetch = (() => new Promise(() => {})) as typeof fetch;
  if (storedTheme !== null) {
    dom.window.localStorage.setItem('inti-theme', storedTheme);
  }
  dom.window.eval(themeSource);
  dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  return dom;
}

test('theme runtime paints dark before settings load when nothing valid is stored', () => {
  const dom = installThemeDom();
  assert.equal(dom.window.document.documentElement.dataset.theme, 'dark');
  assert.equal(dom.window.document.documentElement.style.colorScheme, 'dark');
});

test('theme runtime falls back to dark for removed themes and toggles only between light and dark', () => {
  const dom = installThemeDom({ storedTheme: 'minimal-dark' });
  const root = dom.window.document.documentElement;
  const toggle = dom.window.document.getElementById('theme-toggle') as HTMLButtonElement;

  assert.equal(root.dataset.theme, 'dark');
  toggle.click();
  assert.equal(root.dataset.theme, 'light');
  toggle.click();
  assert.equal(root.dataset.theme, 'dark');
});

test('shipped theme assets do not retain removed minimal theme variants', () => {
  const styleSource = readFileSync(new URL('../../web/style.css', import.meta.url), 'utf8');
  assert.doesNotMatch(styleSource, /minimal-dark|minimal"/);
  assert.equal(existsSync(new URL('../../web/assets/page-auth.js', import.meta.url)), false);
});
