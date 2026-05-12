import { genderFilter, modelSelect, voiceSelect } from './dom.js';
import {
  DEFAULT_VOICE,
  fetchSpeechModels,
  getVoiceOptions,
} from '../../web-src/src/lib/speech-catalog.js';

function populateVoices(filterValue = 'All', keepSelection = false) {
  const previous = keepSelection ? voiceSelect.value : DEFAULT_VOICE;
  const filteredVoices = getVoiceOptions(filterValue);

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

async function loadModels() {
  try {
    const { models, default: defaultModel } = await fetchSpeechModels(window.apiURL);
    modelSelect.innerHTML = '';
    models.forEach((model) => {
      const option = document.createElement('option');
      option.value = model;
      option.textContent = model;
      if (model === defaultModel) option.selected = true;
      modelSelect.appendChild(option);
    });
  } catch {}
}

export function initVoices() {
  populateVoices();
  loadModels();

  genderFilter.addEventListener('change', () => {
    populateVoices(genderFilter.value, true);
  });
}
