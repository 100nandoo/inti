import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  flushAsyncWork,
  installDom,
  requiredElement,
  setInputValue,
  teardownPage,
} from './svelte-page-test-helpers.ts';

test('api keys route uses the Svelte secondary-page entrypoint', () => {
  const html = readFileSync(new URL('../../web-src/api-keys.html', import.meta.url), 'utf8');

  assert.match(html, /<script type="module" src="\.\/src\/entries\/api-keys\.js"><\/script>/);
});

test('API keys page preserves authenticated admin flows', async (t) => {
  let copiedValue = '';
  let createdCount = 1;
  let keys = [
    {
      id: 'k1',
      name: 'Bootstrap Key',
      prefix: 'inti_boot',
      createdAt: '2026-05-13T00:00:00Z',
      lastUsedAt: '2026-05-13T12:00:00Z',
    },
  ];
  const requests: Array<{ url: string; method: string; body: unknown }> = [];

  const dom = installDom('http://localhost:8282/api-keys.html?key=main-secret');
  t.after(() => teardownPage(dom));

  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: async (value: string) => {
        copiedValue = value;
      },
    },
  });
  window.confirm = () => true;

  globalThis.fetch = async (url, options = {}) => {
    const method = options.method || 'GET';
    const urlText = String(url);
    requests.push({ url: urlText, method, body: options.body ? JSON.parse(options.body as string) : null });

    if (method === 'GET' && urlText === 'http://localhost:8282/api/theme-config?key=main-secret') {
      return Response.json({
        theme: 'dark',
        summaryDownloadFormat: 'md',
        ocrPromotionBehavior: 'replace',
        summaryPromotionBehavior: 'replace',
      });
    }

    if (method === 'GET' && urlText === 'http://localhost:8282/api/theme-config?key=inti_secret_1') {
      return Response.json({
        theme: 'dark',
        summaryDownloadFormat: 'md',
        ocrPromotionBehavior: 'replace',
        summaryPromotionBehavior: 'replace',
      });
    }

    if (method === 'GET' && urlText === 'http://localhost:8282/api/admin/keys?key=main-secret') {
      return Response.json({ keys });
    }

    if (method === 'GET' && urlText === 'http://localhost:8282/api/admin/keys?key=inti_secret_1') {
      return Response.json({ keys });
    }

    if (method === 'POST' && urlText === 'http://localhost:8282/api/theme-config?key=main-secret') {
      return Response.json(body);
    }

    if (method === 'POST' && urlText === 'http://localhost:8282/api/theme-config?key=inti_secret_1') {
      return Response.json(body);
    }

    if (method === 'POST' && urlText === 'http://localhost:8282/api/admin/keys?key=main-secret') {
      const body = options.body ? (JSON.parse(options.body as string) as { name: string }) : { name: '' };
      const nextKey = {
        id: `k${keys.length + 1}`,
        name: body.name,
        prefix: `inti_created_${createdCount}`,
        createdAt: '2026-05-13T13:00:00Z',
        lastUsedAt: '',
      };
      const raw = `inti_secret_${createdCount}`;
      createdCount += 1;
      keys = [...keys, nextKey];
      return Response.json({ key: nextKey, raw });
    }

    if (method === 'DELETE' && urlText === 'http://localhost:8282/api/admin/keys/k2?key=inti_secret_1') {
      keys = keys.filter((key) => key.id !== 'k2');
      return new Response(null, { status: 204 });
    }

    throw new Error(`Unexpected fetch to ${method} ${urlText}`);
  };

  await import(`../../web/assets/api-keys.js?test=${Date.now()}`);
  await flushAsyncWork();

  assert.match(document.body.textContent ?? '', /Bootstrap Key/);
  assert.deepEqual(
    [...document.querySelectorAll('.header-settings-link')].map((link) => link.getAttribute('href')),
    ['/?key=main-secret', '/api-keys.html?key=main-secret', '/settings.html?key=main-secret'],
  );

  requiredElement<HTMLButtonElement>('theme-toggle').click();
  await flushAsyncWork();

  assert.deepEqual(requests.at(-1), {
    url: 'http://localhost:8282/api/theme-config?key=main-secret',
    method: 'POST',
    body: {
      theme: 'light',
      summaryDownloadFormat: 'md',
      ocrPromotionBehavior: 'replace',
      summaryPromotionBehavior: 'replace',
    },
  });

  setInputValue(requiredElement<HTMLInputElement>('new-key-name'), 'Desktop');
  requiredElement<HTMLButtonElement>('create-key-btn').click();
  await flushAsyncWork();

  assert.equal(
    requests.find((request) => request.method === 'POST' && request.url === 'http://localhost:8282/api/admin/keys?key=main-secret')?.body?.name,
    'Desktop',
  );
  assert.match(document.body.textContent ?? '', /API Key Created/);
  assert.equal(requiredElement<HTMLElement>('key-modal-value').textContent, 'inti_secret_1');

  requiredElement<HTMLButtonElement>('key-modal-copy').click();
  await flushAsyncWork();
  assert.equal(copiedValue, 'inti_secret_1');

  requiredElement<HTMLButtonElement>('key-modal-save').click();
  await flushAsyncWork();

  assert.equal(window.location.search, '?key=inti_secret_1');
  assert.deepEqual(
    [...document.querySelectorAll('.header-settings-link')].map((link) => link.getAttribute('href')),
    ['/?key=inti_secret_1', '/api-keys.html?key=inti_secret_1', '/settings.html?key=inti_secret_1'],
  );
  assert.match(document.body.textContent ?? '', /Desktop/);

  requiredElement<HTMLButtonElement>('theme-toggle').click();
  await flushAsyncWork();

  assert.deepEqual(requests.at(-1), {
    url: 'http://localhost:8282/api/theme-config?key=inti_secret_1',
    method: 'POST',
    body: {
      theme: 'dark',
      summaryDownloadFormat: 'md',
      ocrPromotionBehavior: 'replace',
      summaryPromotionBehavior: 'replace',
    },
  });

  const desktopDeleteButton = [...document.querySelectorAll('tbody tr')]
    .find((row) => row.textContent?.includes('Desktop'))
    ?.querySelector('button');
  assert.ok(desktopDeleteButton);
  desktopDeleteButton.click();
  await flushAsyncWork();

  assert.ok(
    requests.some(
      (request) =>
        request.method === 'DELETE' &&
        request.url === 'http://localhost:8282/api/admin/keys/k2?key=inti_secret_1',
    ),
  );
  assert.doesNotMatch(document.body.textContent ?? '', /Desktop/);
});
