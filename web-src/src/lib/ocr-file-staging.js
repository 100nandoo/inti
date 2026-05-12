const allowedImageMimeTypes = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/tiff']);

export function isAllowedImageType(type) {
  return allowedImageMimeTypes.has(type);
}

export function isAllowedImageFile(file) {
  return Boolean(file?.type) && isAllowedImageType(file.type);
}

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

export function appendStagedFiles(currentFiles, incomingFiles) {
  return [...currentFiles, ...incomingFiles];
}

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

export function removeStagedFile(files, index) {
  return files.filter((_, fileIndex) => fileIndex !== index);
}

export function formatStagedCount(count) {
  return `${count} file${count === 1 ? '' : 's'}`;
}
