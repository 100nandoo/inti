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
