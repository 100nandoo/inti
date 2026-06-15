import {
  buildOCRCompletionMeta,
  createOCRTextResult,
} from './ocr-result.js';
import {
  readOCRUploadResponse,
  uploadOCRFiles,
} from './ocr-transport.js';

/**
 * @typedef {import('./workspace-contracts').TextResult} TextResult
 */

/**
 * @param {{
 *   apiURL: (path: string) => string;
 *   files: File[];
 *   fetchImpl?: typeof fetch;
 * }} input
 * @returns {Promise<{
 *   ocrResult: TextResult;
 *   feedMeta: string;
 * }>}
 */
export async function executeMainWorkspaceOCR({
  apiURL,
  files,
  fetchImpl = fetch,
}) {
  const response = await uploadOCRFiles({
    apiURL,
    files,
    fetchImpl,
  });
  const { text } = await readOCRUploadResponse(response);
  const rawText = text || '';

  return {
    ocrResult: createOCRTextResult(rawText),
    feedMeta: buildOCRCompletionMeta(rawText),
  };
}
