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
  inputModeOcrBtn,
  inputModeWorkingTextBtn,
  ocrCard,
  ocrInputPanel,
  runOcrBtn,
  stagedCount,
  workingTextPanel,
} from './dom.js';
import { formatFileSize } from './bytes.js';
import { addFeed, setStatus, updateFeedItem } from './feed.js';
import {
  getWorkspace,
  setInputMode,
  setDragSourceIndex,
  setLatestTextResult,
  setPointerOverOcrCard,
  setProcessing,
  setStagedFiles,
  subscribeWorkspace,
} from './workspace.js';
import { escHtml } from './text.js';
import {
  appendStagedFiles,
  filterAllowedImageFiles,
  formatStagedCount,
  getImageFilesFromClipboard,
  isAllowedImageType,
  removeStagedFile,
  reorderStagedFiles,
} from '../../web-src/src/lib/ocr-file-staging.js';
import {
  buildOCRCompletionMeta,
  createOCRTextResult,
} from '../../web-src/src/lib/ocr-result.js';

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

  if (getWorkspace().inputMode !== 'ocr') {
    return false;
  }

  return getWorkspace().isPointerOverOcrCard || (activeElement ? ocrCard.contains(activeElement) : false);
}

function announceRejectedFiles(rejectedCount) {
  if (rejectedCount > 0) {
    const suffix = rejectedCount === 1 ? '' : 's';
    setStatus(`Rejected ${rejectedCount} unsupported image file${suffix}. SVG uploads are not allowed.`, 'error');
  }
}

function addStagedFiles(files) {
  setStagedFiles(appendStagedFiles(getWorkspace().stagedFiles, files));
}

function renderFileList() {
  const { stagedFiles } = getWorkspace();
  fileList.innerHTML = '';

  if (stagedCount) {
    stagedCount.textContent = formatStagedCount(stagedFiles.length);
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
      setStagedFiles(reorderStagedFiles(currentFiles, dragSrcIndex, index));
    });

    item.querySelector('.file-remove').addEventListener('click', () => {
      setStagedFiles(removeStagedFile(getWorkspace().stagedFiles, index));
    });

    fileList.appendChild(item);
  });

  fileStaging.hidden = stagedFiles.length === 0;
}

function syncOCRControls() {
  const { inputMode, processing, stagedFiles } = getWorkspace();
  const isOcrMode = inputMode === 'ocr';
  runOcrBtn.disabled = !isOcrMode || processing || stagedFiles.length === 0;
  clearFilesBtn.disabled = !isOcrMode || processing || stagedFiles.length === 0;
}

function syncInputModeControls() {
  const { inputMode } = getWorkspace();
  const isOcrMode = inputMode === 'ocr';

  ocrInputPanel.hidden = !isOcrMode;
  workingTextPanel.hidden = isOcrMode;
  inputModeOcrBtn.setAttribute('aria-selected', String(isOcrMode));
  inputModeWorkingTextBtn.setAttribute('aria-selected', String(!isOcrMode));
  inputModeOcrBtn.classList.toggle('is-active', isOcrMode);
  inputModeWorkingTextBtn.classList.toggle('is-active', !isOcrMode);
}

export async function uploadImagesForOCR(files) {
  const label = files.length === 1 ? files[0].name : `${files.length} images`;
  dropZone.classList.add('ocr-loading');
  setProcessing(true);
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
    const rawText = text || '';
    setLatestTextResult(createOCRTextResult(rawText));
    setStatus('OCR result ready for review.', 'success');
    setStagedFiles([]);
    updateFeedItem(feedItem, 'ok', `OCR: ${label}`, buildOCRCompletionMeta(rawText));
  } catch (error) {
    updateFeedItem(feedItem, 'fail', `OCR: ${label}`, error.message);
    setStatus(error.message, 'error');
  } finally {
    dropZone.classList.remove('ocr-loading');
    setProcessing(false);
    syncOCRControls();
  }
}

export function initOCR() {
  renderFileList();
  syncInputModeControls();
  syncOCRControls();

  let previousStagedFiles = getWorkspace().stagedFiles;
  let previousProcessing = getWorkspace().processing;
  let previousInputMode = getWorkspace().inputMode;

  subscribeWorkspace((state) => {
    if (state.inputMode !== previousInputMode) {
      syncInputModeControls();
    }
    if (state.stagedFiles !== previousStagedFiles) {
      renderFileList();
    }
    if (
      state.processing !== previousProcessing
      || state.stagedFiles !== previousStagedFiles
      || state.inputMode !== previousInputMode
    ) {
      syncOCRControls();
    }

    previousStagedFiles = state.stagedFiles;
    previousProcessing = state.processing;
    previousInputMode = state.inputMode;
  });

  inputModeOcrBtn?.addEventListener('click', () => {
    setInputMode('ocr');
  });

  inputModeWorkingTextBtn?.addEventListener('click', () => {
    setInputMode('working-text');
  });

  dropZone.addEventListener('click', (event) => {
    if (event.target instanceof HTMLLabelElement) return;
    fileInput.click();
  });

  dropZone.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      fileInput.click();
    }
  });

  fileInput.addEventListener('change', () => {
    const { allowedFiles, rejectedCount } = filterAllowedImageFiles(Array.from(fileInput.files || []));
    announceRejectedFiles(rejectedCount);
    if (allowedFiles.length > 0) addStagedFiles(allowedFiles);
    fileInput.value = '';
  });

  dropZone.addEventListener('dragenter', (event) => {
    event.preventDefault();
    dropZone.classList.add('drag-active');
  });

  dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropZone.classList.add('drag-active');
  });

  dropZone.addEventListener('dragleave', (event) => {
    if (!dropZone.contains(event.relatedTarget)) {
      dropZone.classList.remove('drag-active');
    }
  });

  dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropZone.classList.remove('drag-active');
    const { allowedFiles, rejectedCount } = filterAllowedImageFiles(Array.from(event.dataTransfer?.files || []));
    announceRejectedFiles(rejectedCount);
    if (allowedFiles.length > 0) addStagedFiles(allowedFiles);
  });

  ocrCard.addEventListener('mouseenter', () => setPointerOverOcrCard(true));
  ocrCard.addEventListener('mouseleave', () => setPointerOverOcrCard(false));
  ocrCard.addEventListener('focusin', () => setPointerOverOcrCard(true));
  ocrCard.addEventListener('focusout', () => setPointerOverOcrCard(false));

  document.addEventListener('paste', (event) => {
    if (!shouldHandleGlobalPaste()) return;
    const { files, rejectedCount } = getImageFilesFromClipboard(event.clipboardData);
    announceRejectedFiles(rejectedCount);
    if (files.length === 0) return;
    event.preventDefault();
    addStagedFiles(files);
    setStatus(`Staged ${files.length} pasted image${files.length === 1 ? '' : 's'}.`, 'success');
  });

  clearFilesBtn.addEventListener('click', () => {
    setStagedFiles([]);
    setStatus('Cleared staged OCR files.', 'success');
  });

  runOcrBtn.addEventListener('click', async () => {
    const files = getWorkspace().stagedFiles;
    if (files.length === 0) return;
    await uploadImagesForOCR(files);
  });

  imgModalBack?.addEventListener('click', closeImagePreview);
  imgModalClose?.addEventListener('click', closeImagePreview);
}
