import { renderMarkdown } from '../../../web/js/markdown.js';

/**
 * @typedef {import('./workspace-contracts').GroqRateLimitPayload} GroqRateLimitPayload
 * @typedef {import('./workspace-contracts').GroqRateLimits} GroqRateLimits
 * @typedef {import('./workspace-contracts').SummaryFlowResult} SummaryFlowResult
 * @typedef {import('./workspace-contracts').SummaryRequestInput} SummaryRequestInput
 * @typedef {import('./workspace-contracts').SummaryResponsePayload} SummaryResponsePayload
 */

function parseGroqDuration(value) {
  if (!value) return 0;

  let milliseconds = 0;
  const hours = value.match(/(\d+(?:\.\d+)?)h/);
  const minutes = value.match(/(\d+(?:\.\d+)?)m(?!s)/);
  const seconds = value.match(/(\d+(?:\.\d+)?)s/);

  if (hours) milliseconds += parseFloat(hours[1]) * 3600000;
  if (minutes) milliseconds += parseFloat(minutes[1]) * 60000;
  if (seconds) milliseconds += parseFloat(seconds[1]) * 1000;

  return milliseconds;
}

/**
 * @param {GroqRateLimitPayload | null | undefined} rateLimits
 * @param {number} capturedAt
 * @returns {GroqRateLimits | null}
 */
function normalizeGroqRateLimits(rateLimits, capturedAt) {
  if (!rateLimits) return null;

  return {
    ...rateLimits,
    capturedAt,
    resetRequestsAt: capturedAt + parseGroqDuration(rateLimits.resetRequests),
    resetTokensAt: capturedAt + parseGroqDuration(rateLimits.resetTokens),
  };
}

/**
 * @param {SummaryResponsePayload} payload
 * @param {string} requestedProvider
 * @param {string} requestedModel
 */
function normalizeSummaryPayload(payload, requestedProvider, requestedModel) {
  const provider = payload.provider || requestedProvider || '';
  const model = provider === 'openrouter'
    ? ''
    : (payload.model || requestedModel || '');
  return {
    summary: payload.summary || '',
    provider,
    model,
    rateLimits: provider === 'groq' ? payload.rateLimits || null : null,
  };
}

/** @param {SummaryRequestInput} input
 * @returns {Promise<SummaryFlowResult>}
 */
export async function executeSummaryRequest({
  apiURL,
  fetchImpl = fetch,
  text,
  provider,
  model,
  now = Date.now,
}) {
  const response = await fetchImpl(apiURL('/api/summarize'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      instruction: '',
      provider,
      model,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(body.error || response.statusText);
  }

  /** @type {SummaryResponsePayload} */
  const payload = await response.json();
  const normalized = normalizeSummaryPayload(payload, provider, model);
  const rendered = document.createElement('div');
  rendered.innerHTML = renderMarkdown(normalized.summary);
  const capturedAt = now();

  return {
    summaryResult: {
      kind: 'summary',
      title: 'Summary Result',
      format: 'markdown',
      rawText: normalized.summary,
      plainText: rendered.innerText.trim(),
    },
    model: normalized.model,
    provider: normalized.provider,
    rateLimits: normalizeGroqRateLimits(normalized.rateLimits, capturedAt),
  };
}
