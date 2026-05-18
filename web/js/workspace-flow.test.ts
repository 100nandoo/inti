import test, { after, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { renderAppShell } from '../../web-src/src/lib/app-shell.js';
import { createOCRTextResult } from '../../web-src/src/lib/ocr-result.js';
import {
  flushAsyncWork,
  installDomWithHTML,
  requiredElement,
  setInputValue,
  teardownPage,
} from './svelte-page-test-helpers.ts';

type WorkspaceModule = typeof import('./workspace.js');
type OCRModule = typeof import('./ocr.js');
type SummarizerModule = typeof import('./summarizer.js');
type TTSModule = typeof import('./tts.js');
type VoicesModule = typeof import('./voices.js');

type WorkspaceElements = {
  workingText: HTMLTextAreaElement;
  summarizeBtn: HTMLButtonElement;
  runOcrBtn: HTMLButtonElement;
  generateWorkingAudioBtn: HTMLButtonElement;
  generateResultAudioBtn: HTMLButtonElement;
  resultPromoteDefaultBtn: HTMLButtonElement;
  resultPromoteDefaultLabel: HTMLElement;
  audioResultCard: HTMLElement;
  textResultTitle: HTMLElement;
  textResultContent: HTMLElement;
};

type FetchCall = {
  url: string;
  options: RequestInit;
  body: unknown;
};

let workspace: WorkspaceModule;
let ocr: OCRModule;
let summarizer: SummarizerModule;
let tts: TTSModule;
let voices: VoicesModule;
let elements: WorkspaceElements;
let fetchCalls: FetchCall[];
let dom: ReturnType<typeof installDomWithHTML> | null = null;

function cacheElements() {
  elements = {
    workingText: requiredElement<HTMLTextAreaElement>('working-text'),
    summarizeBtn: requiredElement<HTMLButtonElement>('summarize-btn'),
    runOcrBtn: requiredElement<HTMLButtonElement>('run-ocr-btn'),
    generateWorkingAudioBtn: requiredElement<HTMLButtonElement>('generate-working-audio-btn'),
    generateResultAudioBtn: requiredElement<HTMLButtonElement>('generate-result-audio-btn'),
    resultPromoteDefaultBtn: requiredElement<HTMLButtonElement>('result-promote-default-btn'),
    resultPromoteDefaultLabel: requiredElement<HTMLElement>('result-promote-default-label'),
    audioResultCard: requiredElement<HTMLElement>('audio-result-card'),
    textResultTitle: requiredElement<HTMLElement>('text-result-title'),
    textResultContent: requiredElement<HTMLElement>('text-result-content'),
  };
}

function resetFetchMock() {
  fetchCalls = [];
  globalThis.fetch = async (url, options = {}) => {
    const formDataBody = options.body instanceof window.FormData ? options.body : null;
    const urlText = typeof url === 'string' ? url : url.toString();
    fetchCalls.push({
      url: urlText,
      options,
      body: formDataBody
        ? { files: formDataBody.getAll('files').map((file) => (file as File).name) }
        : (options.body ? JSON.parse(options.body as string) : null),
    });

    if (urlText === '/api/summarize') {
      return Response.json({
        provider: 'mock',
        model: 'mock-model',
        summary: '# Summary\n\nCondensed result',
      });
    }

    if (urlText === '/api/speak') {
      return Response.json({
        opus: Buffer.from('opus-audio').toString('base64'),
      });
    }

    if (urlText === '/api/speech-config') {
      return Response.json({
        provider: 'gemini',
        voice: 'Kore',
        model: 'gemini-2.5-flash-preview-tts',
      });
    }

    if (urlText === '/api/voices?provider=gemini') {
      return Response.json({
        provider: 'gemini',
        voices: ['Kore', 'Puck'],
        default: 'Kore',
      });
    }

    if (urlText === '/api/voices?provider=kokoro-heart') {
      return Response.json({
        provider: 'kokoro-heart',
        voices: ['cheery'],
        default: 'cheery',
      });
    }

    if (urlText === '/api/models?provider=gemini') {
      return Response.json({
        provider: 'gemini',
        models: ['gemini-2.5-flash-preview-tts'],
        default: 'gemini-2.5-flash-preview-tts',
      });
    }

    if (urlText === '/api/models?provider=kokoro-heart') {
      return Response.json({
        provider: 'kokoro-heart',
        models: [],
        default: '',
      });
    }

    if (urlText === '/api/ocr') {
      return Response.json({
        text: 'Scanned text from OCR',
      });
    }

    throw new Error(`Unexpected fetch to ${urlText}`);
  };
}

function resetWorkspaceState() {
  workspace.setProcessing(false);
  workspace.clearWorkingText();
  workspace.clearLatestTextResult();
  workspace.clearLastAudioBlob();
  workspace.setStagedFiles([]);
  workspace.applyAppearanceConfig({
    summaryDownloadFormat: 'md',
    ocrPromotionBehavior: 'append',
    summaryPromotionBehavior: 'append',
  });
  workspace.applySpeechConfig({
    provider: 'gemini',
    voice: 'Kore',
    model: 'gemini-2.5-flash-preview-tts',
  });
  workspace.setSelectedSpeechSelection('gemini', 'Kore', 'gemini-2.5-flash-preview-tts');
  requiredElement<HTMLElement>('feed').innerHTML =
    '<p class="feed-empty" id="feed-empty">No activity yet.</p>';
  requiredElement<HTMLElement>('status-text').textContent = '';
}

function typeWorkingText(text: string) {
  setInputValue(elements.workingText, text);
}

before(async () => {
  dom = installDomWithHTML('http://localhost:8282/', renderAppShell());
  (window as typeof window & { apiURL: (path: string) => string }).apiURL = (path) => path;
  (
    window as typeof window & {
      IntiTheme: {
        summaryDownloadFormat: string;
        ocrPromotionBehavior: string;
        summaryPromotionBehavior: string;
      };
    }
  ).IntiTheme = {
    summaryDownloadFormat: 'md',
    ocrPromotionBehavior: 'append',
    summaryPromotionBehavior: 'append',
  };
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: async () => {} },
  });

  cacheElements();
  resetFetchMock();

  workspace = await import('./workspace.js');
  ocr = await import('./ocr.js');
  summarizer = await import('./summarizer.js');
  tts = await import('./tts.js');
  voices = await import('./voices.js');

  ocr.initOCR();
  summarizer.initSummarizer({ synthesizeText: tts.synthesizeText });
  await voices.initVoices();
  tts.initTTS();
});

