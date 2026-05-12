import {
  clearWorkspaceBtn,
  resultAppendBtn,
  resultCopyBtn,
  resultCopyLabel,
  resultDownloadBtn,
  resultDownloadGroup,
  resultDownloadMenu,
  resultDownloadToggle,
  resultPromoteDefaultBtn,
  resultPromoteDefaultLabel,
  resultReplaceBtn,
  resultSpeakBtn,
  summarizeBtn,
  textResultContent,
  textResultKindChip,
  textResultTitle,
  workingText,
} from './dom.js';
import { addFeed, setStatus, updateFeedItem } from './feed.js';
import { buildDownloadFilename } from './filename.js';
import { downloadBlob } from './download.js';
import { renderMarkdown } from './markdown.js';
import { updateTextMetrics } from './metrics.js';
import {
  applyAppearanceConfig,
  clearLatestTextResult,
  getDefaultPromotionBehavior,
  getSelectedSummarizerModel,
  getSelectedSummarizerProvider,
  getWorkspace,
  promoteLatestTextResult,
  setGroqRateLimits,
  setLatestTextResult,
  setProcessing,
  setWorkingText,
  subscribeWorkspace,
} from './workspace.js';
import { escHtml, truncate } from './text.js';

let synthesizeFromResult = async () => {};
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

function renderPlainText(text) {
  if (!text.trim()) return '';
  return text
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function syncWorkspaceControls() {
  const { processing, workingText: currentWorkingText, latestTextResult } = getWorkspace();
  const hasWorkingText = currentWorkingText.trim().length > 0;
  const hasResult = latestTextResult.rawText.trim().length > 0;
  const defaultPromotionBehavior = getDefaultPromotionBehavior(latestTextResult.kind);

  if (workingText.value !== currentWorkingText) {
    workingText.value = currentWorkingText;
  }

  workingText.disabled = processing;
  clearWorkspaceBtn.disabled = processing || !hasWorkingText;
  summarizeBtn.disabled = processing || !hasWorkingText;

  if (latestTextResult.kind === 'summary') {
    textResultContent.innerHTML = renderMarkdown(latestTextResult.rawText);
  } else {
    textResultContent.innerHTML = renderPlainText(latestTextResult.rawText);
  }

  textResultKindChip.textContent = latestTextResult.kind
    ? `${latestTextResult.kind === 'summary' ? 'Summary' : 'OCR'} result`
    : 'No result yet';
  textResultTitle.textContent = latestTextResult.title || 'Transform result';

  const defaultLabel = defaultPromotionBehavior === 'replace'
    ? 'Replace Working Text'
    : 'Append to Working Text';
  resultPromoteDefaultLabel.textContent = defaultLabel;

  resultPromoteDefaultBtn.disabled = processing || !hasResult;
  resultAppendBtn.disabled = processing || !hasResult;
  resultReplaceBtn.disabled = processing || !hasResult;
  resultCopyBtn.disabled = processing || !hasResult;
  resultDownloadBtn.disabled = processing || !hasResult;
  resultDownloadToggle.disabled = processing || !hasResult;
  resultSpeakBtn.disabled = processing || !latestTextResult.plainText.trim();

  if (resultDownloadBtn.disabled) {
    closeResultDownloadMenu();
  }

  updateTextMetrics();
}

function downloadResultFile(content, ext, mimeType) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  downloadBlob(blob, buildDownloadFilename(content, ext));
}

function downloadResultByFormat(format) {
  const { latestTextResult } = getWorkspace();
  if (!latestTextResult.rawText.trim()) return;

  if (format === 'md') {
    const markdown = latestTextResult.format === 'markdown'
      ? latestTextResult.rawText
      : latestTextResult.plainText || latestTextResult.rawText;
    if (!markdown.trim()) return;
    downloadResultFile(markdown, 'md', 'text/markdown');
    return;
  }

  const plainText = latestTextResult.plainText || latestTextResult.rawText;
  if (!plainText.trim()) return;
  downloadResultFile(plainText, 'txt', 'text/plain');
}

function applySummaryDownloadFormat(format) {
  summaryDownloadFormat = VALID_SUMMARY_DOWNLOAD_FORMATS.has(format) ? format : 'md';
}

function openResultDownloadMenu() {
  resultDownloadMenu.hidden = false;
  resultDownloadGroup.classList.add('is-open');
  resultDownloadToggle.setAttribute('aria-expanded', 'true');
}

function closeResultDownloadMenu() {
  resultDownloadMenu.hidden = true;
  resultDownloadGroup.classList.remove('is-open');
  resultDownloadToggle.setAttribute('aria-expanded', 'false');
}

