import test from 'node:test';
import assert from 'node:assert/strict';

import {
  apiURL,
  buildPageLink,
  currentAPIKey,
  setCurrentAPIKey,
} from '../../web-src/src/lib/page-auth.js';

test('page auth helpers preserve and update the current API key', () => {
  const context = {
    origin: 'http://localhost:8282',
    search: '?key=secret',
  };

  assert.equal(currentAPIKey(context.search), 'secret');
  assert.equal(apiURL('/api/theme-config', context), 'http://localhost:8282/api/theme-config?key=secret');
  assert.equal(buildPageLink('/settings.html', context), '/settings.html?key=secret');

  const win = {
    location: {
      href: 'http://localhost:8282/api-keys.html?key=old',
    },
    history: {
      replaceState(_state, _title, nextUrl) {
        win.location.href = `http://localhost:8282${nextUrl}`;
      },
    },
  };

  const nextSearch = setCurrentAPIKey('new-secret', win);
  assert.equal(nextSearch, '?key=new-secret');
  assert.equal(win.location.href, 'http://localhost:8282/api-keys.html?key=new-secret');
});
