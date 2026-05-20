import test from 'node:test';
import assert from 'node:assert/strict';

import { createProtectedPage } from '../../web-src/src/lib/protected-page.js';

test('protected page utilities preserve key-aware links and requests', async () => {
  const requests: Array<{ url: string; init: RequestInit }> = [];
  const win = {
    location: {
      origin: 'http://localhost:8282',
      search: '?key=secret',
      href: 'http://localhost:8282/settings.html?key=secret',
    },
    history: {
      replaceState(_state: unknown, _title: string, nextUrl: string) {
        win.location.href = `http://localhost:8282${nextUrl}`;
        const next = new URL(win.location.href);
        win.location.search = next.search;
      },
    },
  } as Pick<Window, 'location' | 'history'> as Window & typeof globalThis;

  const protectedPage = createProtectedPage({
    navItems: [
      {
        path: '/',
        label: 'Back',
        title: 'Back to app',
        iconClass: 'icon-chevron-left',
      },
    ],
    win,
    fetchImpl: async (url, init = {}) => {
      requests.push({ url: String(url), init });
      return Response.json({ ok: true });
    },
  });

  assert.equal(protectedPage.currentAPIKey(), 'secret');
  assert.deepEqual(
    protectedPage.navLinks().map((link: { href: string }) => link.href),
    ['/api-keys.html?key=secret', '/settings.html?key=secret', '/?key=secret'],
  );

  await protectedPage.fetch('/api/theme-config', { method: 'POST' });
  assert.deepEqual(requests, [
    {
      url: 'http://localhost:8282/api/theme-config?key=secret',
      init: { method: 'POST' },
    },
  ]);

  assert.deepEqual(
    protectedPage.setCurrentAPIKey('next-secret').map((link: { href: string }) => link.href),
    ['/api-keys.html?key=next-secret', '/settings.html?key=next-secret', '/?key=next-secret'],
  );
  assert.equal(win.location.href, 'http://localhost:8282/settings.html?key=next-secret');
  assert.equal(protectedPage.currentAPIKey(), 'next-secret');
});
