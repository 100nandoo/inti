import {
  actionTabOcrBtn,
  audioResultPanel,
  clearWorkspaceBtn,
  outputTabOcrBtn,
  outputTabSummaryBtn,
  outputTabVoiceBtn,
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
  textResultPanel,
  textResultTitle,
  voiceRunPanel,
  workingText,
  workingTextRunPanel,
} from './dom.js';
import { addFeed, setStatus, updateFeedItem } from './feed.js';
import { updateTextMetrics } from './metrics.js';
import {
  applyAppearanceConfig,
  clearLatestTextResult,
  getActiveTextResult,
  getSelectedSummarizerModel,
  getSelectedSummarizerProvider,
  getWorkspace,
  promoteLatestTextResult,
  setActiveOutputTab,
  setInputMode,
  setGroqRateLimits,
  setLatestTextResult,
  setProcessing,
  setWorkingTextRunMode,
  setWorkingText,
  subscribeWorkspace,
} from './workspace.js';
import { buildMainWorkspaceViewModel } from '../../web-src/src/lib/main-workspace-flow.js';
import {
  copyLatestResultText,
  downloadLatestResult,
} from '../../web-src/src/lib/result-surface.js';
import { executeMainWorkspaceSummary } from '../../web-src/src/lib/main-workspace-summary-service.js';

let summaryDownloadFormat = 'md';
const VALID_SUMMARY_DOWNLOAD_FORMATS = new Set(['txt', 'md']);

function syncWorkspaceControls() {
  const workspace = getWorkspace();
  const {
    processing,
    workingText: currentWorkingText,
  } = workspace;
  const mainWorkspaceViewModel = buildMainWorkspaceViewModel(workspace);
  const {
    isSummaryMode,
    isVoiceMode,
    hasWorkingText,
    actionTabs,
    resultViewModel,
  } = mainWorkspaceViewModel;

  if (workingText.value !== currentWorkingText) {
    workingText.value = currentWorkingText;
  }

  workingText.disabled = processing;
  workingTextRunPanel.hidden = false;
  summaryRunPanel.hidden = !isSummaryMode;
  voiceRunPanel.hidden = !isVoiceMode;
  clearWorkspaceBtn.disabled = processing || !hasWorkingText;
  summarizeBtn.disabled = processing || !hasWorkingText || !isSummaryMode;
  actionTabOcrBtn.disabled = actionTabs.ocr.disabled;
  runModeSummaryBtn.disabled = actionTabs.summary.disabled;
  runModeVoiceBtn.disabled = actionTabs.voice.disabled;
  actionTabOcrBtn.setAttribute('aria-selected', String(actionTabs.ocr.active));
  runModeSummaryBtn.setAttribute('aria-selected', String(actionTabs.summary.active));
  runModeVoiceBtn.setAttribute('aria-selected', String(actionTabs.voice.active));
  actionTabOcrBtn.classList.toggle('is-active', actionTabs.ocr.active);
  runModeSummaryBtn.classList.toggle('is-active', actionTabs.summary.active);
  runModeVoiceBtn.classList.toggle('is-active', actionTabs.voice.active);

  outputTabOcrBtn.setAttribute('aria-selected', String(resultViewModel.activeTab === 'ocr'));
  outputTabSummaryBtn.setAttribute('aria-selected', String(resultViewModel.activeTab === 'summary'));
  outputTabVoiceBtn.setAttribute('aria-selected', String(resultViewModel.activeTab === 'voice'));
  outputTabOcrBtn.classList.toggle('is-active', resultViewModel.activeTab === 'ocr');
  outputTabSummaryBtn.classList.toggle('is-active', resultViewModel.activeTab === 'summary');
  outputTabVoiceBtn.classList.toggle('is-active', resultViewModel.activeTab === 'voice');

  textResultPanel.hidden = resultViewModel.isVoiceTab;
  audioResultPanel.hidden = !resultViewModel.isVoiceTab;
  textResultContent.innerHTML = resultViewModel.contentHtml;
  textResultKindChip.textContent = resultViewModel.kindChip;
  textResultTitle.textContent = resultViewModel.title;
  resultPromoteDefaultLabel.textContent = resultViewModel.defaultPromotionLabel;

  resultPromoteDefaultBtn.disabled = processing || !resultViewModel.hasTextResult;
  resultCopyBtn.disabled = processing || !resultViewModel.hasTextResult;
  resultDownloadBtn.disabled = processing || !resultViewModel.hasTextResult;
  resultDownloadToggle.disabled = processing || !resultViewModel.hasTextResult;

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
  resultDownloadGroup.classList.add('dropdown-open');
  resultDownloadGroup.classList.add('is-open');
  resultDownloadToggle.setAttribute('aria-expanded', 'true');
}