function toggleResultDownloadMenu() {
  if (resultDownloadMenu.hidden) {
    openResultDownloadMenu();
    return;
  }
  closeResultDownloadMenu();
}

function announcePromotion(mode) {
  const kind = getWorkspace().latestTextResult.kind || 'result';
  const action = mode === 'replace' ? 'replaced' : 'appended to';
  setStatus(`${kind === 'summary' ? 'Summary' : 'OCR result'} ${action} working text.`, 'success');
}

export async function summarizeText(text) {
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
    setLatestTextResult({
      kind: 'summary',
      title: 'Summary Result',
      format: 'markdown',
      rawText: summary || '',
      plainText: rendered.innerText.trim(),
    });

    const duration = ((performance.now() - startTime) / 1000).toFixed(1);
    const modelTag = model ? ` · ${model}` : (resolvedProvider ? ` · ${resolvedProvider}` : '');
    setStatus('Summary result ready for review.', 'success');
    updateFeedItem(
      feedItem,
      'ok',
      `"${truncate(text, 60)}"`,
      `${wordCount} words → summary · ${duration}s${modelTag}`,
    );
  } catch (error) {
    setStatus(error.message, 'error');
    updateFeedItem(feedItem, 'fail', `"${truncate(text, 60)}"`, error.message);
  } finally {
    setProcessing(false);
  }
}

export function initSummarizer({ synthesizeText }) {
  synthesizeFromResult = synthesizeText;
  applySummaryDownloadFormat(window.IntiTheme?.summaryDownloadFormat);
  applyAppearanceConfig(window.IntiTheme || {});

  subscribeWorkspace(syncWorkspaceControls);

  document.addEventListener('inti:theme-config', (event) => {
    applyAppearanceConfig(event.detail || {});
    applySummaryDownloadFormat(event.detail?.summaryDownloadFormat);
  });

  clearWorkspaceBtn?.addEventListener('click', () => {
    setWorkingText('');
    setStatus('Working text cleared.', 'success');
    updateTextMetrics();
  });

  workingText.addEventListener('input', () => {
    setWorkingText(workingText.value);
  });

  summarizeBtn.addEventListener('click', async () => {
    const { processing, workingText: currentWorkingText } = getWorkspace();
    const text = currentWorkingText.trim();
    if (!text || processing) return;
    await summarizeText(text);
  });

  resultPromoteDefaultBtn.addEventListener('click', () => {
    const behavior = getDefaultPromotionBehavior(getWorkspace().latestTextResult.kind);
    if (promoteLatestTextResult(behavior)) announcePromotion(behavior);
  });

  resultAppendBtn.addEventListener('click', () => {
    if (promoteLatestTextResult('append')) announcePromotion('append');
  });

  resultReplaceBtn.addEventListener('click', () => {
    if (promoteLatestTextResult('replace')) announcePromotion('replace');
  });

  resultCopyBtn.addEventListener('click', async () => {
    const text = getWorkspace().latestTextResult.plainText || getWorkspace().latestTextResult.rawText;
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
    } catch {}

    resultCopyLabel.textContent = 'Copied!';
    setTimeout(() => {
      resultCopyLabel.textContent = 'Copy';
    }, 1500);
  });

  resultDownloadBtn.addEventListener('click', () => {
    if (getWorkspace().processing) return;
    downloadResultByFormat(summaryDownloadFormat);
  });

  resultDownloadToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    if (resultDownloadToggle.disabled) return;
    toggleResultDownloadMenu();
  });

  resultDownloadMenu.addEventListener('click', (event) => {
    const item = event.target.closest('.split-menu-item');
    if (!item) return;

    const format = item.dataset.format;
    if (!format) return;

    summaryDownloadFormat = format;
    closeResultDownloadMenu();
    downloadResultByFormat(format);
  });

  resultDownloadGroup.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeResultDownloadMenu();
      resultDownloadToggle.focus();
    }
  });

  resultSpeakBtn.addEventListener('click', async () => {
    const { processing, latestTextResult } = getWorkspace();
    const text = latestTextResult.plainText.trim();
    if (!text || processing) return;
    await synthesizeFromResult(text, { sourceLabel: latestTextResult.title || 'Latest Text Result' });
  });

  document.addEventListener('click', (event) => {
    if (!resultDownloadGroup.contains(event.target)) {
      closeResultDownloadMenu();
    }
  });

  syncWorkspaceControls();
}

export function resetLatestTextResult() {
  clearLatestTextResult();
  closeResultDownloadMenu();
  updateTextMetrics();
  syncWorkspaceControls();
}
