const listeners = new Set();

const state = {
  processing: false,
  lastAudioBlob: null,
  stagedFiles: [],
  dragSrcIndex: null,
  isPointerOverOcrCard: false,
  summarizerConfig: {
    provider: '',
    model: '',
    keys: { gemini: '', groq: '', openrouter: '' },
    groqLimits: null,
  },
};

function emit() {
  listeners.forEach((listener) => listener(state));
}

export function getState() {
  return state;
}

export function subscribeState(listener, { immediate = true } = {}) {
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
  emit();
}

export function setGroqRateLimits(rateLimits) {
  state.summarizerConfig = {
    ...state.summarizerConfig,
    groqLimits: rateLimits,
  };
  emit();
}