after(() => {
  teardownPage(dom);
});

beforeEach(async () => {
  resetFetchMock();
  resetWorkspaceState();
  await voices.initVoices();
});

test('summary and OCR promotions honor their configured default behaviors', async () => {
  workspace.applyAppearanceConfig({
    summaryDownloadFormat: 'md',
    ocrPromotionBehavior: 'append',
    summaryPromotionBehavior: 'replace',
  });

  typeWorkingText('Working draft');
  elements.summarizeBtn.click();
  await flushAsyncWork();

  assert.equal(workspace.getWorkspace().latestTextResult.kind, 'summary');
  assert.equal(elements.resultPromoteDefaultLabel.textContent, 'Replace Working Text');

  elements.resultPromoteDefaultBtn.click();
  assert.equal(workspace.getWorkspace().workingText, '# Summary\n\nCondensed result');

  workspace.applyAppearanceConfig({
    summaryDownloadFormat: 'md',
    ocrPromotionBehavior: 'append',
    summaryPromotionBehavior: 'replace',
  });
  typeWorkingText('Workspace text');
  workspace.setLatestTextResult({
    kind: 'ocr',
    title: 'OCR Result',
    format: 'plain',
    rawText: 'Scanned text',
    plainText: 'Scanned text',
  });

  assert.equal(elements.resultPromoteDefaultLabel.textContent, 'Append to Working Text');
  elements.resultPromoteDefaultBtn.click();
  assert.equal(workspace.getWorkspace().workingText, 'Workspace text\n\nScanned text');
});

test('ocr results publish to the shared result surface without mutating working text', async () => {
  workspace.setLatestTextResult(createOCRTextResult('Scanned text from OCR'));
  await flushAsyncWork();

  assert.equal(workspace.getWorkspace().latestTextResult.kind, 'ocr');
  assert.equal(workspace.getWorkspace().latestTextResult.rawText, 'Scanned text from OCR');
  assert.equal(workspace.getWorkspace().workingText, '');
  assert.equal(elements.workingText.value, '');
  assert.equal(elements.textResultTitle.textContent, 'OCR Result');
  assert.match(elements.textResultContent.textContent ?? '', /Scanned text from OCR/);
  assert.equal(elements.resultPromoteDefaultLabel.textContent, 'Append to Working Text');

  elements.resultPromoteDefaultBtn.click();
  assert.equal(workspace.getWorkspace().workingText, 'Scanned text from OCR');
});

