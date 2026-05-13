async function readJSON(response) {
  if (response.ok) {
    return response.json();
  }

  const body = await response.json().catch(() => ({ error: response.statusText }));
  throw new Error(body.error || response.statusText);
}

export async function loadSettings({ fetchImpl = fetch, apiURL }) {
  const [summarizerResponse, themeResponse] = await Promise.all([
    fetchImpl(apiURL('/api/summarizer-config')),
    fetchImpl(apiURL('/api/theme-config')),
  ]);

  if (!summarizerResponse.ok || !themeResponse.ok) {
    throw new Error('Could not load settings');
  }

  const [summarizerConfig, appearanceConfig] = await Promise.all([
    summarizerResponse.json(),
    themeResponse.json(),
  ]);

  return { summarizerConfig, appearanceConfig };
}

export async function saveSettings({
  fetchImpl = fetch,
  apiURL,
  provider,
  model,
  keys,
  appearanceConfig,
}) {
  const [summarizerResponse, themeResponse] = await Promise.all([
    fetchImpl(apiURL('/api/summarizer-config'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, model, keys }),
    }),
    fetchImpl(apiURL('/api/theme-config'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appearanceConfig),
    }),
  ]);

  const [summarizerConfig, nextAppearanceConfig] = await Promise.all([
    readJSON(summarizerResponse),
    readJSON(themeResponse),
  ]);

  return { summarizerConfig, appearanceConfig: nextAppearanceConfig };
}

export async function clearSummarizerSettings({ fetchImpl = fetch, apiURL }) {
  const response = await fetchImpl(apiURL('/api/summarizer-config'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: '',
      model: '',
      keys: { gemini: '', groq: '', openrouter: '' },
    }),
  });

  return readJSON(response);
}
