import { downloadTextExport } from './export-service.js';
import { renderMarkdown } from './markdown.js';
import { escHtml } from './text.js';

/**
 * @typedef {import('./workspace-contracts').ClipboardWriter} ClipboardWriter
 * @typedef {import('./workspace-contracts').ResultSurfaceViewModel} ResultSurfaceViewModel
 * @typedef {import('./workspace-contracts').ResultSurfaceWorkspace} ResultSurfaceWorkspace
 * @typedef {import('./workspace-contracts').TextResult} TextResult
 */

function renderPlainText(text) {
  if (!text.trim()) return '';
  return text
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function createEmptyView() {
  return {
    kindChip: 'No result yet',
    title: 'Transform result',
    contentHtml: '<p>Run OCR, Summary, or Voice to keep the latest result here.</p>',
    hasTextResult: false,
    hasSpeakableText: false,
    textCharacterCount: 0,
  };
}

/**
 * @param {TextResult} latestTextResult
 * @returns {string}
 */
function getSpeakableResultText(latestTextResult) {
  return latestTextResult.plainText || latestTextResult.rawText;
}

/**
 * @param {ResultSurfaceWorkspace} workspace
 * @returns {ResultSurfaceViewModel}
 */
export function buildResultSurfaceViewModel(workspace) {
  const activeTab = workspace.activeOutputTab || 'summary';
  const activeTabLabel = activeTab === 'ocr' ? 'OCR' : activeTab === 'voice' ? 'Voice' : 'Summary';
  const hasAudioResult = Boolean(workspace.lastAudioBlob);
  const latestTextResult = activeTab === 'ocr'
    ? workspace.latestOCRTextResult
    : activeTab === 'summary'
      ? workspace.latestSummaryTextResult
      : workspace.latestTextResult;
  const baseView = createEmptyView();

  if (activeTab === 'voice') {
    return {
      activeTab,
      activeTabLabel,
      hasResult: hasAudioResult,
      hasTextResult: false,
      hasAudioResult,
      isVoiceTab: true,
      hasSpeakableText: false,
      ...baseView,
      kindChip: hasAudioResult ? 'Voice result' : 'No voice result yet',
      title: 'Voice Result',
      contentHtml: baseView.contentHtml,
    };
  }

  const hasTextResult = latestTextResult.rawText.trim().length > 0;
  const speakableText = getSpeakableResultText(latestTextResult);

  return {
    activeTab,
    activeTabLabel,
    hasResult: hasTextResult,
    hasTextResult,
    hasAudioResult,
    isVoiceTab: false,
    hasSpeakableText: speakableText.trim().length > 0,
    kindChip: latestTextResult.kind
      ? `${latestTextResult.kind === 'summary' ? 'Summary' : 'OCR'} result`
      : 'No result yet',
    title: latestTextResult.title || 'Transform result',
    contentHtml: hasTextResult
      ? (latestTextResult.kind === 'summary'
          ? renderMarkdown(latestTextResult.rawText)
          : renderPlainText(latestTextResult.rawText))
      : baseView.contentHtml,
    defaultPromotionLabel: 'Replace Working Text',
    textCharacterCount: (latestTextResult.plainText || latestTextResult.rawText).trim().length,
  };
}

/**
 * @param {TextResult} latestTextResult
 * @param {'md' | 'txt'} format
 */
export function downloadLatestResult(latestTextResult, format) {
  if (!latestTextResult.rawText.trim()) return false;

  const content = format === 'md'
    ? (latestTextResult.format === 'markdown'
        ? latestTextResult.rawText
        : latestTextResult.plainText || latestTextResult.rawText)
    : (latestTextResult.plainText || latestTextResult.rawText);
  if (!content.trim()) return false;

  return downloadTextExport(content, format);
}

/** @param {TextResult} latestTextResult */
export async function copyLatestResultText(latestTextResult, clipboard = globalThis.navigator?.clipboard) {
  const text = getSpeakableResultText(latestTextResult);
  if (!text.trim() || !clipboard?.writeText) return false;

  try {
    await clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
