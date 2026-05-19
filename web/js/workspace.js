import {
  appendToWorkingText,
  applyAppearanceConfig,
  applySpeechConfig,
  applySummarizerConfig,
  clearLastAudioBlob,
  clearLatestTextResult,
  clearWorkingText,
  getDefaultPromotionBehavior,
  setInputMode,
  getSelectedSummarizerModel,
  getSelectedSummarizerProvider,
  getSelectedSpeechModel,
  getSelectedSpeechProvider,
  getSelectedSpeechVoice,
  getWorkspaceSnapshot,
  promoteLatestTextResult,
  replaceWorkingText,
  setDragSourceIndex,
  setGroqRateLimits,
  setLastAudioResult,
  setLatestTextResult,
  setPointerOverOcrCard,
  setProcessing,
  setSelectedSummarizerSelection,
  setSelectedSpeechSelection,
  setStagedFiles,
  setWorkingText,
  workspaceStore,
} from '../../web-src/src/lib/workspace-state.js';

export function getWorkspace() {
  return getWorkspaceSnapshot();
}

export function subscribeWorkspace(listener, { immediate = true } = {}) {
  let firstRun = true;
  return workspaceStore.subscribe((state) => {
    if (!immediate && firstRun) {
      firstRun = false;
      return;
    }
    firstRun = false;
    listener(state);
  });
}

export {
  appendToWorkingText,
  applyAppearanceConfig,
  applySpeechConfig,
  applySummarizerConfig,
  clearLastAudioBlob,
  clearLatestTextResult,
  clearWorkingText,
  getDefaultPromotionBehavior,
  setInputMode,
  getSelectedSummarizerModel,
  getSelectedSummarizerProvider,
  getSelectedSpeechModel,
  getSelectedSpeechProvider,
  getSelectedSpeechVoice,
  promoteLatestTextResult,
  replaceWorkingText,
  setDragSourceIndex,
  setGroqRateLimits,
  setLastAudioResult,
  setLatestTextResult,
  setPointerOverOcrCard,
  setProcessing,
  setSelectedSummarizerSelection,
  setSelectedSpeechSelection,
  setStagedFiles,
  setWorkingText,
};
