import { truncate } from '../../../web/js/text.js';
import { executeSummaryRequest } from './summary-flow.js';

/**
 * @typedef {import('./workspace-contracts').SummaryRequestInput} SummaryRequestInput
 */

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
  const {
    summaryResult,
    provider: resolvedProvider,
    model: resolvedModel,
    rateLimits,
  } = await executeSummaryRequest({
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
