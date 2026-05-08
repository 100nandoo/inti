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
  textInput,
  workspaceText,
} from './dom.js';
import { addFeed, setStatus, updateFeedItem } from './feed.js';
import { buildDownloadFilename } from './filename.js';
import { renderMarkdown } from './markdown.js';
import { updateTextMetrics } from './metrics.js';
import { downloadBlob } from './download.js';
import {
  getState,
  setGroqRateLimits,
  setProcessing,
  subscribeState,
} from './state.js';
import { truncate } from './text.js';
import { getSelectedSummarizerModel, getSelectedSummarizerProvider } from './providers.js';

let summarizeToSpeech = async () => {};
let clearGeneratedAudio = () => {};
let summaryDownloadFormat = 'txt';

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
  const { processing } = getState();
  const hasPlainText = summaryText.innerText.trim().length > 0;
  const hasMarkdown = (summaryDownloadGroup.dataset.summary || '').trim().length > 0;

  if (clearWorkspaceBtn) clearWorkspaceBtn.disabled = processing || !workspaceText.value.trim();
  summarizeBtn.disabled = processing || !workspaceText.value.trim();
  summarizeSpeakBtn.disabled = processing || !workspaceText.value.trim();
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
  downloadBlob(blob, buildDownloadFilename(sourceText, ext, 'inti-summary'));
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
  summaryResult.hidden = false;
  summaryText.innerHTML = '';
  summaryDownloadGroup.dataset.summary = '';
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

    summaryText.innerHTML = renderMarkdown(summary || '');
    summaryDownloadGroup.dataset.summary = summary || '';
    summaryResult.hidden = false;
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
      textInput.value = summary;
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

export function initSummarizer({ synthesizeText, clearGeneratedAudio: clearAudio }) {
  summarizeToSpeech = synthesizeText;
  clearGeneratedAudio = clearAudio;

  subscribeState(syncSummaryActionState);

  clearWorkspaceBtn?.addEventListener('click', () => {
    workspaceText.value = '';
    resetSummaryResult();
    updateTextMetrics();
  });

  workspaceText.addEventListener('input', () => {
    resetSummaryResult();
    updateTextMetrics();
    syncSummaryActionState();
  });

  summarizeBtn.addEventListener('click', async () => {
    const text = workspaceText.value.trim();
    if (!text || getState().processing) return;
    await summarizeText(text, false);
  });

  summarizeSpeakBtn.addEventListener('click', async () => {
    const text = workspaceText.value.trim();
    if (!text || getState().processing) return;
    await summarizeText(text, true);
  });

  summaryCopyBtn.addEventListener('click', async () => {
    const text = summaryText.innerText;
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
    if (getState().processing) return;
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
    const text = summaryText.innerText.trim();
    if (!text || getState().processing) return;

    textInput.value = text;
    clearGeneratedAudio();
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
