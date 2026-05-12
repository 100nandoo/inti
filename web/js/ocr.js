import {
  clearFilesBtn,
  dropZone,
  fileInput,
  fileList,
  fileStaging,
  imgModal,
  imgModalBack,
  imgModalClose,
  imgModalImg,
  ocrCard,
  ocrOutputText,
  ocrResult,
  runOcrBtn,
  stagedCount,
  workspaceText,
} from './dom.js';
import { formatFileSize } from './bytes.js';
import { addFeed, setStatus, updateFeedItem } from './feed.js';
import { updateTextMetrics } from './metrics.js';
import {
  clearSummaryResult,
  getWorkspace,
  setOCRText,
  setDragSourceIndex,
  setPointerOverOcrCard,
  setStagedFiles,
  setTextToSpeechText,
  setWorkspaceText,
  subscribeWorkspace,
} from './workspace.js';
import { escHtml } from './text.js';

const allowedImageMimeTypes = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/tiff']);

function openImagePreview(src) {
  imgModalImg.src = src;
  imgModal.hidden = false;
  document.addEventListener('keydown', onModalKeydown);
}

function closeImagePreview() {
  imgModal.hidden = true;
  imgModalImg.src = '';
  document.removeEventListener('keydown', onModalKeydown);
}

function onModalKeydown(event) {
  if (event.key === 'Escape') closeImagePreview();
}

function shouldHandleGlobalPaste() {
  const activeElement = document.activeElement;
  if (activeElement && activeElement.closest('input, textarea, select, [contenteditable="true"]')) {
    return false;
  }

  return getWorkspace().isPointerOverOcrCard || (activeElement ? ocrCard.contains(activeElement) : false);
}

function isAllowedImageType(type) {
  return allowedImageMimeTypes.has(type);
}

function isAllowedImageFile(file) {
  return Boolean(file?.type) && isAllowedImageType(file.type);
}

function filterAllowedImageFiles(files) {
  const allowedFiles = [];
  let rejectedCount = 0;

  files.forEach((file) => {
    if (isAllowedImageFile(file)) {
      allowedFiles.push(file);
    } else if (file?.type?.startsWith('image/') || /\.svgz?$/i.test(file?.name || '')) {
      rejectedCount += 1;
    }
  });

  if (rejectedCount > 0) {
    const suffix = rejectedCount === 1 ? '' : 's';
    setStatus(`Rejected ${rejectedCount} unsupported image file${suffix}. SVG uploads are not allowed.`, 'error');
  }

  return allowedFiles;
}

function getImageFilesFromClipboard(clipboardData) {
  if (!clipboardData) return [];

  const itemFiles = Array.from(clipboardData.items || [])
    .filter((item) => item.kind === 'file' && isAllowedImageType(item.type))
    .map((item, index) => {
      const file = item.getAsFile();
      if (!file) return null;

      if (!file.name) {
        const ext = file.type.split('/')[1] || 'png';
        return new File([file], `clipboard-image-${Date.now()}-${index}.${ext}`, { type: file.type });
      }

      return file;
    })
    .filter(Boolean);

  if (itemFiles.length > 0) return itemFiles;
  return filterAllowedImageFiles(Array.from(clipboardData.files || []));
}

function addStagedFiles(files) {
  setStagedFiles([...getWorkspace().stagedFiles, ...files]);
}

function renderFileList() {
  const { stagedFiles } = getWorkspace();
  fileList.innerHTML = '';

  if (stagedCount) {
    stagedCount.textContent = `${stagedFiles.length} file${stagedFiles.length === 1 ? '' : 's'}`;
  }

  stagedFiles.forEach((file, index) => {
    const item = document.createElement('li');
    item.className = 'file-item';
    item.draggable = true;
    item.dataset.index = index;

    const url = URL.createObjectURL(file);
    item.innerHTML = `
      <span class="drag-handle" title="Drag to reorder">::</span>
      <img class="file-thumb" src="${url}" alt="" />
      <span class="file-info">
        <span class="file-name" title="${escHtml(file.name)}">${escHtml(file.name)}</span>
        <span class="file-meta">${formatFileSize(file.size)}</span>
      </span>
      <span class="file-ok" title="Ready">
        <span class="icon icon-check" aria-hidden="true"></span>
      </span>
      <button class="file-remove" data-index="${index}" title="Remove">
        <span class="icon icon-trash" aria-hidden="true"></span>
      </button>`;

    const thumb = item.querySelector('.file-thumb');
    thumb.addEventListener('load', () => {
      const meta = item.querySelector('.file-meta');
      meta.textContent = `${formatFileSize(file.size)} · ${thumb.naturalWidth} × ${thumb.naturalHeight}`;
      URL.revokeObjectURL(url);
    });
    thumb.addEventListener('click', () => {
      const previewUrl = URL.createObjectURL(file);
      openImagePreview(previewUrl);
      imgModalImg.addEventListener('load', () => URL.revokeObjectURL(previewUrl), { once: true });
    });

    item.addEventListener('dragstart', (event) => {
      setDragSourceIndex(index);
      event.dataTransfer.effectAllowed = 'move';
      requestAnimationFrame(() => item.classList.add('dragging'));
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      fileList.querySelectorAll('.file-item').forEach((element) => element.classList.remove('drag-over'));
    });

    item.addEventListener('dragover', (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      fileList.querySelectorAll('.file-item').forEach((element) => element.classList.remove('drag-over'));
      item.classList.add('drag-over');
    });

    item.addEventListener('drop', (event) => {
      event.preventDefault();
      item.classList.remove('drag-over');

      const { dragSrcIndex, stagedFiles: currentFiles } = getWorkspace();
      if (dragSrcIndex === null || dragSrcIndex === index) return;

      const reorderedFiles = [...currentFiles];
      const [movedFile] = reorderedFiles.splice(dragSrcIndex, 1);
      reorderedFiles.splice(index, 0, movedFile);
      setStagedFiles(reorderedFiles);
    });

    fileList.appendChild(item);
  });

  fileStaging.hidden = stagedFiles.length === 0;
}

