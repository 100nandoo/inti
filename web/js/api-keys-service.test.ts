import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createAPIKey,
  deleteAPIKey,
  listAPIKeys,
} from '../../web-src/src/lib/api-keys-service.js';

test('listAPIKeys reads the current key list from the admin endpoint', async () => {
  const keys = await listAPIKeys({
    apiURL: (path: string) => `http://localhost:8282${path}?key=secret`,
    fetchImpl: async (url) => {
      assert.equal(String(url), 'http://localhost:8282/api/admin/keys?key=secret');
      return Response.json({
        keys: [{ id: 'k1', name: 'Test Key', prefix: 'inti_abc', createdAt: '2026-05-13T00:00:00Z' }],
      });
    },
  });

  assert.equal(keys.length, 1);
  assert.equal(keys[0]?.name, 'Test Key');
});

test('createAPIKey returns the one-time raw secret', async () => {
  const result = await createAPIKey({
    apiURL: (path: string) => path,
    name: 'Desktop',
    fetchImpl: async (_url, options = {}) => {
      assert.deepEqual(JSON.parse(options.body as string), { name: 'Desktop' });
      return Response.json({
        key: { id: 'k2', name: 'Desktop', prefix: 'inti_xyz' },
        raw: 'inti_secret_value',
      });
    },
  });

  assert.equal(result.raw, 'inti_secret_value');
  assert.equal(result.key.name, 'Desktop');
});

test('deleteAPIKey calls the delete route for the selected key id', async () => {
  let deleted = '';

  await deleteAPIKey({
    apiURL: (path: string) => path,
    id: 'key-123',
    fetchImpl: async (url) => {
      deleted = String(url);
      return new Response(null, { status: 204 });
    },
  });

  assert.equal(deleted, '/api/admin/keys/key-123');
});
