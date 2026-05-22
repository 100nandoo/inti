import { getSummarizerModels } from './summarizer-models.js';

/**
 * @typedef {import('./workspace-contracts').SummarizerConfig} SummarizerConfig
 * @typedef {import('./workspace-contracts').SummarizerKeys} SummarizerKeys
 */

const PROVIDERS = [
  { value: 'gemini', label: 'Gemini' },
  { value: 'groq', label: 'Groq' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'mock', label: 'Mock' },
];

/**
 * @param {Response} response
 * @returns {Promise<any>}
 */
async function parseJSON(response) {
  if (response.ok) return response.json();

  const body = await response.json().catch(() => ({ error: response.statusText }));
  throw new Error(body.error || response.statusText);
}

/**
 * @param {{ provider?: string, model?: string, keys?: Partial<SummarizerKeys>, groqLimits?: any }} data
 * @returns {SummarizerConfig}
 */
function normalizeSummarizerConfig(data = {}) {
  return {
    provider: data.provider || '',
    model: data.model || '',
    keys: {
      gemini: data.keys?.gemini || '',
      groq: data.keys?.groq || '',
      openrouter: data.keys?.openrouter || '',
    },
    groqLimits: data.groqLimits || null,
  };
}

/**
 * @param {SummarizerConfig} summarizerConfig
 */
export function buildMainWorkspaceProviderOptions(summarizerConfig) {
  const keys = summarizerConfig.keys || {};

  return [
    { value: '', label: 'Server default' },
    ...PROVIDERS.filter(({ value }) => value === 'mock' || keys[value]).map(({ value, label }) => ({ value, label })),
  ];
}

/**
 * @param {{
 *   apiURL: (path: string) => string;
 *   fetchImpl?: typeof fetch;
 * }} options
 */
export async function loadMainWorkspaceSummarizerConfig({
  apiURL,
  fetchImpl = fetch,
}) {
  const response = await fetchImpl(apiURL('/api/summarizer-config'));
  return normalizeSummarizerConfig(await parseJSON(response));
}

/**
 * @param {{
 *   apiURL: (path: string) => string;
 *   provider: string;
 *   model: string;
 *   keys: SummarizerKeys;
 *   fetchImpl?: typeof fetch;
 * }} options
 */
export async function saveMainWorkspaceSummarizerConfig({
  apiURL,
  provider,
  model,
  keys,
  fetchImpl = fetch,
}) {
  const response = await fetchImpl(apiURL('/api/summarizer-config'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider,
      model,
      keys,
    }),
  });

  return normalizeSummarizerConfig(await parseJSON(response));
}

/**
 * @param {{
 *   provider: string;
 *   selectedModel?: string;
 *   fetchImpl?: typeof fetch;
 * }} options
 */
export async function loadMainWorkspaceModelOptions({
  provider,
  selectedModel = '',
  fetchImpl = fetch,
}) {
  if (!provider || provider === 'openrouter') {
    return {
      hidden: true,
      options: [],
      selectedModel: '',
    };
  }

  try {
    const models = await getSummarizerModels(provider, fetchImpl);
    const options = Array.isArray(models) ? models : [];
    const hasSelectedModel = options.some((option) => option.value === selectedModel);

    return {
      hidden: options.length === 0,
      options,
      selectedModel: hasSelectedModel ? selectedModel : (options[0]?.value || ''),
    };
  } catch (error) {
    console.error(error);
    return {
      hidden: true,
      options: [],
      selectedModel: '',
    };
  }
}
