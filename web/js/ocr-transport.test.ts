import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildOCRUploadRequest,
  readOCRUploadResponse,
  uploadOCRFiles,
} from '../../web-src/src/lib/ocr-transport.js';

test('OCR transport builds a multipart upload request from staged files', () => {
  const first = new File(['front'], 'front.png', { type: 'image/png' });
  const second = new File(['back'], 'back.jpg', { type: 'image/jpeg' });

  const body = buildOCRUploadRequest([first, second]);

  assert.deepEqual(body.getAll('files').map((entry) => (entry as File).name), ['front.png', 'back.jpg']);
});

test('OCR transport posts staged files to the OCR endpoint', async () => {
  const file = new File(['scan'], 'receipt.png', { type: 'image/png' });

  const response = await uploadOCRFiles({
    apiURL: (path: string) => path,
    files: [file],
    fetchImpl: async (url, options = {}) => {
      assert.equal(String(url), '/api/ocr');
      assert.equal(options.method, 'POST');
      const body = options.body as FormData;
      assert.deepEqual(body.getAll('files').map((entry) => (entry as File).name), ['receipt.png']);
      return Response.json({ text: 'Scanned text' });
    },
  });

  assert.equal((await response.json()).text, 'Scanned text');
});

test('OCR transport parses successful OCR responses and normalizes empty text', async () => {
  const withText = await readOCRUploadResponse(Response.json({ text: 'Scanned text' }));
  assert.deepEqual(withText, { text: 'Scanned text' });

  const withoutText = await readOCRUploadResponse(Response.json({}));
  assert.deepEqual(withoutText, { text: '' });
});

test('OCR transport surfaces backend OCR errors with fallback handling', async () => {
  await assert.rejects(
    () => readOCRUploadResponse(new Response(JSON.stringify({ error: 'too large' }), {
      status: 413,
      headers: { 'Content-Type': 'application/json' },
      statusText: 'Payload Too Large',
    })),
    /too large/,
  );

  await assert.rejects(
    () => readOCRUploadResponse(new Response('not json', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
      statusText: 'Server Error',
    })),
    /Server Error/,
  );
});
