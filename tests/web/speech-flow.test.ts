import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildSpeechPanelViewModel,
  countWords,
  requestSpeechSynthesis,
} from '../../web-src/src/lib/speech-flow.js';

test('requestSpeechSynthesis returns an audio blob from the speak API payload', async () => {
  const result = await requestSpeechSynthesis({
    apiURL: (path: string) => path,
    provider: 'gemini',
    text: 'Alpha beta',
    voice: 'Kore',
    model: 'flash',
    fetchImpl: async (url, options = {}) => {
      assert.equal(String(url), '/api/speak');
      assert.deepEqual(JSON.parse(options.body as string), {
        text: 'Alpha beta',
        provider: 'gemini',
        voice: 'Kore',
        model: 'flash',
      });
      return Response.json({
        opus: Buffer.from('opus-audio').toString('base64'),
        provider: 'gemini',
        voice: 'Kore',
        model: 'flash',
      });
    },
  });

  assert.equal(result.blob.type, 'audio/opus');
  assert.equal(result.bytes.length > 0, true);
  assert.equal(result.provider, 'gemini');
  assert.equal(result.voice, 'Kore');
  assert.equal(result.model, 'flash');
});

test('requestSpeechSynthesis rejects malformed speak API payloads', async () => {
  await assert.rejects(
    requestSpeechSynthesis({
      apiURL: (path: string) => path,
      provider: 'gemini',
      text: 'Alpha beta',
      voice: 'Kore',
      model: 'flash',
      fetchImpl: async () => Response.json({}),
    }),
    /invalid speech response/,
  );
});

test('buildSpeechPanelViewModel preserves latest audio snapshot metadata after later edits', () => {
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
    lastAudioSourceLabel: 'Summary Result',
    lastAudioSourceText: 'Stable audio snapshot',
    lastAudioProvider: 'kokoro-heart',
    lastAudioVoice: 'cheery',
    lastAudioModel: '',
  });

  assert.equal(viewModel.hasAudio, true);
  assert.match(viewModel.audioMeta, /Summary Result/);
  assert.match(viewModel.audioMeta, /kokoro heart/);
  assert.match(viewModel.audioMeta, /experimental upstream/);
  assert.match(viewModel.speechPreviewHtml, /Edited after audio generation/);
  assert.match(viewModel.audioCardHtml, /Stable audio snapshot/);
  assert.match(viewModel.audioCardHtml, /cheery/);
  assert.equal(countWords('Stable audio snapshot'), 3);
});
