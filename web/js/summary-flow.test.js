import test from 'node:test';
import assert from 'node:assert/strict';

import { executeSummaryRequest } from '../../web-src/src/lib/summary-flow.js';

test('executeSummaryRequest returns a summary result and normalized groq rate limits', async () => {
  globalThis.document = {
    createElement() {
      return {
        innerText: '',
        set innerHTML(value) {
          this.innerText = value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        },
      };
    },
  };

  const result = await executeSummaryRequest({
    apiURL: (path) => path,
    text: 'Long text',
    provider: 'groq',
    model: 'llama',
    now: () => 1000,
    fetchImpl: async () => Response.json({
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
  assert.equal(result.rateLimits.resetRequestsAt, 121000);
  assert.equal(result.rateLimits.resetTokensAt, 31000);
});
