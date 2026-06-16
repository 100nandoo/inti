import test from 'node:test';
import assert from 'node:assert/strict';

import {
  downloadMainWorkspaceAudioSnapshot,
  executeMainWorkspaceSpeech,
} from '../../web-src/src/lib/main-workspace-speech-flow.js';
import { buildSpeechPanelViewModel } from '../../web-src/src/lib/speech-flow.js';
import { installDom, teardownPage } from './svelte-page-test-helpers.ts';

test('executeMainWorkspaceSpeech preserves the working-text speech request contract and feed metadata', async () => {
  const seenSnapshots: Array<{
    sourceText: string;
    sourceLabel: string;
    provider: string;
    voice: string;
    model: string;
  }> = [];
  const result = await executeMainWorkspaceSpeech({
    apiURL: (path: string) => path,
    text: 'Alpha beta',
    provider: 'gemini',
    voice: 'Kore',
    model: 'gemini-2.5-flash-preview-tts',
    onAudioSnapshotReady: async (audioSnapshot) => {
      seenSnapshots.push({
        sourceText: audioSnapshot.sourceText,
        sourceLabel: audioSnapshot.sourceLabel,
        provider: audioSnapshot.provider,
        voice: audioSnapshot.voice,
        model: audioSnapshot.model,
      });
    },
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

  assert.equal(result.audioSnapshot.sourceText, 'Alpha beta');
  assert.equal(result.audioSnapshot.sourceLabel, 'Working Text');
  assert.equal(result.audioSnapshot.provider, 'gemini');
  assert.equal(result.audioSnapshot.voice, 'Kore');
  assert.equal(result.audioSnapshot.model, 'gemini-2.5-flash-preview-tts');
  assert.equal(result.feedLabel, '"Alpha beta"');
  assert.equal(result.feedMeta, '2 words · 0.4s · gemini · gemini-2.5-flash-preview-tts · Kore · 0.0 KB');
  assert.equal(result.downloadedAudio, false);
  assert.deepEqual(seenSnapshots, [{
    sourceText: 'Alpha beta',
    sourceLabel: 'Working Text',
    provider: 'gemini',
    voice: 'Kore',
    model: 'gemini-2.5-flash-preview-tts',
  }]);
});

test('executeMainWorkspaceSpeech owns auto-play and auto-download follow-up behavior', async () => {
  const dom = installDom('http://localhost:8282/');
  const events: string[] = [];
  const decodeCalls: Array<{ type: string; size: number }> = [];
  const anchorClicks: string[] = [];

  const originalBlob = globalThis.Blob;
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;
  const originalCreateElement = document.createElement.bind(document);

  globalThis.Blob = window.Blob;
  URL.createObjectURL = () => 'blob:test-audio';
  URL.revokeObjectURL = (url) => {
    events.push(`revoke:${url}`);
  };
  document.createElement = ((tagName: string) => {
    const element = originalCreateElement(tagName);
    if (tagName === 'a') {
      Object.defineProperty(element, 'click', {
        configurable: true,
        value: () => {
          anchorClicks.push((element as HTMLAnchorElement).download);
          events.push(`download:${(element as HTMLAnchorElement).download}`);
        },
      });
    }
    return element;
  }) as typeof document.createElement;

  try {
    const result = await executeMainWorkspaceSpeech({
      apiURL: (path: string) => path,
      text: 'Alpha beta',
      provider: 'gemini',
      voice: 'Kore',
      model: 'gemini-2.5-flash-preview-tts',
      autoPlay: true,
      autoDownload: true,
      onAudioSnapshotReady: async () => {
        events.push('snapshot-ready');
      },
      audioContextFactory: () => ({
        destination: {},
        decodeAudioData: async (buffer: ArrayBuffer) => {
          decodeCalls.push({ type: 'audio/opus', size: buffer.byteLength });
          events.push('decode');
          return {} as AudioBuffer;
        },
        createBufferSource: () => {
          let ended: (() => void) | null = null;
          return {
            set buffer(_value: AudioBuffer | null) {},
            connect: () => {},
            start: () => {
              events.push('start');
              queueMicrotask(() => ended?.());
            },
            set onended(handler: (() => void) | null) {
              ended = handler;
            },
          };
        },
        close: async () => {
          events.push('close');
        },
      }) as unknown as AudioContext,
      fetchImpl: async () => Response.json({
        opus: Buffer.from('opus-audio').toString('base64'),
        provider: 'gemini',
        voice: 'Kore',
        model: 'gemini-2.5-flash-preview-tts',
      }),
    });

    assert.equal(result.downloadedAudio, true);
    assert.equal(anchorClicks.length, 1);
    assert.equal(anchorClicks[0]?.endsWith('.opus'), true);
    assert.equal(decodeCalls.length, 1);
    assert.deepEqual(events.slice(0, 6), [
      'snapshot-ready',
      'decode',
      'start',
      'close',
      `download:${anchorClicks[0]}`,
      'revoke:blob:test-audio',
    ]);
  } finally {
    globalThis.Blob = originalBlob;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    document.createElement = originalCreateElement;
    teardownPage(dom);
  }
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
