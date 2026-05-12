import {
  appendToWorkingText,
  applyAppearanceConfig,
  applySummarizerConfig,
  clearLastAudioBlob,
  clearLatestTextResult,
  clearWorkingText,
  getDefaultPromotionBehavior,
  getSelectedSummarizerModel,
  getSelectedSummarizerProvider,
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
  applySummarizerConfig,
  clearLastAudioBlob,
  clearLatestTextResult,
  clearWorkingText,
  getDefaultPromotionBehavior,
  getSelectedSummarizerModel,
  getSelectedSummarizerProvider,
  promoteLatestTextResult,
  replaceWorkingText,
  setDragSourceIndex,
  setGroqRateLimits,
  setLastAudioResult,
  setLatestTextResult,
  setPointerOverOcrCard,
  setProcessing,
  setSelectedSummarizerSelection,
  setStagedFiles,
  setWorkingText,
};
