import {
  clearWorkspaceBtn,
  summaryCopyBtn,
  summaryCopyLabel,
  summaryDownloadBtn,
  summaryDownloadGroup,
  summaryDownloadMenu,
  summaryDownloadToggle,
  summaryResult,
  summarySpeakBtn,
  summaryText,
  summarizeBtn,
  summarizeSpeakBtn,
  workspaceText,
} from './dom.js';
import { addFeed, setStatus, updateFeedItem } from './feed.js';
import { buildDownloadFilename } from './filename.js';
import { renderMarkdown } from './markdown.js';
import { updateTextMetrics } from './metrics.js';
import { downloadBlob } from './download.js';
import {
  clearLastAudioBlob,
  clearSummaryResult,
  getWorkspace,
  getSelectedSummarizerModel,
  getSelectedSummarizerProvider,
  setGroqRateLimits,
  setProcessing,
  setSummaryResult,
  setTextToSpeechText,
  setWorkspaceText,
  subscribeWorkspace,
} from './workspace.js';
import { truncate } from './text.js';

let summarizeToSpeech = async () => {};
let summaryDownloadFormat = 'md';
const VALID_SUMMARY_DOWNLOAD_FORMATS = new Set(['txt', 'md']);

function parseGroqDuration(value) {
  if (!value) return 0;

  let milliseconds = 0;
  const hours = value.match(/(\d+(?:\.\d+)?)h/);
  const minutes = value.match(/(\d+(?:\.\d+)?)m(?!s)/);
  const seconds = value.match(/(\d+(?:\.\d+)?)s/);

  if (hours) milliseconds += parseFloat(hours[1]) * 3600000;
  if (minutes) milliseconds += parseFloat(minutes[1]) * 60000;
  if (seconds) milliseconds += parseFloat(seconds[1]) * 1000;

  return milliseconds;
}

function syncSummaryActionState() {
  const { processing, summaryPlainText, summaryMarkdown, workspaceText: currentWorkspaceText } = getWorkspace();
  const hasPlainText = summaryPlainText.trim().length > 0;
  const hasMarkdown = summaryMarkdown.trim().length > 0;

  if (workspaceText.value !== currentWorkspaceText) {
    workspaceText.value = currentWorkspaceText;
  }
  if ((summaryDownloadGroup.dataset.summary || '') !== summaryMarkdown) {
    summaryDownloadGroup.dataset.summary = summaryMarkdown;
  }
  if (summaryMarkdown) {
    summaryResult.hidden = false;
    summaryText.innerHTML = renderMarkdown(summaryMarkdown);
  } else {
    summaryResult.hidden = false;
    summaryText.innerHTML = '';
  }

  if (clearWorkspaceBtn) clearWorkspaceBtn.disabled = processing || !currentWorkspaceText.trim();
  summarizeBtn.disabled = processing || !currentWorkspaceText.trim();
  summarizeSpeakBtn.disabled = processing || !currentWorkspaceText.trim();
  summaryCopyBtn.disabled = processing || !hasPlainText;
  summarySpeakBtn.disabled = processing || !hasPlainText;
  summaryDownloadBtn.disabled = processing || !hasPlainText;
  summaryDownloadToggle.disabled = processing || (!hasPlainText && !hasMarkdown);

  if (summaryDownloadBtn.disabled) {
    closeSummaryDownloadMenu();
  }
}

function downloadSummaryFile(content, ext, mimeType) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const sourceText = summaryDownloadGroup.dataset.summary || summaryText.innerText.trim();
  downloadBlob(blob, buildDownloadFilename(sourceText, ext));
}

function downloadSummaryByFormat(format) {
  if (format === 'md') {
    const markdown = summaryDownloadGroup.dataset.summary || '';
    if (!markdown.trim()) return;
    downloadSummaryFile(markdown, 'md', 'text/markdown');
    return;
  }

  const plainText = summaryText.innerText.trim();
  if (!plainText) return;
  downloadSummaryFile(plainText, 'txt', 'text/plain');
}

function applySummaryDownloadFormat(format) {
  summaryDownloadFormat = VALID_SUMMARY_DOWNLOAD_FORMATS.has(format) ? format : 'md';
}

function openSummaryDownloadMenu() {
  summaryDownloadMenu.hidden = false;
  summaryDownloadGroup.classList.add('is-open');
  summaryDownloadToggle.setAttribute('aria-expanded', 'true');
}

function closeSummaryDownloadMenu() {
  summaryDownloadMenu.hidden = true;
  summaryDownloadGroup.classList.remove('is-open');
  summaryDownloadToggle.setAttribute('aria-expanded', 'false');
}

function toggleSummaryDownloadMenu() {
  if (summaryDownloadMenu.hidden) {
    openSummaryDownloadMenu();
    return;
  }

  closeSummaryDownloadMenu();
}

