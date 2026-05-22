import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildMainWorkspaceViewModel,
  buildPromotionStatusMessage,
  executeMainWorkspaceSummary,
} from '../../web-src/src/lib/main-workspace-flow.js';

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

test('buildMainWorkspaceViewModel exposes Svelte-owned workspace state and result surface data', () => {
  const viewModel = buildMainWorkspaceViewModel({
    activeOutputTab: 'summary',
    inputMode: 'working-text',
    workingTextRunMode: 'voice',
    workingText: 'Draft owned by Svelte',
    latestTextResult: {
      kind: 'summary',
      title: 'Summary Result',
      format: 'markdown',
      rawText: '# Heading\n\nCondensed text',
      plainText: 'Heading Condensed text',
    },
    latestOCRTextResult: {
      kind: 'ocr',
      title: 'OCR Result',
      format: 'plain',
      rawText: 'Scanned text',
      plainText: 'Scanned text',
    },
    latestSummaryTextResult: {
      kind: 'summary',
      title: 'Summary Result',
      format: 'markdown',
      rawText: '# Heading\n\nCondensed text',
      plainText: 'Heading Condensed text',
    },
    lastAudioBlob: null,
  });

  assert.equal(viewModel.isOcrMode, false);
  assert.equal(viewModel.isWorkingTextMode, true);
  assert.equal(viewModel.isSummaryMode, false);
  assert.equal(viewModel.isVoiceMode, true);
  assert.equal(viewModel.actionTabs.ocr.disabled, true);
  assert.equal(viewModel.actionTabs.voice.active, true);
  assert.equal(viewModel.hasWorkingText, true);
  assert.equal(viewModel.workingTextCharacterCount, 21);
  assert.equal(viewModel.speechInputCharacterCount, 21);
  assert.equal(viewModel.textResultCharacterCount, 22);
  assert.equal(viewModel.resultViewModel.activeTab, 'summary');
  assert.equal(viewModel.resultViewModel.kindChip, 'Summary result');
  assert.equal(viewModel.resultViewModel.defaultPromotionLabel, 'Replace Working Text');
});

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

test('buildPromotionStatusMessage keeps replace-only promotion messaging explicit', () => {
  assert.equal(buildPromotionStatusMessage('summary'), 'Summary replaced working text.');
  assert.equal(buildPromotionStatusMessage('ocr'), 'OCR result replaced working text.');
  assert.equal(buildPromotionStatusMessage(''), 'OCR result replaced working text.');
});
