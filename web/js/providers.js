import { providerSelect, sumModelSelect, sumModelWrap } from './dom.js';
import { setStatus } from './feed.js';
import { applySummarizerConfig, getState } from './state.js';

const PROVIDERS = [
  { value: 'gemini', label: 'Gemini' },
  { value: 'groq', label: 'Groq' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'mock', label: 'Mock' },
];

export function getSelectedSummarizerProvider() {
  return providerSelect.value;
}

export function getSelectedSummarizerModel() {
  return providerSelect.value === 'openrouter' ? '' : sumModelSelect.value;
}

async function populateModelSelect(provider, selectedModel = '') {
  await window.IntiSummarizerModels.populateSelect(
    sumModelSelect,
    sumModelWrap,
    provider,
    selectedModel,
  );
}

async function populateProviderSelect(serverProvider = '') {
  const { summarizerConfig } = getState();
  const keys = summarizerConfig.keys || {};
  const current = providerSelect.value || summarizerConfig.provider || serverProvider || '';

  providerSelect.innerHTML = '<option value="">Server default</option>';
  PROVIDERS.forEach(({ value, label }) => {
    if (value === 'mock' || keys[value]) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      providerSelect.appendChild(option);
    }
  });

  if (current && [...providerSelect.options].some((option) => option.value === current)) {
    providerSelect.value = current;
  }

  await populateModelSelect(providerSelect.value, summarizerConfig.model || '');
}

async function saveSummarizerConfigSelection(provider, model) {
  const { summarizerConfig } = getState();
  const response = await fetch(window.apiURL('/api/summarizer-config'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider,
      model,
      keys: summarizerConfig.keys,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(body.error || response.statusText);
  }

  applySummarizerConfig(await response.json());
}

async function loadSummarizerConfig() {
  let serverProvider = '';

  try {
    const response = await fetch(window.apiURL('/api/summarizer-config'));
    if (response.ok) {
      const data = await response.json();
      applySummarizerConfig(data);
      serverProvider = getState().summarizerConfig.provider;
    }
  } catch {}

  await populateProviderSelect(serverProvider);
}

export async function initProviders() {
  window.preserveKeyLinks();
  await loadSummarizerConfig();

  providerSelect.addEventListener('change', async () => {
    const provider = providerSelect.value;
    await populateModelSelect(provider);

    try {
      await saveSummarizerConfigSelection(provider, getSelectedSummarizerModel());
    } catch (error) {
      setStatus(error.message, 'error');
    }
  });

  sumModelSelect.addEventListener('change', async () => {
    try {
      await saveSummarizerConfigSelection(providerSelect.value, getSelectedSummarizerModel());
    } catch (error) {
      setStatus(error.message, 'error');
    }
  });
}
