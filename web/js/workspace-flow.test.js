import test, { before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { renderAppShell } from '../../web-src/src/lib/app-shell.js';

const html = `<!DOCTYPE html><html lang="en"><body>${renderAppShell()}</body></html>`;

let workspace;
let ocr;
let summarizer;
let tts;
let elements;
let fetchCalls;
let objectUrlCounter = 0;

function exposeWindowToGlobals(window) {
  globalThis.window = window;
  globalThis.document = window.document;
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: window.navigator,
  });
  globalThis.CustomEvent = window.CustomEvent;
  globalThis.Event = window.Event;
  globalThis.HTMLElement = window.HTMLElement;
  globalThis.HTMLLabelElement = window.HTMLLabelElement;
  globalThis.Blob = globalThis.Blob || window.Blob;
  globalThis.File = globalThis.File || window.File;
  globalThis.FileReader = globalThis.FileReader || window.FileReader;
  globalThis.FormData = globalThis.FormData || window.FormData;
  globalThis.atob = globalThis.atob || window.atob.bind(window);
  globalThis.btoa = globalThis.btoa || window.btoa.bind(window);
  const createObjectURL = () => `blob:mock-${objectUrlCounter += 1}`;
  const revokeObjectURL = () => {};
  globalThis.URL = globalThis.URL || window.URL;
  globalThis.URL.createObjectURL = createObjectURL;
  globalThis.URL.revokeObjectURL = revokeObjectURL;
  window.URL.createObjectURL = createObjectURL;
  window.URL.revokeObjectURL = revokeObjectURL;
  if (!Object.getOwnPropertyDescriptor(window.HTMLElement.prototype, 'innerText')) {
    Object.defineProperty(window.HTMLElement.prototype, 'innerText', {
      configurable: true,
      get() {
        return this.textContent;
      },
      set(value) {
        this.textContent = value;
      },
    });
  }
}

function cacheElements() {
  elements = {
    workingText: document.getElementById('working-text'),
    summarizeBtn: document.getElementById('summarize-btn'),
    runOcrBtn: document.getElementById('run-ocr-btn'),
    generateWorkingAudioBtn: document.getElementById('generate-working-audio-btn'),
    generateResultAudioBtn: document.getElementById('generate-result-audio-btn'),
    resultPromoteDefaultBtn: document.getElementById('result-promote-default-btn'),
    resultPromoteDefaultLabel: document.getElementById('result-promote-default-label'),
    audioResultCard: document.getElementById('audio-result-card'),
    textResultTitle: document.getElementById('text-result-title'),
    textResultContent: document.getElementById('text-result-content'),
  };
}

function resetFetchMock() {
  fetchCalls = [];
  globalThis.fetch = async (url, options = {}) => {
    const isFormDataBody = typeof window.FormData !== 'undefined' && options.body instanceof window.FormData;
    fetchCalls.push({
      url,
      options,
      body: isFormDataBody
        ? { files: options.body.getAll('files').map((file) => file.name) }
        : (options.body ? JSON.parse(options.body) : null),
    });

    if (url === '/api/summarize') {
      return Response.json({
        provider: 'mock',
        model: 'mock-model',
        summary: '# Summary\n\nCondensed result',
      });
    }

    if (url === '/api/speak') {
      return Response.json({
        opus: Buffer.from('opus-audio').toString('base64'),
      });
    }

    if (url === '/api/ocr') {
      return Response.json({
        text: 'Scanned text from OCR',
      });
    }

    throw new Error(`Unexpected fetch to ${url}`);
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
  document.getElementById('feed').innerHTML = '<p class="feed-empty" id="feed-empty">No activity yet.</p>';
  document.getElementById('status-text').textContent = '';
}

function typeWorkingText(text) {
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
  window.apiURL = (path) => path;
  window.IntiTheme = {
    summaryDownloadFormat: 'md',
    ocrPromotionBehavior: 'append',
    summaryPromotionBehavior: 'append',
  };
  navigator.clipboard = { writeText: async () => {} };

  cacheElements();
  resetFetchMock();

  workspace = await import('./workspace.js');
  ocr = await import('./ocr.js');
  summarizer = await import('./summarizer.js');
  tts = await import('./tts.js');

  const modelSelect = document.getElementById('model-select');
  modelSelect.innerHTML = '<option value="gemini-2.5-flash-preview-tts">gemini-2.5-flash-preview-tts</option>';
  modelSelect.value = 'gemini-2.5-flash-preview-tts';

  const voiceSelect = document.getElementById('voice-select');
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

test('speech generation works from working text and latest text result', async () => {
  typeWorkingText('Alpha beta');

  elements.generateWorkingAudioBtn.click();
  await flushAsyncWork();

  assert.equal(fetchCalls[0].url, '/api/speak');
  assert.equal(fetchCalls[0].body.text, 'Alpha beta');
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

  assert.equal(fetchCalls[1].url, '/api/speak');
  assert.equal(fetchCalls[1].body.text, 'Listen to this');
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
  assert.match(elements.audioResultCard.textContent, /Stable audio snapshot/);
});
