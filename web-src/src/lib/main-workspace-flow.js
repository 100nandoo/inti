import { truncate } from '../../../web/js/text.js';
import { buildResultSurfaceViewModel } from './result-surface.js';
import { executeSummaryRequest } from './summary-flow.js';

/**
 * @typedef {import('./workspace-contracts').SummaryRequestInput} SummaryRequestInput
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

  return {
    isOcrMode,
    isWorkingTextMode,
    isSummaryMode,
    isVoiceMode,
    hasWorkingText: workspace.workingText.trim().length > 0,
    workingTextCharacterCount: workspace.workingText.length,
    speechInputCharacterCount: workspace.workingText.length,
    textResultCharacterCount: (workspace.latestTextResult.plainText || workspace.latestTextResult.rawText).trim().length,
    resultViewModel: buildResultSurfaceViewModel(workspace),
  };
}

/**
 * @param {SummaryRequestInput & { performanceNow?: () => number }} input
 */
export async function executeMainWorkspaceSummary({
  apiURL,
  fetchImpl = fetch,
  text,
  provider,
  model,
  now = Date.now,
  performanceNow = () => performance.now(),
}) {
  const normalizedText = text.trim();
  if (!normalizedText) {
    throw new Error('Working text is empty.');
  }

  const startedAt = performanceNow();
  const wordCount = normalizedText.split(/\s+/).length;
  const { summaryResult, provider: resolvedProvider, model: resolvedModel, rateLimits } = await executeSummaryRequest({
    apiURL,
    fetchImpl,
    text: normalizedText,
    provider,
    model,
    now,
  });
  const duration = ((performanceNow() - startedAt) / 1000).toFixed(1);
  const modelTag = resolvedModel ? ` · ${resolvedModel}` : (resolvedProvider ? ` · ${resolvedProvider}` : '');

  return {
    summaryResult,
    rateLimits,
    feedLabel: `"${truncate(normalizedText, 60)}"`,
    feedMeta: `${wordCount} words → summary · ${duration}s${modelTag}`,
  };
}

/**
 * @param {string} kind
 */
export function buildPromotionStatusMessage(kind) {
  return `${kind === 'summary' ? 'Summary' : 'OCR result'} replaced working text.`;
}