test('speech generation works from working text and latest text result', async () => {
  typeWorkingText('Alpha beta');

  elements.generateWorkingAudioBtn.click();
  await flushAsyncWork();

  let speakCalls = fetchCalls.filter((call) => call.url === '/api/speak');
  assert.deepEqual(speakCalls[0]?.body, {
    text: 'Alpha beta',
    provider: 'gemini',
    voice: 'Kore',
    model: 'gemini-2.5-flash-preview-tts',
  });
  assert.equal(workspace.getWorkspace().lastAudioSourceLabel, 'Working Text');
  assert.equal(workspace.getWorkspace().lastAudioSourceText, 'Alpha beta');

  workspace.setLatestTextResult({
    kind: 'summary',
    title: 'Summary Result',
    format: 'markdown',
    rawText: '# Result\n\nListen to this',
    plainText: 'Listen to this',
  });

  elements.generateResultAudioBtn.click();
  await flushAsyncWork();

  speakCalls = fetchCalls.filter((call) => call.url === '/api/speak');
  assert.deepEqual(speakCalls[1]?.body, {
    text: 'Listen to this',
    provider: 'gemini',
    voice: 'Kore',
    model: 'gemini-2.5-flash-preview-tts',
  });
  assert.equal(workspace.getWorkspace().lastAudioSourceLabel, 'Summary Result');
  assert.equal(workspace.getWorkspace().lastAudioSourceText, 'Listen to this');
});

test('speech provider selection restores kokoro controls and omits model selection', async () => {
  globalThis.fetch = async (url, options = {}) => {
    const urlText = typeof url === 'string' ? url : url.toString();
    const formDataBody = options.body instanceof window.FormData ? options.body : null;
    fetchCalls.push({
      url: urlText,
      options,
      body: formDataBody
        ? { files: formDataBody.getAll('files').map((file) => (file as File).name) }
        : (options.body ? JSON.parse(options.body as string) : null),
    });

    if (urlText === '/api/speech-config') {
      return Response.json({
        provider: 'kokoro-heart',
        voice: 'cheery',
        model: '',
      });
    }
    if (urlText === '/api/voices?provider=kokoro-heart') {
      return Response.json({ provider: 'kokoro-heart', voices: ['cheery'], default: 'cheery' });
    }
    if (urlText === '/api/models?provider=kokoro-heart') {
      return Response.json({ provider: 'kokoro-heart', models: [], default: '' });
    }
    if (urlText === '/api/speak') {
      return Response.json({ opus: Buffer.from('opus-audio').toString('base64') });
    }
    if (urlText === '/api/summarize') {
      return Response.json({
        provider: 'mock',
        model: 'mock-model',
        summary: '# Summary\n\nCondensed result',
      });
    }
    if (urlText === '/api/ocr') {
      return Response.json({ text: 'Scanned text from OCR' });
    }
    throw new Error(`Unexpected fetch to ${urlText}`);
  };

  await voices.initVoices();
  await flushAsyncWork();

  assert.equal(requiredElement<HTMLSelectElement>('speech-provider-select').value, 'kokoro-heart');
  assert.equal(requiredElement<HTMLSelectElement>('voice-select').value, 'cheery');
  assert.equal(requiredElement<HTMLSelectElement>('model-select').disabled, true);

  typeWorkingText('Kokoro text');
  elements.generateWorkingAudioBtn.click();
  await flushAsyncWork();

  assert.deepEqual(fetchCalls.at(-1)?.body, {
    text: 'Kokoro text',
    provider: 'kokoro-heart',
    voice: 'cheery',
    model: '',
  });
});

test('latest audio result persists after later working text edits', async () => {
  workspace.setLatestTextResult({
    kind: 'summary',
    title: 'Summary Result',
    format: 'markdown',
    rawText: '# Result\n\nStable audio snapshot',
    plainText: 'Stable audio snapshot',
  });

  elements.generateResultAudioBtn.click();
  await flushAsyncWork();

  typeWorkingText('Edited after audio generation');

  assert.ok(workspace.getWorkspace().lastAudioBlob);
  assert.equal(workspace.getWorkspace().lastAudioSourceText, 'Stable audio snapshot');
  assert.match(elements.audioResultCard.textContent ?? '', /Stable audio snapshot/);
});
