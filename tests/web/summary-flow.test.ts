import test from 'node:test';
import assert from 'node:assert/strict';

import { executeSummaryRequest } from '../../web-src/src/lib/summary-flow.js';

type DocumentStubElement = {
  innerText: string;
  innerHTML: string;
};

function installDocumentStub() {
  globalThis.document = {
    createElement() {
      let innerText = '';
      return {
        get innerText() {
          return innerText;
        },
        set innerText(value: string) {
          innerText = value;
        },
        set innerHTML(value: string) {
          innerText = value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        },
      } as DocumentStubElement;
    },
  } as unknown as Document;
}

test('executeSummaryRequest returns a summary result and normalized groq rate limits', async () => {
  installDocumentStub();

  const result = await executeSummaryRequest({
    apiURL: (path: string) => path,
    text: 'Long text',
    provider: 'groq',
    model: 'llama',
    now: () => 1000,
    fetchImpl: async () =>
      Response.json({
        provider: 'groq',
        model: 'llama',
        summary: '# Summary\n\nCondensed',
        rateLimits: {
          resetRequests: '2m',
          resetTokens: '30s',
        },
      }),
  });

  assert.equal(result.summaryResult.kind, 'summary');
  assert.equal(result.summaryResult.title, 'Summary Result');
  assert.equal(result.summaryResult.rawText, '# Summary\n\nCondensed');
  assert.match(result.summaryResult.plainText, /Summary/);
  assert.ok(result.rateLimits);
  assert.equal(result.rateLimits.resetRequestsAt, 121000);
  assert.equal(result.rateLimits.resetTokensAt, 31000);
});

test('executeSummaryRequest falls back to the requested provider and model when the payload omits them', async () => {
  installDocumentStub();

  const result = await executeSummaryRequest({
    apiURL: (path: string) => path,
    text: 'Long text',
    provider: 'mock',
    model: 'mock-model',
    fetchImpl: async () =>
      Response.json({
        summary: 'Condensed',
      }),
  });

  assert.equal(result.provider, 'mock');
  assert.equal(result.model, 'mock-model');
  assert.equal(result.summaryResult.rawText, 'Condensed');
});
