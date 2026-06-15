import { buildResultSurfaceViewModel } from './result-surface.js';

/**
 * @typedef {import('./workspace-contracts').WorkspaceState} WorkspaceState
 */

/**
 * @param {WorkspaceState} workspace
 */
export function buildMainWorkspaceViewModel(workspace) {
  const isOcrMode = workspace.inputMode === 'ocr';
  const isWorkingTextMode = workspace.inputMode === 'working-text';
  const isSummaryMode = isWorkingTextMode && workspace.workingTextRunMode === 'summary';
  const isVoiceMode = isWorkingTextMode && workspace.workingTextRunMode === 'voice';
  const resultViewModel = buildResultSurfaceViewModel(workspace);

  return {
    isOcrMode,
    isWorkingTextMode,
    isSummaryMode,
    isVoiceMode,
    actionTabs: {
      ocr: { active: isOcrMode, disabled: !isOcrMode },
      summary: { active: isSummaryMode, disabled: isOcrMode },
      voice: { active: isVoiceMode, disabled: isOcrMode },
    },
    hasWorkingText: workspace.workingText.trim().length > 0,
    workingTextCharacterCount: workspace.workingText.length,
    speechInputCharacterCount: workspace.workingText.length,
    textResultCharacterCount: resultViewModel.textCharacterCount,
    resultViewModel,
  };
}

/**
 * @param {string} kind
 */
export function buildPromotionStatusMessage(kind) {
  return `${kind === 'summary' ? 'Summary' : 'OCR result'} replaced working text.`;
}
