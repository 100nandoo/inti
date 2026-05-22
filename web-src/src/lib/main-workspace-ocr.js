import {
  buildOCRCompletionMeta,
  createOCRTextResult,
} from './ocr-result.js';

/**
 * @typedef {import('./workspace-contracts').TextResult} TextResult
 */

/**
 * @param {number} rejectedCount
 * @returns {string | null}
 */
export function buildOCRRejectedFilesMessage(rejectedCount) {
  if (rejectedCount <= 0) return null;
  const suffix = rejectedCount === 1 ? '' : 's';
  return `Rejected ${rejectedCount} unsupported image file${suffix}. SVG uploads are not allowed.`;
}

/**
 * @param {{
 *   inputMode: string;
 *   isPointerOverOcrCard: boolean;
 *   activeElement: Element | null;
 *   ocrCardElement: HTMLElement | null;
 * }} input
 */
export function shouldHandleOCRGlobalPaste({
  inputMode,
  isPointerOverOcrCard,
  activeElement,
  ocrCardElement,
}) {
  if (activeElement && activeElement.closest('input, textarea, select, [contenteditable="true"]')) {
    return false;
  }

  if (inputMode !== 'ocr') {
    return false;
  }

  return Boolean(
    isPointerOverOcrCard
      || (ocrCardElement && activeElement ? ocrCardElement.contains(activeElement) : false),
  );
}

/**
 * @param {{
 *   apiURL: (path: string) => string;
 *   files: File[];
 *   workingText: string;
 *   fetchImpl?: typeof fetch;
 * }} input
 * @returns {Promise<{
 *   ocrResult: TextResult;
 *   autoPromoted: boolean;
 *   feedMeta: string;
 * }>}
 */
export async function executeMainWorkspaceOCR({
  apiURL,
  files,
  workingText,
  fetchImpl = fetch,
}) {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const response = await fetchImpl(apiURL('/api/ocr'), {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(body.error || response.statusText);
  }

  const { text } = await response.json();
  const rawText = text || '';

  return {
    ocrResult: createOCRTextResult(rawText),
    autoPromoted: !workingText.trim() && Boolean(rawText.trim()),
    feedMeta: buildOCRCompletionMeta(rawText),
  };
}
