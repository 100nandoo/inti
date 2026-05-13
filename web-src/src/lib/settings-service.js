// @ts-check

/** @typedef {import('./settings-contracts').AppearanceSettingsPayload} AppearanceSettingsPayload */
/** @typedef {import('./settings-contracts').LoadSettingsInput} LoadSettingsInput */
/** @typedef {import('./settings-contracts').SaveSettingsInput} SaveSettingsInput */
/** @typedef {import('./settings-contracts').SettingsLoadResult} SettingsLoadResult */
/** @typedef {import('./settings-contracts').SummarizerSettingsPayload} SummarizerSettingsPayload */

/**
 * @template T
 * @param {Response} response
 * @returns {Promise<T>}
 */
async function readJSON(response) {
  if (response.ok) {
    return /** @type {Promise<T>} */ (response.json());
  }

  const body = await response.json().catch(() => /** @type {{ error: string }} */ ({ error: response.statusText }));
  throw new Error(body.error || response.statusText);
}

/**
 * @param {LoadSettingsInput} input
 * @returns {Promise<SettingsLoadResult>}
 */
export async function loadSettings({ fetchImpl = fetch, apiURL }) {
  const [summarizerResponse, themeResponse] = await Promise.all([
    fetchImpl(apiURL('/api/summarizer-config')),
    fetchImpl(apiURL('/api/theme-config')),
  ]);

  if (!summarizerResponse.ok || !themeResponse.ok) {
    throw new Error('Could not load settings');
  }

  const [summarizerConfig, appearanceConfig] = await Promise.all([
    /** @type {Promise<SummarizerSettingsPayload>} */ (summarizerResponse.json()),
    /** @type {Promise<AppearanceSettingsPayload>} */ (themeResponse.json()),
  ]);

  return { summarizerConfig, appearanceConfig };
}

/**
 * @param {SaveSettingsInput} input
 * @returns {Promise<SettingsLoadResult>}
 */
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

/**
 * @param {LoadSettingsInput} input
 * @returns {Promise<SummarizerSettingsPayload>}
 */
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
