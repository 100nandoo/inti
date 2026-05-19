import {
  clearWorkspaceBtn,
  resultCopyBtn,
  resultCopyLabel,
  resultDownloadBtn,
  resultDownloadGroup,
  resultDownloadMenu,
  resultDownloadToggle,
  resultPromoteDefaultBtn,
  resultPromoteDefaultLabel,
  runModeSummaryBtn,
  runModeVoiceBtn,
  summaryRunPanel,
  summarizeBtn,
  textResultContent,
  textResultKindChip,
  textResultTitle,
  workingText,
  workingTextRunPanel,
} from './dom.js';
import { addFeed, setStatus, updateFeedItem } from './feed.js';
import { updateTextMetrics } from './metrics.js';
import {
  applyAppearanceConfig,
  clearLatestTextResult,
  getSelectedSummarizerModel,
  getSelectedSummarizerProvider,
  getWorkspace,
  promoteLatestTextResult,
  setInputMode,
  setGroqRateLimits,
  setLatestTextResult,
  setProcessing,
  setWorkingTextRunMode,
  setWorkingText,
  subscribeWorkspace,
} from './workspace.js';
import { truncate } from './text.js';
import {
  buildResultSurfaceViewModel,
  copyLatestResultText,
  downloadLatestResult,
} from '../../web-src/src/lib/result-surface.js';
import { executeSummaryRequest } from '../../web-src/src/lib/summary-flow.js';

let summaryDownloadFormat = 'md';
const VALID_SUMMARY_DOWNLOAD_FORMATS = new Set(['txt', 'md']);

function syncWorkspaceControls() {
  const {
    inputMode,
    processing,
    workingText: currentWorkingText,
    workingTextRunMode,
    latestTextResult,
  } = getWorkspace();
  const hasWorkingText = currentWorkingText.trim().length > 0;
  const isWorkingTextMode = inputMode === 'working-text';
  const isSummaryMode = isWorkingTextMode && workingTextRunMode === 'summary';
  const viewModel = buildResultSurfaceViewModel(
    getWorkspace(),
    'replace',
  );

  if (workingText.value !== currentWorkingText) {
    workingText.value = currentWorkingText;
  }

  workingText.disabled = processing;
  workingTextRunPanel.hidden = !isWorkingTextMode;
  summaryRunPanel.hidden = !isSummaryMode;
  clearWorkspaceBtn.disabled = processing || !hasWorkingText || !isSummaryMode;
  summarizeBtn.disabled = processing || !hasWorkingText || !isSummaryMode;
  runModeSummaryBtn.setAttribute('aria-selected', String(isSummaryMode));
  runModeVoiceBtn.setAttribute('aria-selected', String(isWorkingTextMode && workingTextRunMode === 'voice'));
  runModeSummaryBtn.classList.toggle('is-active', isSummaryMode);
  runModeVoiceBtn.classList.toggle('is-active', isWorkingTextMode && workingTextRunMode === 'voice');

  textResultContent.innerHTML = viewModel.contentHtml;
  textResultKindChip.textContent = viewModel.kindChip;
  textResultTitle.textContent = viewModel.title;
  resultPromoteDefaultLabel.textContent = viewModel.defaultPromotionLabel;

  resultPromoteDefaultBtn.disabled = processing || !viewModel.hasResult;
  resultCopyBtn.disabled = processing || !viewModel.hasResult;
  resultDownloadBtn.disabled = processing || !viewModel.hasResult;
  resultDownloadToggle.disabled = processing || !viewModel.hasResult;

  if (resultDownloadBtn.disabled) {
    closeResultDownloadMenu();
  }

  updateTextMetrics();
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

function announcePromotion() {
  const kind = getWorkspace().latestTextResult.kind || 'result';
  setStatus(`${kind === 'summary' ? 'Summary' : 'OCR result'} replaced working text.`, 'success');
}

export async function summarizeText(text) {
  setProcessing(true);
  setStatus('Summarizing…');

  const startTime = performance.now();
  const wordCount = text.trim().split(/\s+/).length;
  const feedItem = addFeed('info', `"${truncate(text, 60)}"`, 'summarizing…');

  try {
    const provider = getSelectedSummarizerProvider();
    const { model, provider: resolvedProvider, rateLimits, summaryResult } = await executeSummaryRequest({
      apiURL: window.apiURL,
      text,
      provider,
      model: getSelectedSummarizerModel(),
    });
    if (rateLimits) setGroqRateLimits(rateLimits);
    setLatestTextResult(summaryResult);

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

export function initSummarizer() {
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

  runModeSummaryBtn?.addEventListener('click', () => {
    setWorkingTextRunMode('summary');
  });

  runModeVoiceBtn?.addEventListener('click', () => {
    setWorkingTextRunMode('voice');
  });

  summarizeBtn.addEventListener('click', async () => {
    const { processing, inputMode, workingTextRunMode, workingText: currentWorkingText } = getWorkspace();
    if (inputMode !== 'working-text' || workingTextRunMode !== 'summary') return;
    const text = currentWorkingText.trim();
    if (!text || processing) return;
    await summarizeText(text);
  });

  resultPromoteDefaultBtn.addEventListener('click', () => {
    if (!promoteLatestTextResult('replace')) return;
    setInputMode('working-text');
    announcePromotion();
  });

  resultCopyBtn.addEventListener('click', async () => {
    const copied = await copyLatestResultText(getWorkspace().latestTextResult);
    if (!copied) return;
    resultCopyLabel.textContent = 'Copied!';
    setTimeout(() => {
      resultCopyLabel.textContent = 'Copy';
    }, 1500);
  });

  resultDownloadBtn.addEventListener('click', () => {
    if (getWorkspace().processing) return;
    downloadLatestResult(getWorkspace().latestTextResult, summaryDownloadFormat);
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
    downloadLatestResult(getWorkspace().latestTextResult, format);
  });

  resultDownloadGroup.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeResultDownloadMenu();
      resultDownloadToggle.focus();
    }
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
