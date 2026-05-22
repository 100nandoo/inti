// @ts-check

/**
 * @typedef {import('./workspace-contracts').TextResult} TextResult
 */

/**
 * @param {File[]} files
 * @returns {FormData}
 */
export function buildOCRUploadRequest(files) {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  return formData;
}

/**
 * @param {{
 *   apiURL: (path: string) => string;
 *   files: File[];
 *   fetchImpl?: typeof fetch;
 * }} input
 */
export async function uploadOCRFiles({
  apiURL,
  files,
  fetchImpl = fetch,
}) {
  return fetchImpl(apiURL('/api/ocr'), {
    method: 'POST',
    body: buildOCRUploadRequest(files),
  });
}

/**
 * @param {Response} response
 * @returns {Promise<{ text: string }>}
 */
export async function readOCRUploadResponse(response) {
  if (!response.ok) {
    const body = await response.json().catch(() => /** @type {{ error?: string }} */ ({}));
    throw new Error(body.error || response.statusText || 'Could not run OCR');
  }

  const payload = await response.json().catch(() => /** @type {{ text?: string }} */ ({}));
  return { text: payload.text || '' };
}
