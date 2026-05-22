import test from 'node:test';
import assert from 'node:assert/strict';

import { executeMainWorkspaceSummary } from '../../web-src/src/lib/main-workspace-summary-service.js';

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

test('executeMainWorkspaceSummary preserves the shared summary request contract and feed metadata', async () => {
  installDocumentStub();

  const result = await executeMainWorkspaceSummary({
    apiURL: (path: string) => path,
    text: 'Working draft for summary',
    provider: '',
    model: '',
    now: () => 1000,
    performanceNow: (() => {
      let tick = 0;
      return () => {
        tick += 400;
        return tick;
      };
    })(),
    fetchImpl: async (url, options = {}) => {
      assert.equal(String(url), '/api/summarize');
      assert.deepEqual(JSON.parse(options.body as string), {
        text: 'Working draft for summary',
        instruction: '',
        provider: '',
        model: '',
      });
      return Response.json({
        provider: 'mock',
        model: 'mock-model',
        summary: '# Summary\n\nCondensed result',
      });
    },
  });

  assert.equal(result.summaryResult.kind, 'summary');
  assert.equal(result.summaryResult.title, 'Summary Result');
  assert.equal(result.summaryResult.rawText, '# Summary\n\nCondensed result');
  assert.equal(result.feedLabel, '"Working draft for summary"');
  assert.equal(result.feedMeta, '4 words → summary · 0.4s · mock-model');
});

test('executeMainWorkspaceSummary rejects empty working text before calling transport', async () => {
  await assert.rejects(
    () => executeMainWorkspaceSummary({
      apiURL: (path: string) => path,
      text: '   ',
      provider: '',
      model: '',
      fetchImpl: async () => {
        throw new Error('transport should not run');
      },
    }),
    /Working text is empty\./,
  );
});
