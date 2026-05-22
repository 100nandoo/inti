import test from 'node:test';
import assert from 'node:assert/strict';

import {
  currentDefaultSpeechVoice,
  loadMainWorkspaceSpeechConfig,
  loadMainWorkspaceSpeechControlState,
  saveMainWorkspaceSpeechConfig,
} from '../../web-src/src/lib/main-workspace-speech-controls.js';

test('loadMainWorkspaceSpeechConfig reads the saved server speech selection', async () => {
  const result = await loadMainWorkspaceSpeechConfig({
    apiURL: (path: string) => path,
    fetchImpl: async (url) => {
      assert.equal(String(url), '/api/speech-config');
      return Response.json({
        provider: 'gemini',
        voice: 'Kore',
        model: 'gemini-2.5-flash-preview-tts',
      });
    },
  });

  assert.equal(result.provider, 'gemini');
  assert.equal(result.voice, 'Kore');
  assert.equal(result.model, 'gemini-2.5-flash-preview-tts');
});

test('saveMainWorkspaceSpeechConfig posts kokoro without a model selection', async () => {
  const result = await saveMainWorkspaceSpeechConfig({
    apiURL: (path: string) => path,
    provider: 'kokoro-heart',
    voice: 'cheery',
    model: 'ignored-model',
    fetchImpl: async (url, options = {}) => {
      assert.equal(String(url), '/api/speech-config');
      assert.deepEqual(JSON.parse(options.body as string), {
        provider: 'kokoro-heart',
        voice: 'cheery',
        model: '',
      });
      return Response.json({
        provider: 'kokoro-heart',
        voice: 'cheery',
        model: '',
      });
    },
  });

  assert.equal(result.provider, 'kokoro-heart');
  assert.equal(result.model, '');
});

test('loadMainWorkspaceSpeechControlState resolves kokoro voice controls and disables models', async () => {
  const result = await loadMainWorkspaceSpeechControlState({
    apiURL: (path: string) => path,
    provider: 'kokoro-heart',
    selectedVoice: '',
    selectedModel: '',
    fetchImpl: async (url) => {
      if (String(url) === '/api/models?provider=kokoro-heart') {
        return Response.json({ provider: 'kokoro-heart', models: [], default: '' });
      }
      if (String(url) === '/api/voices?provider=kokoro-heart') {
        return Response.json({ provider: 'kokoro-heart', voices: ['cheery'], default: 'cheery' });
      }
      throw new Error(`Unexpected fetch to ${String(url)}`);
    },
  });

  assert.equal(result.provider, 'kokoro-heart');
  assert.equal(result.selectedVoice, 'cheery');
  assert.equal(result.selectedModel, '');
  assert.equal(result.modelDisabled, true);
  assert.equal(result.genderFilterDisabled, true);
  assert.deepEqual(result.voiceOptions, [{ value: 'cheery', label: 'cheery — Upstream' }]);
  assert.equal(currentDefaultSpeechVoice('kokoro-heart'), 'cheery');
});
