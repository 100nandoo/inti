import { genderFilter, modelSelect, speechProviderSelect, voiceSelect } from './dom.js';
import { setStatus } from './feed.js';
import {
  applySpeechConfig,
  getSelectedSpeechModel,
  getSelectedSpeechProvider,
  getSelectedSpeechVoice,
  getWorkspace,
  setSelectedSpeechSelection,
} from './workspace.js';
import {
  DEFAULT_GEMINI_VOICE,
  DEFAULT_KOKORO_HEART_VOICE,
  DEFAULT_SPEECH_PROVIDER,
  fetchSpeechModels,
  fetchSpeechVoices,
  getVoiceOptions,
} from '../../web-src/src/lib/speech-catalog.js';

let listenersBound = false;

function currentDefaultVoice(provider) {
  return provider === 'kokoro-heart' ? DEFAULT_KOKORO_HEART_VOICE : DEFAULT_GEMINI_VOICE;
}

function syncGenderFilter(provider) {
  const isGemini = provider === 'gemini';
  genderFilter.disabled = !isGemini;
  if (!isGemini) {
    genderFilter.value = 'All';
  }
}

function populateVoices(provider, selectedVoice = '', filterValue = 'All') {
  const previous = selectedVoice || getSelectedSpeechVoice() || currentDefaultVoice(provider);
  const filteredVoices = getVoiceOptions(provider, filterValue);

  voiceSelect.innerHTML = '';
  filteredVoices.forEach((voice) => {
    const option = document.createElement('option');
    option.value = voice.name;
    option.textContent = `${voice.name} — ${voice.characteristic}`;
    if (voice.name === previous) option.selected = true;
    voiceSelect.appendChild(option);
  });

  if (!filteredVoices.find((voice) => voice.name === previous) && filteredVoices.length > 0) {
    voiceSelect.selectedIndex = 0;
  }
}

async function loadVoices(provider, selectedVoice = '') {
  await fetchSpeechVoices(window.apiURL, provider);
  populateVoices(provider, selectedVoice, genderFilter.value);
}

async function loadModels(provider, selectedModel = '') {
  try {
    const { models, default: defaultModel } = await fetchSpeechModels(window.apiURL, provider);
    modelSelect.innerHTML = '';
    if (models.length === 0) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No model selection';
      option.selected = true;
      modelSelect.appendChild(option);
      modelSelect.disabled = true;
      return;
    }

    modelSelect.disabled = false;
    models.forEach((model) => {
      const option = document.createElement('option');
      option.value = model;
      option.textContent = model;
      if (model === (selectedModel || defaultModel)) option.selected = true;
      modelSelect.appendChild(option);
    });
  } catch {}
}

async function saveSpeechConfigSelection(provider, voice, model) {
  const response = await fetch(window.apiURL('/api/speech-config'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider,
      voice,
      model: provider === 'kokoro-heart' ? '' : model,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(body.error || response.statusText);
  }

  applySpeechConfig(await response.json());
}

async function loadSpeechConfig() {
  try {
    const response = await fetch(window.apiURL('/api/speech-config'));
    if (!response.ok) return;
    const data = await response.json();
    applySpeechConfig(data);
  } catch {}
}

async function syncSpeechControls(provider, { selectedVoice = '', selectedModel = '' } = {}) {
  speechProviderSelect.value = provider;
  syncGenderFilter(provider);
  await loadModels(provider, selectedModel);
  await loadVoices(provider, selectedVoice);
  setSelectedSpeechSelection(
    provider,
    voiceSelect.value || currentDefaultVoice(provider),
    provider === 'kokoro-heart' ? '' : modelSelect.value,
  );
}

export async function initVoices() {
  await loadSpeechConfig();
  const { speechConfig } = getWorkspace();
  const provider = getSelectedSpeechProvider() || speechConfig.provider || DEFAULT_SPEECH_PROVIDER;
  await syncSpeechControls(provider, {
    selectedVoice: speechConfig.voice,
    selectedModel: speechConfig.model,
  });

  if (listenersBound) return;
  listenersBound = true;

  speechProviderSelect.addEventListener('change', async () => {
    const providerValue = speechProviderSelect.value || DEFAULT_SPEECH_PROVIDER;
    await syncSpeechControls(providerValue, {
      selectedVoice: currentDefaultVoice(providerValue),
      selectedModel: '',
    });

    try {
      await saveSpeechConfigSelection(providerValue, voiceSelect.value, modelSelect.value);
    } catch (error) {
      setStatus(error.message, 'error');
    }
  });

  genderFilter.addEventListener('change', () => {
    const providerValue = speechProviderSelect.value || DEFAULT_SPEECH_PROVIDER;
    populateVoices(providerValue, voiceSelect.value, genderFilter.value);
    setSelectedSpeechSelection(providerValue, voiceSelect.value, getSelectedSpeechModel());
  });

  voiceSelect.addEventListener('change', async () => {
    const providerValue = speechProviderSelect.value || DEFAULT_SPEECH_PROVIDER;
    setSelectedSpeechSelection(providerValue, voiceSelect.value, getSelectedSpeechModel());
    try {
      await saveSpeechConfigSelection(providerValue, voiceSelect.value, getSelectedSpeechModel());
    } catch (error) {
      setStatus(error.message, 'error');
    }
  });

  modelSelect.addEventListener('change', async () => {
    const providerValue = speechProviderSelect.value || DEFAULT_SPEECH_PROVIDER;
    setSelectedSpeechSelection(providerValue, getSelectedSpeechVoice(), modelSelect.value);
    try {
      await saveSpeechConfigSelection(providerValue, getSelectedSpeechVoice(), modelSelect.value);
    } catch (error) {
      setStatus(error.message, 'error');
    }
  });
}
