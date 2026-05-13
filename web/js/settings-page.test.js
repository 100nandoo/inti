import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  flushAsyncWork,
  installDom,
  setInputValue,
  setSelectValue,
  teardownPage,
} from './svelte-page-test-helpers.js';

test('settings route uses the Svelte secondary-page entrypoint', () => {
  const html = readFileSync(new URL('../../web-src/settings.html', import.meta.url), 'utf8');

  assert.match(html, /<script type="module" src="\.\/src\/entries\/settings\.js"><\/script>/);
});

test('settings page loads and saves through the current backend APIs', async (t) => {
  const requests = [];
  const themePreviewCalls = [];

  const dom = installDom('http://localhost:8282/settings.html?key=main-secret');
  t.after(() => teardownPage(dom));

  window.IntiTheme = {
    apply: (theme) => themePreviewCalls.push(['apply', theme]),
    persist: (theme) => themePreviewCalls.push(['persist', theme]),
  };

  globalThis.fetch = async (url, options = {}) => {
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body) : null;
    requests.push({ url, method, body });

    if (method === 'GET' && url === 'http://localhost:8282/api/summarizer-config?key=main-secret') {
      return Response.json({
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
        keys: {
          gemini: '',
          groq: 'gsk_existing',
          openrouter: '',
        },
      });
    }

    if (method === 'GET' && url === 'http://localhost:8282/api/theme-config?key=main-secret') {
      return Response.json({
        theme: 'minimal',
        summaryDownloadFormat: 'md',
        ocrPromotionBehavior: 'append',
        summaryPromotionBehavior: 'replace',
      });
    }

    if (method === 'GET' && url === '/summarizer-models/groq.json') {
      return Response.json([
        { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
        { value: 'mixtral-scout', label: 'Mixtral Scout' },
      ]);
    }

    if (method === 'POST' && url === 'http://localhost:8282/api/summarizer-config?key=main-secret') {
      return Response.json(body);
    }

    if (method === 'POST' && url === 'http://localhost:8282/api/theme-config?key=main-secret') {
      return Response.json(body);
    }

    throw new Error(`Unexpected fetch to ${method} ${url}`);
  };

  await import(`../../web/assets/settings.js?test=${Date.now()}`);
  await flushAsyncWork();

  assert.deepEqual(
    [...document.querySelectorAll('.header-settings-link')].map((link) => link.getAttribute('href')),
    ['/api-keys.html?key=main-secret', '/?key=main-secret'],
  );
  assert.equal(document.getElementById('sum-provider-select').value, 'groq');
  assert.equal(document.getElementById('sum-model-select').value, 'llama-3.3-70b-versatile');
  assert.equal(document.getElementById('appearance-theme-select').value, 'minimal');
  assert.equal(document.getElementById('summary-download-format-select').value, 'md');
  assert.equal(document.getElementById('ocr-promotion-behavior-select').value, 'append');
  assert.equal(document.getElementById('summary-promotion-behavior-select').value, 'replace');
  assert.equal(document.getElementById('key-groq').value, 'gsk_existing');

  setSelectValue(document.getElementById('sum-model-select'), 'mixtral-scout');
  setSelectValue(document.getElementById('appearance-theme-select'), 'dark');
  setSelectValue(document.getElementById('summary-download-format-select'), 'txt');
  setSelectValue(document.getElementById('ocr-promotion-behavior-select'), 'replace');
  setSelectValue(document.getElementById('summary-promotion-behavior-select'), 'append');
  setInputValue(document.getElementById('key-groq'), 'gsk_saved');
  setInputValue(document.getElementById('key-openrouter'), 'sk-or-saved');

  document.getElementById('sum-save-btn').click();
  await flushAsyncWork();

  assert.deepEqual(themePreviewCalls, [
    ['apply', 'dark'],
    ['persist', 'dark'],
  ]);
  assert.deepEqual(requests.slice(-2), [
    {
      url: 'http://localhost:8282/api/summarizer-config?key=main-secret',
      method: 'POST',
      body: {
        provider: 'groq',
        model: 'mixtral-scout',
        keys: {
          gemini: '',
          groq: 'gsk_saved',
          openrouter: 'sk-or-saved',
        },
      },
    },
    {
      url: 'http://localhost:8282/api/theme-config?key=main-secret',
      method: 'POST',
      body: {
        theme: 'dark',
        summaryDownloadFormat: 'txt',
        ocrPromotionBehavior: 'replace',
        summaryPromotionBehavior: 'append',
      },
    },
  ]);
  assert.match(document.body.textContent, /Saved/);
});
