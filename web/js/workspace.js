const listeners = new Set();

const state = {
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

function emit() {
  listeners.forEach((listener) => listener(state));
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

export function getWorkspace() {
  return state;
}

export function subscribeWorkspace(listener, { immediate = true } = {}) {
  listeners.add(listener);
  if (immediate) listener(state);
  return () => listeners.delete(listener);
}

export function setProcessing(value) {
  state.processing = value;
  emit();
}

export function setLastAudioResult(blob, sourceText, sourceLabel) {
  state.lastAudioBlob = blob;
  state.lastAudioSourceText = sourceText || '';
  state.lastAudioSourceLabel = sourceLabel || '';
  emit();
}

export function clearLastAudioBlob() {
  state.lastAudioBlob = null;
  state.lastAudioSourceText = '';
  state.lastAudioSourceLabel = '';
  emit();
}

export function setStagedFiles(files) {
  state.stagedFiles = files;
  emit();
}

export function setDragSourceIndex(index) {
  state.dragSrcIndex = index;
  emit();
}

export function setPointerOverOcrCard(value) {
  state.isPointerOverOcrCard = value;
  emit();
}

export function setWorkingText(text) {
  state.workingText = text;
  emit();
}

export function clearWorkingText() {
  state.workingText = '';
  emit();
}

export function replaceWorkingText(text) {
  state.workingText = text || '';
  emit();
}

export function appendToWorkingText(text) {
  state.workingText = joinTextParts(state.workingText, text || '');
  emit();
}

export function setLatestTextResult({ kind = '', title = '', format = 'plain', rawText = '', plainText = '' }) {
  state.latestTextResult = {
    kind,
    title,
    format,
    rawText,
    plainText: plainText || rawText,
  };
  emit();
}

export function clearLatestTextResult() {
  state.latestTextResult = {
    kind: '',
    title: '',
    format: 'plain',
    rawText: '',
    plainText: '',
  };
  emit();
}

export function promoteLatestTextResult(mode) {
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
  state.appearanceConfig = {
    summaryDownloadFormat: data.summaryDownloadFormat === 'txt' ? 'txt' : 'md',
    ocrPromotionBehavior: normalizePromotionBehavior(data.ocrPromotionBehavior),
    summaryPromotionBehavior: normalizePromotionBehavior(data.summaryPromotionBehavior),
  };
  emit();
}

export function getDefaultPromotionBehavior(kind) {
  if (kind === 'summary') return state.appearanceConfig.summaryPromotionBehavior;
  if (kind === 'ocr') return state.appearanceConfig.ocrPromotionBehavior;
  return 'append';
}

export function applySummarizerConfig(data) {
  state.summarizerConfig = {
    provider: data.provider || '',
    model: data.model || '',
    keys: {
      gemini: data.keys?.gemini || '',
      groq: data.keys?.groq || '',
      openrouter: data.keys?.openrouter || '',
    },
    groqLimits: data.groqLimits || null,
  };
  if (!state.selectedSummarizerProvider) {
    state.selectedSummarizerProvider = state.summarizerConfig.provider;
  }
  if (!state.selectedSummarizerModel) {
    state.selectedSummarizerModel = state.summarizerConfig.model;
  }
  emit();
}

export function setGroqRateLimits(rateLimits) {
  state.summarizerConfig = {
    ...state.summarizerConfig,
    groqLimits: rateLimits,
  };
  emit();
}

export function setSelectedSummarizerSelection(provider, model) {
  state.selectedSummarizerProvider = provider || '';
  state.selectedSummarizerModel = model || '';
  emit();
}

export function getSelectedSummarizerProvider() {
  return state.selectedSummarizerProvider;
}

export function getSelectedSummarizerModel() {
  return state.selectedSummarizerProvider === 'openrouter' ? '' : state.selectedSummarizerModel;
}
