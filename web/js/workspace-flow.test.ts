import test, { before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { renderAppShell } from '../../web-src/src/lib/app-shell.js';
import { createOCRTextResult } from '../../web-src/src/lib/ocr-result.js';

const html = `<!DOCTYPE html><html lang="en"><body>${renderAppShell()}</body></html>`;

type WorkspaceModule = typeof import('./workspace.js');
type OCRModule = typeof import('./ocr.js');
type SummarizerModule = typeof import('./summarizer.js');
type TTSModule = typeof import('./tts.js');

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
let elements: WorkspaceElements;
let fetchCalls: FetchCall[];
let objectUrlCounter = 0;

function requiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  assert.ok(element, `Expected #${id} to exist`);
  return element as T;
}

function exposeWindowToGlobals(domWindow: JSDOM['window']) {
  const windowLike = domWindow as unknown as typeof globalThis & Window;
  globalThis.window = windowLike;
  globalThis.document = windowLike.document;
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: windowLike.navigator,
  });
  globalThis.CustomEvent = windowLike.CustomEvent;
  globalThis.Event = windowLike.Event;
  globalThis.HTMLElement = windowLike.HTMLElement;
  globalThis.HTMLLabelElement = windowLike.HTMLLabelElement;
  globalThis.Blob = globalThis.Blob || windowLike.Blob;
  globalThis.File = globalThis.File || windowLike.File;
  globalThis.FileReader = globalThis.FileReader || windowLike.FileReader;
  globalThis.FormData = globalThis.FormData || windowLike.FormData;
  globalThis.atob = globalThis.atob || windowLike.atob.bind(windowLike);
  globalThis.btoa = globalThis.btoa || windowLike.btoa.bind(windowLike);
  const createObjectURL = () => `blob:mock-${objectUrlCounter += 1}`;
  const revokeObjectURL = () => {};
  globalThis.URL = globalThis.URL || windowLike.URL;
  globalThis.URL.createObjectURL = createObjectURL;
  globalThis.URL.revokeObjectURL = revokeObjectURL;
  windowLike.URL.createObjectURL = createObjectURL;
  windowLike.URL.revokeObjectURL = revokeObjectURL;
  if (!Object.getOwnPropertyDescriptor(windowLike.HTMLElement.prototype, 'innerText')) {
    Object.defineProperty(windowLike.HTMLElement.prototype, 'innerText', {
      configurable: true,
      get() {
        return this.textContent;
      },
      set(value: string) {
        this.textContent = value;
      },
    });
  }
}

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
  requiredElement<HTMLElement>('feed').innerHTML =
    '<p class="feed-empty" id="feed-empty">No activity yet.</p>';
  requiredElement<HTMLElement>('status-text').textContent = '';
}

function typeWorkingText(text: string) {
  elements.workingText.value = text;
  elements.workingText.dispatchEvent(new window.Event('input', { bubbles: true }));
}

async function flushAsyncWork() {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

before(async () => {
  const dom = new JSDOM(html, { url: 'http://localhost:8282/' });
  exposeWindowToGlobals(dom.window);
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

  const modelSelect = requiredElement<HTMLSelectElement>('model-select');
  modelSelect.innerHTML =
    '<option value="gemini-2.5-flash-preview-tts">gemini-2.5-flash-preview-tts</option>';
  modelSelect.value = 'gemini-2.5-flash-preview-tts';

  const voiceSelect = requiredElement<HTMLSelectElement>('voice-select');
  voiceSelect.innerHTML = '<option value="Kore">Kore</option>';
  voiceSelect.value = 'Kore';

  ocr.initOCR();
  summarizer.initSummarizer({ synthesizeText: tts.synthesizeText });
  tts.initTTS();
});

beforeEach(() => {
  resetFetchMock();
  resetWorkspaceState();
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

  assert.equal(fetchCalls[0]?.url, '/api/speak');
  assert.equal((fetchCalls[0]?.body as { text?: string } | undefined)?.text, 'Alpha beta');
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

  assert.equal(fetchCalls[1]?.url, '/api/speak');
  assert.equal((fetchCalls[1]?.body as { text?: string } | undefined)?.text, 'Listen to this');
  assert.equal(workspace.getWorkspace().lastAudioSourceLabel, 'Summary Result');
  assert.equal(workspace.getWorkspace().lastAudioSourceText, 'Listen to this');
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
