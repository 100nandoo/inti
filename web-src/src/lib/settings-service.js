// @ts-check

/** @typedef {import('./settings-contracts').AppearanceSettingsPayload} AppearanceSettingsPayload */
/** @typedef {import('./settings-contracts').AppearanceSettingsInput} AppearanceSettingsInput */
/** @typedef {import('./settings-contracts').LoadSettingsInput} LoadSettingsInput */
/** @typedef {import('./settings-contracts').SaveSettingsInput} SaveSettingsInput */
/** @typedef {import('./settings-contracts').SettingsLoadResult} SettingsLoadResult */
/** @typedef {import('./settings-contracts').SummarizerSettingsPayload} SummarizerSettingsPayload */
import { loadRuntimeConfig, saveRuntimeConfig } from './runtime-settings-transport.js';

/**
 * Keep the frontend's shared contract replace-only while accepting older backend payloads.
 *
 * @param {AppearanceSettingsInput} appearanceConfig
 * @returns {AppearanceSettingsPayload}
 */
function normalizeAppearanceConfig(appearanceConfig) {
  return {
    theme: appearanceConfig.theme === 'light' ? 'light' : 'dark',
    summaryDownloadFormat: appearanceConfig.summaryDownloadFormat === 'txt' ? 'txt' : 'md',
    ocrPromotionBehavior: 'replace',
    summaryPromotionBehavior: 'replace',
  };
}

/**
 * @param {LoadSettingsInput} input
 * @returns {Promise<SettingsLoadResult>}
 */
export async function loadSettings({ fetchImpl = fetch, apiURL }) {
  const [summarizerConfig, appearanceConfig] = await Promise.all([
    loadRuntimeConfig({
      apiURL,
      fetchImpl,
      path: '/api/summarizer-config',
      errorMessage: 'Could not load settings',
    }),
    loadRuntimeConfig({
      apiURL,
      fetchImpl,
      path: '/api/theme-config',
      errorMessage: 'Could not load settings',
    }),
  ]);

  return { summarizerConfig, appearanceConfig: normalizeAppearanceConfig(appearanceConfig) };
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
  const [summarizerConfig, nextAppearanceConfig] = await Promise.all([
    saveRuntimeConfig({
      apiURL,
      fetchImpl,
      path: '/api/summarizer-config',
      payload: { provider, model, keys },
      errorMessage: 'Could not save settings',
    }),
    saveRuntimeConfig({
      apiURL,
      fetchImpl,
      path: '/api/theme-config',
      payload: appearanceConfig,
      errorMessage: 'Could not save settings',
    }),
  ]);

  return { summarizerConfig, appearanceConfig: normalizeAppearanceConfig(nextAppearanceConfig) };
}

/**
 * @param {LoadSettingsInput} input
 * @returns {Promise<SummarizerSettingsPayload>}
 */
export async function clearSummarizerSettings({ fetchImpl = fetch, apiURL }) {
  return saveRuntimeConfig({
    apiURL,
    fetchImpl,
    path: '/api/summarizer-config',
    payload: {
      provider: '',
      model: '',
      keys: { gemini: '', groq: '', openrouter: '' },
    },
    errorMessage: 'Could not clear provider settings',
  });
}