export function resetSummaryResult() {
  clearSummaryResult();
  closeSummaryDownloadMenu();
  updateTextMetrics();
  syncSummaryActionState();
}

export async function summarizeText(text, shouldSpeak) {
  setProcessing(true);
  setStatus('Summarizing…');

  const startTime = performance.now();
  const wordCount = text.trim().split(/\s+/).length;
  const feedItem = addFeed('info', `"${truncate(text, 60)}"`, 'summarizing…');

  try {
    const provider = getSelectedSummarizerProvider();
    const response = await fetch(window.apiURL('/api/summarize'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        instruction: '',
        provider,
        model: getSelectedSummarizerModel(),
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(body.error || response.statusText);
    }

    const { model, provider: resolvedProvider, rateLimits, summary } = await response.json();
    if (rateLimits && resolvedProvider === 'groq') {
      setGroqRateLimits({
        ...rateLimits,
        capturedAt: Date.now(),
        resetRequestsAt: Date.now() + parseGroqDuration(rateLimits.resetRequests),
        resetTokensAt: Date.now() + parseGroqDuration(rateLimits.resetTokens),
      });
    }

    const rendered = document.createElement('div');
    rendered.innerHTML = renderMarkdown(summary || '');
    setSummaryResult(summary || '', rendered.innerText.trim());
    updateTextMetrics();
    syncSummaryActionState();

    const duration = ((performance.now() - startTime) / 1000).toFixed(1);
    const modelTag = model ? ` · ${model}` : (resolvedProvider ? ` · ${resolvedProvider}` : '');
    setStatus('');
    updateFeedItem(
      feedItem,
      'ok',
      `"${truncate(text, 60)}"`,
      `${wordCount} words → summary · ${duration}s${modelTag}`,
    );

    if (shouldSpeak) {
      setTextToSpeechText(summary);
      updateTextMetrics();
      await summarizeToSpeech(summary);
    }
  } catch (error) {
    setStatus(error.message, 'error');
    updateFeedItem(feedItem, 'fail', `"${truncate(text, 60)}"`, error.message);
  } finally {
    setProcessing(false);
  }
}

export function initSummarizer({ synthesizeText }) {
  summarizeToSpeech = synthesizeText;
  applySummaryDownloadFormat(window.IntiTheme?.summaryDownloadFormat);

  subscribeWorkspace(syncSummaryActionState);

  document.addEventListener('inti:theme-config', (event) => {
    applySummaryDownloadFormat(event.detail?.summaryDownloadFormat);
  });

  clearWorkspaceBtn?.addEventListener('click', () => {
    setWorkspaceText('');
    resetSummaryResult();
    updateTextMetrics();
  });

  workspaceText.addEventListener('input', () => {
    setWorkspaceText(workspaceText.value);
    resetSummaryResult();
    updateTextMetrics();
    syncSummaryActionState();
  });

  summarizeBtn.addEventListener('click', async () => {
    const { processing, workspaceText: currentWorkspaceText } = getWorkspace();
    const text = currentWorkspaceText.trim();
    if (!text || processing) return;
    await summarizeText(text, false);
  });

  summarizeSpeakBtn.addEventListener('click', async () => {
    const { processing, workspaceText: currentWorkspaceText } = getWorkspace();
    const text = currentWorkspaceText.trim();
    if (!text || processing) return;
    await summarizeText(text, true);
  });

  summaryCopyBtn.addEventListener('click', async () => {
    const text = getWorkspace().summaryPlainText;
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
    } catch {}

    summaryCopyLabel.textContent = 'Copied!';
    setTimeout(() => {
      summaryCopyLabel.textContent = 'Copy';
    }, 1500);
  });

  summaryDownloadBtn.addEventListener('click', () => {
    if (getWorkspace().processing) return;
    downloadSummaryByFormat(summaryDownloadFormat);
  });

  summaryDownloadToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    if (summaryDownloadToggle.disabled) return;
    toggleSummaryDownloadMenu();
  });

  summaryDownloadMenu.addEventListener('click', (event) => {
    const item = event.target.closest('.split-menu-item');
    if (!item) return;

    const format = item.dataset.format;
    if (!format) return;

    summaryDownloadFormat = format;
    closeSummaryDownloadMenu();
    downloadSummaryByFormat(format);
  });

  summaryDownloadGroup.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeSummaryDownloadMenu();
      summaryDownloadToggle.focus();
    }
  });

  summarySpeakBtn.addEventListener('click', () => {
    const { processing, summaryPlainText } = getWorkspace();
    const text = summaryPlainText.trim();
    if (!text || processing) return;

    setTextToSpeechText(text);
    clearLastAudioBlob();
    updateTextMetrics();
    setStatus('Summary copied to Text to Speech.', 'success');
  });

  document.addEventListener('click', (event) => {
    if (!summaryDownloadGroup.contains(event.target)) {
      closeSummaryDownloadMenu();
    }
  });

  syncSummaryActionState();
}
