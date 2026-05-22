import { providerSelect, sumModelSelect, sumModelWrap } from './dom.js';
import { setStatus } from './feed.js';
import {
  applySummarizerConfig,
  getSelectedSummarizerModel,
  getSelectedSummarizerProvider,
  getWorkspace,
  setSelectedSummarizerSelection,
} from './workspace.js';

const PROVIDERS = [
  { value: 'gemini', label: 'Gemini' },
  { value: 'groq', label: 'Groq' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'mock', label: 'Mock' },
];

async function populateModelSelect(provider, selectedModel = '') {
  await window.IntiSummarizerModels.populateSelect(
    sumModelSelect,
    sumModelWrap,
    provider,
    selectedModel,
  );
}

async function populateProviderSelect(serverProvider = '') {
  const { summarizerConfig } = getWorkspace();
  const keys = summarizerConfig.keys || {};
  const current = getSelectedSummarizerProvider() || summarizerConfig.provider || serverProvider || '';

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

  setSelectedSummarizerSelection(providerSelect.value, summarizerConfig.model || '');
  await populateModelSelect(providerSelect.value, summarizerConfig.model || '');
}

async function saveSummarizerConfigSelection(provider, model) {
  const { summarizerConfig } = getWorkspace();
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
      serverProvider = getWorkspace().summarizerConfig.provider;
    }
  } catch {}

  await populateProviderSelect(serverProvider);
}

export async function initProviders() {
  window.preserveKeyLinks?.();
  await loadSummarizerConfig();

  providerSelect.addEventListener('change', async () => {
    const provider = providerSelect.value;
    await populateModelSelect(provider);
    setSelectedSummarizerSelection(providerSelect.value, providerSelect.value === 'openrouter' ? '' : sumModelSelect.value);

    try {
      await saveSummarizerConfigSelection(provider, getSelectedSummarizerModel());
    } catch (error) {
      setStatus(error.message, 'error');
    }
  });

  sumModelSelect.addEventListener('change', async () => {
    setSelectedSummarizerSelection(providerSelect.value, getSelectedSummarizerModel());
    try {
      await saveSummarizerConfigSelection(providerSelect.value, getSelectedSummarizerModel());
    } catch (error) {
      setStatus(error.message, 'error');
    }
  });
}
