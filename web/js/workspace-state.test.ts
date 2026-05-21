import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  appendToWorkingText,
  applyAppearanceConfig,
  clearLastAudioBlob,
  clearLatestTextResult,
  getDefaultPromotionBehavior,
  getWorkspaceSnapshot,
  promoteLatestTextResult,
  replaceWorkingText,
  setInputMode,
  setLastAudioResult,
  setLatestTextResult,
  setWorkingTextRunMode,
  setWorkingText,
} from '../../web-src/src/lib/workspace-state.js';

function resetWorkspaceState() {
  setWorkingText('');
  clearLatestTextResult();
  clearLastAudioBlob();
  setWorkingTextRunMode('summary');
  applyAppearanceConfig({
    summaryDownloadFormat: 'md',
    ocrPromotionBehavior: 'append',
    summaryPromotionBehavior: 'append',
  });
}

beforeEach(() => {
  resetWorkspaceState();
});

test('promotion defaults stay scoped to summary and OCR result kinds', () => {
  applyAppearanceConfig({
    summaryDownloadFormat: 'txt',
    ocrPromotionBehavior: 'append',
    summaryPromotionBehavior: 'replace',
  });

  assert.equal(getDefaultPromotionBehavior('summary'), 'replace');
  assert.equal(getDefaultPromotionBehavior('ocr'), 'replace');
  assert.equal(getDefaultPromotionBehavior('unknown' as Parameters<typeof getDefaultPromotionBehavior>[0]), 'replace');
});

test('input mode changes preserve staged OCR files and working text', () => {
  setWorkingText('Working draft');
  setInputMode('ocr');
  assert.equal(getWorkspaceSnapshot().inputMode, 'ocr');
  assert.equal(getWorkspaceSnapshot().workingText, 'Working draft');

  setInputMode('working-text');
  assert.equal(getWorkspaceSnapshot().inputMode, 'working-text');
  assert.equal(getWorkspaceSnapshot().workingText, 'Working draft');
});

test('re-entering working text mode from OCR resets the run mode to summary', () => {
  setWorkingTextRunMode('voice');
  assert.equal(getWorkspaceSnapshot().workingTextRunMode, 'voice');

  setInputMode('ocr');
  setInputMode('working-text');

  assert.equal(getWorkspaceSnapshot().workingTextRunMode, 'summary');
});

test('promoting the latest text result replaces working text', () => {
  setWorkingText('Working draft');
  setLatestTextResult({
    kind: 'summary',
    title: 'Summary Result',
    rawText: 'Condensed result',
    plainText: 'Condensed result',
  });

  assert.equal(promoteLatestTextResult('replace'), true);
  assert.equal(getWorkspaceSnapshot().workingText, 'Condensed result');
});

test('audio result metadata survives later working text edits', () => {
  const blob = new Blob(['opus-audio'], { type: 'audio/opus' });

  setLastAudioResult(blob, 'Stable audio snapshot', 'Summary Result', {
    provider: 'kokoro-heart',
    voice: 'cheery',
    model: '',
  });
  appendToWorkingText('Edited later');

  const state = getWorkspaceSnapshot();
  assert.equal(state.lastAudioBlob, blob);
  assert.equal(state.lastAudioSourceText, 'Stable audio snapshot');
  assert.equal(state.lastAudioSourceLabel, 'Summary Result');
  assert.equal(state.lastAudioProvider, 'kokoro-heart');
  assert.equal(state.lastAudioVoice, 'cheery');
  assert.equal(state.lastAudioModel, '');
});
