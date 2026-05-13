import { get, writable } from 'svelte/store';

/**
 * @typedef {'summary' | 'ocr' | ''} TextResultKind
 * @typedef {'plain' | 'markdown'} TextResultFormat
 * @typedef {'append' | 'replace'} PromotionBehavior
 * @typedef {'md' | 'txt'} SummaryDownloadFormat
 *
 * @typedef {object} TextResult
 * @property {TextResultKind} kind
 * @property {string} title
 * @property {TextResultFormat} format
 * @property {string} rawText
 * @property {string} plainText
 *
 * @typedef {object} TextResultUpdate
 * @property {TextResultKind} [kind]
 * @property {string} [title]
 * @property {TextResultFormat} [format]
 * @property {string} [rawText]
 * @property {string} [plainText]
 *
 * @typedef {object} AppearanceConfig
 * @property {SummaryDownloadFormat} summaryDownloadFormat
 * @property {PromotionBehavior} ocrPromotionBehavior
 * @property {PromotionBehavior} summaryPromotionBehavior
 *
 * @typedef {object} AppearanceConfigInput
 * @property {string} [summaryDownloadFormat]
 * @property {string} [ocrPromotionBehavior]
 * @property {string} [summaryPromotionBehavior]
 *
 * @typedef {object} SummarizerKeys
 * @property {string} gemini
 * @property {string} groq
 * @property {string} openrouter
 *
 * @typedef {object} GroqRateLimits
 * @property {string} [resetRequests]
 * @property {string} [resetTokens]
 * @property {number} [capturedAt]
 * @property {number} [resetRequestsAt]
 * @property {number} [resetTokensAt]
 *
 * @typedef {object} SummarizerConfig
 * @property {string} provider
 * @property {string} model
 * @property {SummarizerKeys} keys
 * @property {GroqRateLimits | null} groqLimits
 *
 * @typedef {object} SummarizerConfigInput
 * @property {string} [provider]
 * @property {string} [model]
 * @property {{ gemini?: string, groq?: string, openrouter?: string }} [keys]
 * @property {GroqRateLimits | null} [groqLimits]
 *
 * @typedef {object} WorkspaceState
 * @property {boolean} processing
 * @property {Blob | null} lastAudioBlob
 * @property {string} lastAudioSourceText
 * @property {string} lastAudioSourceLabel
 * @property {File[]} stagedFiles
 * @property {number | null} dragSrcIndex
 * @property {boolean} isPointerOverOcrCard
 * @property {string} workingText
 * @property {TextResult} latestTextResult
 * @property {AppearanceConfig} appearanceConfig
 * @property {SummarizerConfig} summarizerConfig
 * @property {string} selectedSummarizerProvider
 * @property {string} selectedSummarizerModel
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
    selectedSummarizerProvider: '',
    selectedSummarizerModel: '',
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
 */
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

/** @returns {string} */
export function getSelectedSummarizerProvider() {
  return getWorkspaceSnapshot().selectedSummarizerProvider;
}

/** @returns {string} */
export function getSelectedSummarizerModel() {
  const state = getWorkspaceSnapshot();
  return state.selectedSummarizerProvider === 'openrouter' ? '' : state.selectedSummarizerModel;
}
