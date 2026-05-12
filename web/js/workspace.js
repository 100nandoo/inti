const listeners = new Set();

const state = {
  processing: false,
  lastAudioBlob: null,
  stagedFiles: [],
  dragSrcIndex: null,
  isPointerOverOcrCard: false,
  ocrText: '',
  workspaceText: '',
  textToSpeechText: '',
  summaryMarkdown: '',
  summaryPlainText: '',
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

export function setLastAudioBlob(blob) {
  state.lastAudioBlob = blob;
  emit();
}

export function clearLastAudioBlob() {
  state.lastAudioBlob = null;
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

export function setOCRText(text) {
  state.ocrText = text;
  emit();
}

export function setWorkspaceText(text) {
  state.workspaceText = text;
  emit();
}

export function clearWorkspaceText() {
  state.workspaceText = '';
  emit();
}

export function setTextToSpeechText(text) {
  state.textToSpeechText = text;
  emit();
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

export function setSummaryResult(markdown, plainText) {
  state.summaryMarkdown = markdown || '';
  state.summaryPlainText = plainText || '';
  emit();
}

export function clearSummaryResult() {
  state.summaryMarkdown = '';
  state.summaryPlainText = '';
  emit();
}
