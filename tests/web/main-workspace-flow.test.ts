import test from 'node:test';
import assert from 'node:assert/strict';

import type { WorkspaceState } from '../../web-src/src/lib/workspace-contracts';
import {
  buildMainWorkspaceViewModel,
  buildPromotionStatusMessage,
} from '../../web-src/src/lib/main-workspace-flow.js';

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
  } as WorkspaceState);

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

test('buildPromotionStatusMessage keeps replace-only promotion messaging explicit', () => {
  assert.equal(buildPromotionStatusMessage('summary'), 'Summary replaced working text.');
  assert.equal(buildPromotionStatusMessage('ocr'), 'OCR result replaced working text.');
  assert.equal(buildPromotionStatusMessage(''), 'OCR result replaced working text.');
});
