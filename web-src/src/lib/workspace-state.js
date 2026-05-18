import { get, writable } from 'svelte/store';

/**
 * @typedef {import('./workspace-contracts').AppearanceConfigInput} AppearanceConfigInput
 * @typedef {import('./workspace-contracts').GroqRateLimits} GroqRateLimits
 * @typedef {import('./workspace-contracts').PromotionBehavior} PromotionBehavior
 * @typedef {import('./workspace-contracts').SpeechConfigInput} SpeechConfigInput
 * @typedef {import('./workspace-contracts').SummarizerConfigInput} SummarizerConfigInput
 * @typedef {import('./workspace-contracts').TextResult} TextResult
 * @typedef {import('./workspace-contracts').TextResultKind} TextResultKind
 * @typedef {import('./workspace-contracts').TextResultUpdate} TextResultUpdate
 * @typedef {import('./workspace-contracts').WorkspaceState} WorkspaceState
 */

/** @returns {TextResult} */
function createEmptyTextResult() {
  return {
    kind: '',
    title: '',
    format: 'plain',
    rawText: '',
    plainText: '',
  };
}

/** @returns {WorkspaceState} */
function createInitialState() {
  return {
    processing: false,
    lastAudioBlob: null,
    lastAudioSourceText: '',
    lastAudioSourceLabel: '',
    lastAudioProvider: '',
    lastAudioVoice: '',
    lastAudioModel: '',
    stagedFiles: [],
    dragSrcIndex: null,
    isPointerOverOcrCard: false,
    workingText: '',
    latestTextResult: createEmptyTextResult(),
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
    speechConfig: {
      provider: 'gemini',
      voice: 'Kore',
      model: 'gemini-3.1-flash-tts-preview',
    },
    selectedSummarizerProvider: '',
    selectedSummarizerModel: '',
    selectedSpeechProvider: 'gemini',
    selectedSpeechVoice: 'Kore',
    selectedSpeechModel: 'gemini-3.1-flash-tts-preview',
  };
}

/** @param {string} value */
function normalizePromotionBehavior(value) {
  return value === 'replace' ? 'replace' : 'append';
}

/** @param {string} current
 * @param {string} incoming
 * @returns {string}
 */
function joinTextParts(current, incoming) {
  const next = incoming || '';
  if (!current.trim()) return next;
  if (!next.trim()) return current;
  return `${current.replace(/\s+$/, '')}\n\n${next.replace(/^\s+/, '')}`;
}

/** @type {import('svelte/store').Writable<WorkspaceState>} */
export const workspaceStore = writable(createInitialState());

/** @returns {WorkspaceState} */
export function getWorkspaceSnapshot() {
  return get(workspaceStore);
}

/**
 * @param {(state: WorkspaceState) => WorkspaceState} updater
 */
function updateWorkspace(updater) {
  workspaceStore.update((state) => updater(state));
}

/** @param {boolean} value */
export function setProcessing(value) {
  updateWorkspace((state) => ({ ...state, processing: value }));
}

/**
 * @param {Blob | null} blob
 * @param {string} sourceText
 * @param {string} sourceLabel
 * @param {{ provider?: string, voice?: string, model?: string }} [details]
 */
export function setLastAudioResult(blob, sourceText, sourceLabel, details = {}) {
  updateWorkspace((state) => ({
    ...state,
    lastAudioBlob: blob,
    lastAudioSourceText: sourceText || '',
    lastAudioSourceLabel: sourceLabel || '',
    lastAudioProvider: details.provider || '',
    lastAudioVoice: details.voice || '',
    lastAudioModel: details.model || '',
  }));
}

export function clearLastAudioBlob() {
  updateWorkspace((state) => ({
    ...state,
    lastAudioBlob: null,
    lastAudioSourceText: '',
    lastAudioSourceLabel: '',
    lastAudioProvider: '',
    lastAudioVoice: '',
    lastAudioModel: '',
  }));
}

