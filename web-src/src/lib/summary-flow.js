import { renderMarkdown } from '../../../web/js/markdown.js';

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

  const payload = await response.json();
  const rendered = document.createElement('div');
  rendered.innerHTML = renderMarkdown(payload.summary || '');
  const capturedAt = now();

  return {
    summaryResult: {
      kind: 'summary',
      title: 'Summary Result',
      format: 'markdown',
      rawText: payload.summary || '',
      plainText: rendered.innerText.trim(),
    },
    model: payload.model || '',
    provider: payload.provider || '',
    rateLimits: payload.rateLimits && payload.provider === 'groq'
      ? {
          ...payload.rateLimits,
          capturedAt,
          resetRequestsAt: capturedAt + parseGroqDuration(payload.rateLimits.resetRequests),
          resetTokensAt: capturedAt + parseGroqDuration(payload.rateLimits.resetTokens),
        }
      : null,
  };
}
