/** @typedef {import('./workspace-contracts').TextResult} TextResult */

/** @returns {TextResult} */
export function createOCRTextResult(rawText = '') {
  return {
    kind: 'ocr',
    title: 'OCR Result',
    format: 'plain',
    rawText,
    plainText: rawText,
  };
}

export function countOCRWords(text = '') {
  return text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
}

export function buildOCRCompletionMeta(rawText = '') {
  const wordCount = countOCRWords(rawText);
  return `${wordCount} word${wordCount === 1 ? '' : 's'} extracted`;
}
