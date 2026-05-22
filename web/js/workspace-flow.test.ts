import test, { after, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createOCRTextResult } from '../../web-src/src/lib/ocr-result.js';
import { renderMainWorkspaceFixture } from './main-workspace-fixture.ts';
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
type WorkspaceElements = {
  inputModeOcrBtn: HTMLButtonElement;
  inputModeWorkingTextBtn: HTMLButtonElement;
  ocrInputPanel: HTMLElement;
  workingTextPanel: HTMLElement;
  workingTextRunPanel: HTMLElement;
  actionTabOcrBtn: HTMLButtonElement;
  runModeSummaryBtn: HTMLButtonElement;
  runModeVoiceBtn: HTMLButtonElement;
  summaryRunPanel: HTMLElement;
  voiceRunPanel: HTMLElement;
  workingText: HTMLTextAreaElement;
  summarizeBtn: HTMLButtonElement;
  executeOcrBtn: HTMLButtonElement;
  generateWorkingAudioBtn: HTMLButtonElement;
  outputTabOcrBtn: HTMLButtonElement;
  outputTabSummaryBtn: HTMLButtonElement;
  outputTabVoiceBtn: HTMLButtonElement;
  textResultPanel: HTMLElement;
  audioResultPanel: HTMLElement;
  resultPromoteDefaultBtn: HTMLButtonElement;
  resultPromoteDefaultLabel: HTMLElement;
  audioResultCard: HTMLElement;
  speechInputPreview: HTMLElement;
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
let dom: ReturnType<typeof installDomWithHTML> | null = null;

function cacheElements() {
  elements = {
    inputModeOcrBtn: requiredElement<HTMLButtonElement>('input-mode-ocr-btn'),
    inputModeWorkingTextBtn: requiredElement<HTMLButtonElement>('input-mode-working-text-btn'),
    ocrInputPanel: requiredElement<HTMLElement>('ocr-input-panel'),
    workingTextPanel: requiredElement<HTMLElement>('working-text-panel'),
    workingTextRunPanel: requiredElement<HTMLElement>('working-text-run-panel'),
    actionTabOcrBtn: requiredElement<HTMLButtonElement>('run-ocr-btn'),
    runModeSummaryBtn: requiredElement<HTMLButtonElement>('run-mode-summary-btn'),
    runModeVoiceBtn: requiredElement<HTMLButtonElement>('run-mode-voice-btn'),
    summaryRunPanel: requiredElement<HTMLElement>('summary-run-panel'),
    voiceRunPanel: requiredElement<HTMLElement>('voice-run-panel'),
    workingText: requiredElement<HTMLTextAreaElement>('working-text'),
    summarizeBtn: requiredElement<HTMLButtonElement>('summarize-btn'),
    executeOcrBtn: requiredElement<HTMLButtonElement>('execute-ocr-btn'),
    generateWorkingAudioBtn: requiredElement<HTMLButtonElement>('generate-working-audio-btn'),
    outputTabOcrBtn: requiredElement<HTMLButtonElement>('output-tab-ocr-btn'),
    outputTabSummaryBtn: requiredElement<HTMLButtonElement>('output-tab-summary-btn'),
    outputTabVoiceBtn: requiredElement<HTMLButtonElement>('output-tab-voice-btn'),
    textResultPanel: requiredElement<HTMLElement>('text-result-panel'),
    audioResultPanel: requiredElement<HTMLElement>('audio-result-panel'),
    resultPromoteDefaultBtn: requiredElement<HTMLButtonElement>('result-promote-default-btn'),
    resultPromoteDefaultLabel: requiredElement<HTMLElement>('result-promote-default-label'),
    audioResultCard: requiredElement<HTMLElement>('audio-result-card'),
    speechInputPreview: requiredElement<HTMLElement>('speech-input-preview'),
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
        provider: 'gemini',
        voice: 'Kore',
        model: 'gemini-2.5-flash-preview-tts',
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
  workspace.setInputMode('working-text');
  workspace.setWorkingTextRunMode('summary');
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
  dom = installDomWithHTML('http://localhost:8282/', renderMainWorkspaceFixture());
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
  ocr.initOCR();
  summarizer.initSummarizer();
  tts.initTTS();
});

after(() => {
  teardownPage(dom);
});

beforeEach(async () => {
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
  assert.equal(elements.workingTextRunPanel.hidden, false);
  assert.equal(elements.summaryRunPanel.hidden, false);

  elements.resultPromoteDefaultBtn.click();
  assert.equal(workspace.getWorkspace().workingText, '# Summary\n\nCondensed result');
  assert.equal(workspace.getWorkspace().inputMode, 'working-text');

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

  assert.equal(elements.resultPromoteDefaultLabel.textContent, 'Replace Working Text');
  elements.resultPromoteDefaultBtn.click();
  assert.equal(workspace.getWorkspace().workingText, 'Scanned text');
});

test('working text mode keeps Summary and Voice available while OCR stays visible but unavailable', async () => {
  typeWorkingText('Working draft');
  await flushAsyncWork();

  assert.equal(workspace.getWorkspace().inputMode, 'working-text');
  assert.equal(elements.actionTabOcrBtn.disabled, true);
  assert.equal(elements.runModeSummaryBtn.disabled, false);
  assert.equal(elements.runModeVoiceBtn.disabled, false);
  assert.equal(elements.runModeSummaryBtn.getAttribute('aria-selected'), 'true');

  elements.runModeVoiceBtn.click();
  await flushAsyncWork();

  assert.equal(workspace.getWorkspace().workingTextRunMode, 'voice');
  assert.equal(elements.voiceRunPanel.hidden, false);
  assert.equal(elements.summaryRunPanel.hidden, true);
  assert.equal(elements.runModeVoiceBtn.getAttribute('aria-selected'), 'true');

  elements.inputModeOcrBtn.click();
  await flushAsyncWork();
  elements.inputModeWorkingTextBtn.click();
  await flushAsyncWork();

  assert.equal(workspace.getWorkspace().workingTextRunMode, 'summary');
  assert.equal(elements.runModeSummaryBtn.getAttribute('aria-selected'), 'true');
  assert.equal(elements.summaryRunPanel.hidden, false);
});

test('working text can be cleared from Input even while Voice is the selected action', async () => {
  typeWorkingText('Clear me from input');
  elements.runModeVoiceBtn.click();
  await flushAsyncWork();

  requiredElement<HTMLButtonElement>('clear-workspace-btn').click();
  await flushAsyncWork();

  assert.equal(workspace.getWorkspace().workingText, '');
  assert.equal(elements.workingText.value, '');
  assert.equal(elements.runModeVoiceBtn.getAttribute('aria-selected'), 'true');
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
  assert.equal(elements.resultPromoteDefaultLabel.textContent, 'Replace Working Text');
  assert.equal(elements.outputTabOcrBtn.getAttribute('aria-selected'), 'true');
  assert.equal(elements.textResultPanel.hidden, false);
  assert.equal(elements.audioResultPanel.hidden, true);

  elements.resultPromoteDefaultBtn.click();
  assert.equal(workspace.getWorkspace().workingText, 'Scanned text from OCR');
});

test('summary generation switches Output to Summary and retains the latest OCR result separately', async () => {
  workspace.setLatestTextResult(createOCRTextResult('Scanned text from OCR'));
  typeWorkingText('Working draft for summary');
  await flushAsyncWork();

  elements.summarizeBtn.click();
  await flushAsyncWork();

  assert.equal(workspace.getWorkspace().activeOutputTab, 'summary');
  assert.equal(workspace.getWorkspace().latestSummaryTextResult.rawText, '# Summary\n\nCondensed result');
  assert.equal(workspace.getWorkspace().latestOCRTextResult.rawText, 'Scanned text from OCR');
  assert.equal(elements.outputTabSummaryBtn.getAttribute('aria-selected'), 'true');
  assert.equal(elements.textResultTitle.textContent, 'Summary Result');
  assert.match(elements.textResultContent.innerHTML, /Condensed result/);

  elements.outputTabOcrBtn.click();
  await flushAsyncWork();

  assert.equal(workspace.getWorkspace().activeOutputTab, 'ocr');
  assert.equal(elements.textResultTitle.textContent, 'OCR Result');
  assert.match(elements.textResultContent.textContent ?? '', /Scanned text from OCR/);
});

test('input mode toggle hides the inactive surface without clearing its state', async () => {
  const file = new File(['image-data'], 'scan.png', { type: 'image/png' });
  workspace.setStagedFiles([file]);
  typeWorkingText('Keep this draft');
  await flushAsyncWork();

  assert.equal(elements.ocrInputPanel.hidden, true);
  assert.equal(elements.workingTextPanel.hidden, false);
  assert.equal(elements.workingTextRunPanel.hidden, false);

  elements.inputModeOcrBtn.click();
  await flushAsyncWork();

  assert.equal(workspace.getWorkspace().inputMode, 'ocr');
  assert.equal(elements.ocrInputPanel.hidden, false);
  assert.equal(elements.workingTextPanel.hidden, true);
  assert.equal(elements.workingTextRunPanel.hidden, false);
  assert.equal(elements.actionTabOcrBtn.getAttribute('aria-selected'), 'true');
  assert.equal(workspace.getWorkspace().workingText, 'Keep this draft');
  assert.equal(workspace.getWorkspace().stagedFiles[0]?.name, 'scan.png');

  elements.inputModeWorkingTextBtn.click();
  await flushAsyncWork();

  assert.equal(workspace.getWorkspace().inputMode, 'working-text');
  assert.equal(elements.ocrInputPanel.hidden, true);
  assert.equal(elements.workingTextPanel.hidden, false);
  assert.equal(elements.summaryRunPanel.hidden, false);
  assert.equal(elements.workingText.value, 'Keep this draft');
  assert.equal(workspace.getWorkspace().stagedFiles[0]?.name, 'scan.png');
});

test('working text run mode defaults to summary after OCR and preserves explicit voice selection', async () => {
  elements.runModeVoiceBtn.click();
  await flushAsyncWork();

  assert.equal(workspace.getWorkspace().workingTextRunMode, 'voice');
  assert.equal(elements.summaryRunPanel.hidden, true);
  assert.equal(elements.voiceRunPanel.hidden, false);

  elements.runModeSummaryBtn.click();
  await flushAsyncWork();

  assert.equal(workspace.getWorkspace().workingTextRunMode, 'summary');
  assert.equal(elements.summaryRunPanel.hidden, false);
  assert.equal(elements.voiceRunPanel.hidden, true);

  elements.inputModeOcrBtn.click();
  await flushAsyncWork();
  assert.equal(elements.workingTextRunPanel.hidden, false);
  assert.equal(elements.actionTabOcrBtn.getAttribute('aria-selected'), 'true');
  assert.equal(elements.summaryRunPanel.hidden, true);

  elements.inputModeWorkingTextBtn.click();
  await flushAsyncWork();

  assert.equal(workspace.getWorkspace().workingTextRunMode, 'summary');
  assert.equal(elements.summaryRunPanel.hidden, false);
});

test('voice synthesis keeps audio output on the voice surface without exposing text promotion actions', async () => {
  typeWorkingText('Audio snapshot should stay stable');
  elements.runModeVoiceBtn.click();
  await flushAsyncWork();

  assert.equal(elements.voiceRunPanel.hidden, false);
  assert.match(elements.speechInputPreview.textContent ?? '', /Audio snapshot should stay stable/);

  workspace.setLastAudioResult(
    new Blob(['opus-audio'], { type: 'audio/opus' }),
    'Audio snapshot should stay stable',
    'Working Text',
    { provider: 'gemini', voice: 'Kore', model: 'gemini-2.5-flash-preview-tts' },
  );
  workspace.setActiveOutputTab('voice');
  await flushAsyncWork();

  assert.equal(workspace.getWorkspace().activeOutputTab, 'voice');
  assert.equal(elements.resultPromoteDefaultBtn.disabled, true);
  assert.equal(elements.outputTabVoiceBtn.getAttribute('aria-selected'), 'true');
  assert.match(elements.audioResultCard.textContent ?? '', /Audio snapshot should stay stable/);

  workspace.setActiveOutputTab('summary');
  await flushAsyncWork();

  assert.equal(elements.outputTabSummaryBtn.getAttribute('aria-selected'), 'true');
});

test('promoting an OCR result switches the workspace into working text mode', async () => {
  workspace.setInputMode('ocr');
  workspace.setLatestTextResult(createOCRTextResult('Scanned text from OCR'));
  await flushAsyncWork();

  elements.resultPromoteDefaultBtn.click();

  assert.equal(workspace.getWorkspace().inputMode, 'working-text');
  assert.equal(workspace.getWorkspace().workingText, 'Scanned text from OCR');
  assert.equal(elements.workingTextPanel.hidden, false);
});