/** @param {File[]} files */
export function setStagedFiles(files) {
  updateWorkspace((state) => ({ ...state, stagedFiles: files }));
}

/** @param {number | null} index */
export function setDragSourceIndex(index) {
  updateWorkspace((state) => ({ ...state, dragSrcIndex: index }));
}

/** @param {boolean} value */
export function setPointerOverOcrCard(value) {
  updateWorkspace((state) => ({ ...state, isPointerOverOcrCard: value }));
}

/** @param {string} text */
export function setWorkingText(text) {
  updateWorkspace((state) => ({ ...state, workingText: text }));
}

export function clearWorkingText() {
  updateWorkspace((state) => ({ ...state, workingText: '' }));
}

/** @param {string} text */
export function replaceWorkingText(text) {
  updateWorkspace((state) => ({ ...state, workingText: text || '' }));
}

/** @param {string} text */
export function appendToWorkingText(text) {
  updateWorkspace((state) => ({
    ...state,
    workingText: joinTextParts(state.workingText, text || ''),
  }));
}

/** @param {TextResultUpdate} result */
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
    latestTextResult: createEmptyTextResult(),
  }));
}

/** @param {PromotionBehavior} mode */
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

/** @param {AppearanceConfigInput} data */
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

/** @param {TextResultKind} kind
 * @returns {PromotionBehavior}
 */
export function getDefaultPromotionBehavior(kind) {
  const state = getWorkspaceSnapshot();
  if (kind === 'summary') return state.appearanceConfig.summaryPromotionBehavior;
  if (kind === 'ocr') return state.appearanceConfig.ocrPromotionBehavior;
  return 'append';
}

/** @param {SummarizerConfigInput} data */
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

/** @param {SpeechConfigInput} data */
export function applySpeechConfig(data) {
  const provider = data.provider || 'gemini';
  const voice = data.voice || (provider === 'kokoro-heart' ? 'cheery' : 'Kore');
  const model = provider === 'kokoro-heart' ? '' : (data.model || 'gemini-3.1-flash-tts-preview');

  updateWorkspace((state) => ({
    ...state,
    speechConfig: {
      provider,
      voice,
      model,
    },
    selectedSpeechProvider: provider,
    selectedSpeechVoice: voice,
    selectedSpeechModel: model,
  }));
}

/** @param {GroqRateLimits | null} rateLimits */
export function setGroqRateLimits(rateLimits) {
  updateWorkspace((state) => ({
    ...state,
    summarizerConfig: {
      ...state.summarizerConfig,
      groqLimits: rateLimits,
    },
  }));
}

/**
 * @param {string} provider
 * @param {string} model
 */
export function setSelectedSummarizerSelection(provider, model) {
  updateWorkspace((state) => ({
    ...state,
    selectedSummarizerProvider: provider || '',
    selectedSummarizerModel: model || '',
  }));
}

export function setSelectedSpeechSelection(provider, voice, model) {
  updateWorkspace((state) => ({
    ...state,
    selectedSpeechProvider: provider || 'gemini',
    selectedSpeechVoice: voice || (provider === 'kokoro-heart' ? 'cheery' : 'Kore'),
    selectedSpeechModel: provider === 'kokoro-heart' ? '' : (model || ''),
  }));
}

/** @returns {string} */
export function getSelectedSummarizerProvider() {
  return getWorkspaceSnapshot().selectedSummarizerProvider;
}

/** @returns {string} */
export function getSelectedSummarizerModel() {
  const state = getWorkspaceSnapshot();
  return state.selectedSummarizerProvider === 'openrouter' ? '' : state.selectedSummarizerModel;
}

export function getSelectedSpeechProvider() {
  return getWorkspaceSnapshot().selectedSpeechProvider;
}

export function getSelectedSpeechVoice() {
  return getWorkspaceSnapshot().selectedSpeechVoice;
}

export function getSelectedSpeechModel() {
  const state = getWorkspaceSnapshot();
  return state.selectedSpeechProvider === 'kokoro-heart' ? '' : state.selectedSpeechModel;
}
