/**
 * @typedef {import('./workspace-contracts').AllowedImageFilesResult} AllowedImageFilesResult
 * @typedef {import('./workspace-contracts').AllowedImageMimeType} AllowedImageMimeType
 * @typedef {import('./workspace-contracts').ClipboardImageFilesResult} ClipboardImageFilesResult
 * @typedef {import('./workspace-contracts').OCRClipboardOptions} OCRClipboardOptions
 */

/** @type {Set<string>} */
const allowedImageMimeTypes = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/tiff']);

/** @param {string} type */
export function isAllowedImageType(type) {
  return allowedImageMimeTypes.has(type);
}

/** @param {File | null | undefined} file */
export function isAllowedImageFile(file) {
  return Boolean(file?.type) && isAllowedImageType(file.type);
}

/**
 * @param {File[]} [files=[]]
 * @returns {AllowedImageFilesResult}
 */
export function filterAllowedImageFiles(files = []) {
  const allowedFiles = [];
  let rejectedCount = 0;

  files.forEach((file) => {
    if (isAllowedImageFile(file)) {
      allowedFiles.push(file);
    } else if (file?.type?.startsWith('image/') || /\.svgz?$/i.test(file?.name || '')) {
      rejectedCount += 1;
    }
  });

  return { allowedFiles, rejectedCount };
}

/**
 * @param {DataTransfer | null | undefined} clipboardData
 * @param {OCRClipboardOptions} [options]
 * @returns {ClipboardImageFilesResult}
 */
export function getImageFilesFromClipboard(clipboardData, { now = () => Date.now() } = {}) {
  if (!clipboardData) return { files: [], rejectedCount: 0 };

  const itemFiles = Array.from(clipboardData.items || [])
    .filter((item) => item.kind === 'file' && isAllowedImageType(item.type))
    .map((item, index) => {
      const file = item.getAsFile();
      if (!file) return null;

      if (!file.name) {
        const ext = file.type.split('/')[1] || 'png';
        return new File([file], `clipboard-image-${now()}-${index}.${ext}`, { type: file.type });
      }

      return file;
    })
    .filter(Boolean);

  if (itemFiles.length > 0) {
    return { files: itemFiles, rejectedCount: 0 };
  }

  const { allowedFiles, rejectedCount } = filterAllowedImageFiles(Array.from(clipboardData.files || []));
  return { files: allowedFiles, rejectedCount };
}

/**
 * @param {File[]} currentFiles
 * @param {File[]} incomingFiles
 * @returns {File[]}
 */
export function appendStagedFiles(currentFiles, incomingFiles) {
  return [...currentFiles, ...incomingFiles];
}

/**
 * @param {File[]} files
 * @param {number | null} fromIndex
 * @param {number} toIndex
 * @returns {File[]}
 */
export function reorderStagedFiles(files, fromIndex, toIndex) {
  if (
    fromIndex === null
    || fromIndex === toIndex
    || fromIndex < 0
    || toIndex < 0
    || fromIndex >= files.length
    || toIndex >= files.length
  ) {
    return files;
  }

  const reorderedFiles = [...files];
  const [movedFile] = reorderedFiles.splice(fromIndex, 1);
  reorderedFiles.splice(toIndex, 0, movedFile);
  return reorderedFiles;
}

/**
 * @param {File[]} files
 * @param {number} index
 * @returns {File[]}
 */
export function removeStagedFile(files, index) {
  return files.filter((_, fileIndex) => fileIndex !== index);
}

/** @param {number} count */
export function formatStagedCount(count) {
  return `${count} file${count === 1 ? '' : 's'}`;
}