function syncOCRControls() {
  const { processing, stagedFiles, ocrText, workspaceText: currentWorkspaceText } = getWorkspace();
  if (ocrOutputText.value !== ocrText) {
    ocrOutputText.value = ocrText;
  }
  if (workspaceText.value !== currentWorkspaceText) {
    workspaceText.value = currentWorkspaceText;
  }
  ocrOutputText.disabled = processing;
  workspaceText.disabled = processing;
  runOcrBtn.disabled = processing || stagedFiles.length === 0;
  clearFilesBtn.disabled = processing || stagedFiles.length === 0;
}

async function uploadImagesForOCR(files) {
  const label = files.length === 1 ? files[0].name : `${files.length} images`;
  dropZone.classList.add('ocr-loading');
  runOcrBtn.disabled = true;
  const feedItem = addFeed('info', `OCR: ${label}`, 'extracting text…');

  try {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const response = await fetch(window.apiURL('/api/ocr'), { method: 'POST', body: formData });
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(body.error || response.statusText);
    }

    const { text } = await response.json();
    setOCRText(text || '');
    setWorkspaceText(text || '');
    setTextToSpeechText(text || '');
    ocrResult.hidden = false;
    clearSummaryResult();
    updateTextMetrics();
    setStagedFiles([]);

    const wordCount = text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
    updateFeedItem(feedItem, 'ok', `OCR: ${label}`, `${wordCount} word${wordCount === 1 ? '' : 's'} extracted`);
  } catch (error) {
    updateFeedItem(feedItem, 'fail', `OCR: ${label}`, error.message);
  } finally {
    dropZone.classList.remove('ocr-loading');
    syncOCRControls();
  }
}

export function initOCR() {
  renderFileList();
  syncOCRControls();

  let previousStagedFiles = getWorkspace().stagedFiles;
  let previousProcessing = getWorkspace().processing;
  let previousOCRText = getWorkspace().ocrText;
  let previousWorkspaceText = getWorkspace().workspaceText;

  subscribeWorkspace((state) => {
    const stagedFilesChanged = state.stagedFiles !== previousStagedFiles;
    const processingChanged = state.processing !== previousProcessing;
    const textChanged = state.ocrText !== previousOCRText || state.workspaceText !== previousWorkspaceText;

    if (stagedFilesChanged) {
      renderFileList();
    }

    if (processingChanged || stagedFilesChanged || textChanged) {
      syncOCRControls();
    }

    previousStagedFiles = state.stagedFiles;
    previousProcessing = state.processing;
    previousOCRText = state.ocrText;
    previousWorkspaceText = state.workspaceText;
  });

  imgModalClose.addEventListener('click', closeImagePreview);
  imgModalBack.addEventListener('click', closeImagePreview);

  dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropZone.classList.add('drag-active');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-active');
  });

  dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropZone.classList.remove('drag-active');
    const files = filterAllowedImageFiles(Array.from(event.dataTransfer.files));
    if (files.length > 0) addStagedFiles(files);
  });

  dropZone.addEventListener('click', () => {
    dropZone.focus();
  });

  ocrCard.addEventListener('pointerenter', () => {
    setPointerOverOcrCard(true);
  });

  ocrCard.addEventListener('pointerleave', () => {
    setPointerOverOcrCard(false);
  });

  document.addEventListener('paste', (event) => {
    if (!shouldHandleGlobalPaste()) return;
    const files = getImageFilesFromClipboard(event.clipboardData);
    if (!files.length) return;
    event.preventDefault();
    addStagedFiles(files);
  });

  fileInput.addEventListener('change', () => {
    const files = filterAllowedImageFiles(Array.from(fileInput.files));
    if (files.length > 0) addStagedFiles(files);
    fileInput.value = '';
  });

  fileList.addEventListener('click', (event) => {
    const button = event.target.closest('.file-remove');
    if (!button) return;

    const files = [...getWorkspace().stagedFiles];
    files.splice(Number.parseInt(button.dataset.index, 10), 1);
    setStagedFiles(files);
  });

  clearFilesBtn.addEventListener('click', () => {
    setStagedFiles([]);
  });

  runOcrBtn.addEventListener('click', () => {
    const { processing, stagedFiles } = getWorkspace();
    if (stagedFiles.length > 0 && !processing) {
      uploadImagesForOCR([...stagedFiles]);
    }
  });

  ocrOutputText.addEventListener('input', () => {
    updateTextMetrics();
  });
}
