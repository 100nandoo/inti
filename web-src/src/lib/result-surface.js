import { buildDownloadFilename } from '../../../web/js/filename.js';
import { downloadBlob } from '../../../web/js/download.js';
import { renderMarkdown } from '../../../web/js/markdown.js';
import { escHtml } from '../../../web/js/text.js';

function renderPlainText(text) {
  if (!text.trim()) return '';
  return text
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function buildResultSurfaceViewModel(workspace, defaultPromotionBehavior) {
  const latestTextResult = workspace.latestTextResult;
  const hasResult = latestTextResult.rawText.trim().length > 0;

  return {
    hasResult,
    hasSpeakableText: latestTextResult.plainText.trim().length > 0,
    kindChip: latestTextResult.kind
      ? `${latestTextResult.kind === 'summary' ? 'Summary' : 'OCR'} result`
      : 'No result yet',
    title: latestTextResult.title || 'Transform result',
    contentHtml: latestTextResult.kind === 'summary'
      ? renderMarkdown(latestTextResult.rawText)
      : renderPlainText(latestTextResult.rawText),
    defaultPromotionLabel: defaultPromotionBehavior === 'replace'
      ? 'Replace Working Text'
      : 'Append to Working Text',
  };
}

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

export async function copyLatestResultText(latestTextResult, clipboard = navigator.clipboard) {
  const text = latestTextResult.plainText || latestTextResult.rawText;
  if (!text) return false;

  try {
    await clipboard.writeText(text);
  } catch {}

  return true;
}
