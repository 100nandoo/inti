import { buildDownloadFilename } from '../../../web/js/filename.js';
import { downloadBlob } from '../../../web/js/download.js';
import { renderMarkdown } from '../../../web/js/markdown.js';
import { escHtml } from '../../../web/js/text.js';

/**
 * @typedef {import('./workspace-contracts').ClipboardWriter} ClipboardWriter
 * @typedef {import('./workspace-contracts').PromotionBehavior} PromotionBehavior
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

/**
 * @param {TextResult} latestTextResult
 * @returns {string}
 */
function getSpeakableResultText(latestTextResult) {
  return latestTextResult.plainText || latestTextResult.rawText;
}

/**
 * @param {PromotionBehavior} defaultPromotionBehavior
 * @returns {string}
 */
function getDefaultPromotionLabel(defaultPromotionBehavior) {
  return defaultPromotionBehavior === 'append'
    ? 'Append to Working Text'
    : 'Replace Working Text';
}

/**
 * @param {ResultSurfaceWorkspace} workspace
 * @param {PromotionBehavior} defaultPromotionBehavior
 * @returns {ResultSurfaceViewModel}
 */
export function buildResultSurfaceViewModel(workspace, defaultPromotionBehavior) {
  const latestTextResult = workspace.latestTextResult;
  const hasResult = latestTextResult.rawText.trim().length > 0;
  const speakableText = getSpeakableResultText(latestTextResult);

  return {
    hasResult,
    hasSpeakableText: speakableText.trim().length > 0,
    kindChip: latestTextResult.kind
      ? `${latestTextResult.kind === 'summary' ? 'Summary' : 'OCR'} result`
      : 'No result yet',
    title: latestTextResult.title || 'Transform result',
    contentHtml: latestTextResult.kind === 'summary'
      ? renderMarkdown(latestTextResult.rawText)
      : renderPlainText(latestTextResult.rawText),
    defaultPromotionLabel: getDefaultPromotionLabel(defaultPromotionBehavior),
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

  const mimeType = format === 'md' ? 'text/markdown' : 'text/plain';
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  downloadBlob(blob, buildDownloadFilename(content, format));
  return true;
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
