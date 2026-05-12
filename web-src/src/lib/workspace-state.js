import { get, writable } from 'svelte/store';

function createInitialState() {
  return {
    processing: false,
    lastAudioBlob: null,
    lastAudioSourceText: '',
    lastAudioSourceLabel: '',
    stagedFiles: [],
    dragSrcIndex: null,
    isPointerOverOcrCard: false,
    workingText: '',
    latestTextResult: {
      kind: '',
      title: '',
      format: 'plain',
      rawText: '',
      plainText: '',
    },
    appearanceConfig: {
      summaryDownloadFormat: 'md',
      ocrPromotionBehavior: 'append',
      summaryPromotionBehavior: 'append',
    },
    summarizerConfig: {
      provider: '',
      model: '',
      keys: { gemini: '', groq: '', openrouter: '' },
      groqLimits: null,
    },
    selectedSummarizerProvider: '',
    selectedSummarizerModel: '',
  };
}

function normalizePromotionBehavior(value) {
  return value === 'replace' ? 'replace' : 'append';
}

function joinTextParts(current, incoming) {
  const next = incoming || '';
  if (!current.trim()) return next;
  if (!next.trim()) return current;
  return `${current.replace(/\s+$/, '')}\n\n${next.replace(/^\s+/, '')}`;
}

export const workspaceStore = writable(createInitialState());

export function getWorkspaceSnapshot() {
  return get(workspaceStore);
}

function updateWorkspace(updater) {
  workspaceStore.update((state) => updater(state));
}

export function setProcessing(value) {
  updateWorkspace((state) => ({ ...state, processing: value }));
}

export function setLastAudioResult(blob, sourceText, sourceLabel) {
  updateWorkspace((state) => ({
    ...state,
    lastAudioBlob: blob,
    lastAudioSourceText: sourceText || '',
    lastAudioSourceLabel: sourceLabel || '',
  }));
}

export function clearLastAudioBlob() {
  updateWorkspace((state) => ({
    ...state,
    lastAudioBlob: null,
    lastAudioSourceText: '',
    lastAudioSourceLabel: '',
  }));
}

export function setStagedFiles(files) {
  updateWorkspace((state) => ({ ...state, stagedFiles: files }));
}

export function setDragSourceIndex(index) {
  updateWorkspace((state) => ({ ...state, dragSrcIndex: index }));
}

export function setPointerOverOcrCard(value) {
  updateWorkspace((state) => ({ ...state, isPointerOverOcrCard: value }));
}

export function setWorkingText(text) {
  updateWorkspace((state) => ({ ...state, workingText: text }));
}

export function clearWorkingText() {
  updateWorkspace((state) => ({ ...state, workingText: '' }));
}

export function replaceWorkingText(text) {
  updateWorkspace((state) => ({ ...state, workingText: text || '' }));
}

export function appendToWorkingText(text) {
  updateWorkspace((state) => ({
    ...state,
    workingText: joinTextParts(state.workingText, text || ''),
  }));
}

export function setLatestTextResult({ kind = '', title = '', format = 'plain', rawText = '', plainText = '' }) {
  updateWorkspace((state) => ({
    ...state,
    latestTextResult: {
      kind,
      title,
      format,
      rawText,
      plainText: plainText || rawText,
    },
  }));
}

export function clearLatestTextResult() {
  updateWorkspace((state) => ({
    ...state,
    latestTextResult: {
      kind: '',
      title: '',
      format: 'plain',
      rawText: '',
      plainText: '',
    },
  }));
}

export function promoteLatestTextResult(mode) {
  const state = getWorkspaceSnapshot();
  const rawText = state.latestTextResult.rawText || '';
  if (!rawText.trim()) return false;

  if (mode === 'replace') {
    replaceWorkingText(rawText);
    return true;
  }

  appendToWorkingText(rawText);
  return true;
}

export function applyAppearanceConfig(data) {
  updateWorkspace((state) => ({
    ...state,
    appearanceConfig: {
      summaryDownloadFormat: data.summaryDownloadFormat === 'txt' ? 'txt' : 'md',
      ocrPromotionBehavior: normalizePromotionBehavior(data.ocrPromotionBehavior),
      summaryPromotionBehavior: normalizePromotionBehavior(data.summaryPromotionBehavior),
    },
  }));
}

export function getDefaultPromotionBehavior(kind) {
  const state = getWorkspaceSnapshot();
  if (kind === 'summary') return state.appearanceConfig.summaryPromotionBehavior;
  if (kind === 'ocr') return state.appearanceConfig.ocrPromotionBehavior;
  return 'append';
}

export function applySummarizerConfig(data) {
  updateWorkspace((state) => ({
    ...state,
    summarizerConfig: {
      provider: data.provider || '',
      model: data.model || '',
      keys: {
        gemini: data.keys?.gemini || '',
        groq: data.keys?.groq || '',
        openrouter: data.keys?.openrouter || '',
      },
      groqLimits: data.groqLimits || null,
    },
    selectedSummarizerProvider: state.selectedSummarizerProvider || data.provider || '',
    selectedSummarizerModel: state.selectedSummarizerModel || data.model || '',
  }));
}

export function setGroqRateLimits(rateLimits) {
  updateWorkspace((state) => ({
    ...state,
    summarizerConfig: {
      ...state.summarizerConfig,
      groqLimits: rateLimits,
    },
  }));
}

export function setSelectedSummarizerSelection(provider, model) {
  updateWorkspace((state) => ({
    ...state,
    selectedSummarizerProvider: provider || '',
    selectedSummarizerModel: model || '',
  }));
}

export function getSelectedSummarizerProvider() {
  return getWorkspaceSnapshot().selectedSummarizerProvider;
}

export function getSelectedSummarizerModel() {
  const state = getWorkspaceSnapshot();
  return state.selectedSummarizerProvider === 'openrouter' ? '' : state.selectedSummarizerModel;
}