function closeResultDownloadMenu() {
  resultDownloadMenu.hidden = true;
  resultDownloadGroup.classList.remove('dropdown-open');
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
  const kind = getActiveTextResult().kind || 'result';
  setStatus(`${kind === 'summary' ? 'Summary' : 'OCR result'} replaced working text.`, 'success');
}

export async function summarizeText(text) {
  setProcessing(true);
  setStatus('Summarizing…');

  const feedItem = addFeed('info', 'Working Text', 'summarizing…');

  try {
    const { rateLimits, summaryResult, feedLabel, feedMeta } = await executeMainWorkspaceSummary({
      apiURL: window.apiURL,
      text,
      provider: getSelectedSummarizerProvider(),
      model: getSelectedSummarizerModel(),
    });
    if (rateLimits) setGroqRateLimits(rateLimits);
    setLatestTextResult(summaryResult);

    setStatus('Summary result ready for review.', 'success');
    updateFeedItem(feedItem, 'ok', feedLabel, feedMeta);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    setStatus(message, 'error');
    updateFeedItem(feedItem, 'fail', 'Working Text', message);
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

  actionTabOcrBtn?.addEventListener('click', () => {
    if (actionTabOcrBtn.disabled) return;
    setInputMode('ocr');
  });

  summarizeBtn.addEventListener('click', async () => {
    const { processing, inputMode, workingTextRunMode, workingText: currentWorkingText } = getWorkspace();
    if (inputMode !== 'working-text' || workingTextRunMode !== 'summary') return;
    const text = currentWorkingText.trim();
    if (!text || processing) return;
    await summarizeText(text);
  });

  outputTabOcrBtn?.addEventListener('click', () => {
    setActiveOutputTab('ocr');
  });

  outputTabSummaryBtn?.addEventListener('click', () => {
    setActiveOutputTab('summary');
  });

  outputTabVoiceBtn?.addEventListener('click', () => {
    setActiveOutputTab('voice');
  });

  resultPromoteDefaultBtn.addEventListener('click', () => {
    if (!promoteLatestTextResult('replace')) return;
    setInputMode('working-text');
    announcePromotion();
  });

  resultCopyBtn.addEventListener('click', async () => {
    const copied = await copyLatestResultText(getActiveTextResult());
    if (!copied) return;
    resultCopyLabel.textContent = 'Copied!';
    setTimeout(() => {
      resultCopyLabel.textContent = 'Copy';
    }, 1500);
  });

  resultDownloadBtn.addEventListener('click', () => {
    if (getWorkspace().processing) return;
    downloadLatestResult(getActiveTextResult(), summaryDownloadFormat);
  });

  resultDownloadToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    if (resultDownloadToggle.disabled) return;
    toggleResultDownloadMenu();
  });

  resultDownloadMenu.addEventListener('click', (event) => {
    const item = event.target.closest('[data-format]');
    if (!item) return;

    const format = item.dataset.format;
    if (!format) return;

    summaryDownloadFormat = format;
    closeResultDownloadMenu();
    downloadLatestResult(getActiveTextResult(), format);
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
