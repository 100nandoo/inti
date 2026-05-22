import test from 'node:test';
import assert from 'node:assert/strict';

import {
  downloadMainWorkspaceAudioSnapshot,
  executeMainWorkspaceSpeech,
} from '../../web-src/src/lib/main-workspace-speech-flow.js';
import { buildSpeechPanelViewModel } from '../../web-src/src/lib/speech-flow.js';

test('executeMainWorkspaceSpeech preserves the working-text speech request contract and feed metadata', async () => {
  const result = await executeMainWorkspaceSpeech({
    apiURL: (path: string) => path,
    text: 'Alpha beta',
    provider: 'gemini',
    voice: 'Kore',
    model: 'gemini-2.5-flash-preview-tts',
    performanceNow: (() => {
      let tick = 0;
      return () => {
        tick += 400;
        return tick;
      };
    })(),
    fetchImpl: async (url, options = {}) => {
      assert.equal(String(url), '/api/speak');
      assert.deepEqual(JSON.parse(options.body as string), {
        text: 'Alpha beta',
        provider: 'gemini',
        voice: 'Kore',
        model: 'gemini-2.5-flash-preview-tts',
      });
      return Response.json({
        opus: Buffer.from('opus-audio').toString('base64'),
        provider: 'gemini',
        voice: 'Kore',
        model: 'gemini-2.5-flash-preview-tts',
      });
    },
  });

  assert.equal(result.sourceText, 'Alpha beta');
  assert.equal(result.provider, 'gemini');
  assert.equal(result.voice, 'Kore');
  assert.equal(result.model, 'gemini-2.5-flash-preview-tts');
  assert.equal(result.feedLabel, '"Alpha beta"');
  assert.equal(result.feedMeta, '2 words · 0.4s · gemini · gemini-2.5-flash-preview-tts · Kore · 0.0 KB');
});

test('buildSpeechPanelViewModel keeps the latest audio snapshot after later working-text edits', () => {
  const blob = new Blob(['opus-audio'], { type: 'audio/opus' });
  const viewModel = buildSpeechPanelViewModel({
    processing: false,
    workingText: 'Edited after audio generation',
    latestTextResult: {
      kind: 'summary',
      title: 'Summary Result',
      format: 'plain',
      rawText: 'Latest result',
      plainText: 'Latest result',
    },
    lastAudioBlob: blob,
    lastAudioSourceLabel: 'Working Text',
    lastAudioSourceText: 'Stable audio snapshot',
    lastAudioProvider: 'gemini',
    lastAudioVoice: 'Kore',
    lastAudioModel: 'gemini-2.5-flash-preview-tts',
  });

  assert.equal(viewModel.hasAudio, true);
  assert.match(viewModel.audioMeta, /Working Text/);
  assert.match(viewModel.audioMeta, /gemini · gemini-2\.5-flash-preview-tts · Kore/);
  assert.match(viewModel.audioCardHtml, /Stable audio snapshot/);
  assert.match(viewModel.speechPreviewHtml, /Edited after audio generation/);
});

test('downloadMainWorkspaceAudioSnapshot returns false when there is no audio to save', () => {
  assert.equal(downloadMainWorkspaceAudioSnapshot(null, 'audio'), false);
});
