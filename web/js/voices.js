import { genderFilter, modelSelect, voiceSelect } from './dom.js';

const VOICES = [
  { name: 'Zephyr', gender: 'Female', characteristic: 'Bright' },
  { name: 'Puck', gender: 'Male', characteristic: 'Upbeat' },
  { name: 'Charon', gender: 'Male', characteristic: 'Informative' },
  { name: 'Kore', gender: 'Female', characteristic: 'Firm' },
  { name: 'Fenrir', gender: 'Male', characteristic: 'Excitable' },
  { name: 'Leda', gender: 'Female', characteristic: 'Youthful' },
  { name: 'Orus', gender: 'Male', characteristic: 'Firm' },
  { name: 'Aoede', gender: 'Female', characteristic: 'Breezy' },
  { name: 'Callirrhoe', gender: 'Female', characteristic: 'Easy-going' },
  { name: 'Autonoe', gender: 'Female', characteristic: 'Bright' },
  { name: 'Enceladus', gender: 'Male', characteristic: 'Breathy' },
  { name: 'Iapetus', gender: 'Male', characteristic: 'Clear' },
  { name: 'Umbriel', gender: 'Male', characteristic: 'Easy-going' },
  { name: 'Algieba', gender: 'Male', characteristic: 'Smooth' },
  { name: 'Despina', gender: 'Female', characteristic: 'Smooth' },
  { name: 'Erinome', gender: 'Female', characteristic: 'Clear' },
  { name: 'Algenib', gender: 'Male', characteristic: 'Gravelly' },
  { name: 'Rasalgethi', gender: 'Male', characteristic: 'Informative' },
  { name: 'Laomedeia', gender: 'Female', characteristic: 'Upbeat' },
  { name: 'Achernar', gender: 'Female', characteristic: 'Soft' },
  { name: 'Alnilam', gender: 'Male', characteristic: 'Firm' },
  { name: 'Schedar', gender: 'Male', characteristic: 'Even' },
  { name: 'Gacrux', gender: 'Female', characteristic: 'Mature' },
  { name: 'Pulcherrima', gender: 'Male', characteristic: 'Forward' },
  { name: 'Achird', gender: 'Male', characteristic: 'Friendly' },
  { name: 'Zubenelgenubi', gender: 'Male', characteristic: 'Casual' },
  { name: 'Vindemiatrix', gender: 'Female', characteristic: 'Gentle' },
  { name: 'Sadachbia', gender: 'Male', characteristic: 'Lively' },
  { name: 'Sadaltager', gender: 'Male', characteristic: 'Knowledgeable' },
  { name: 'Sulafat', gender: 'Female', characteristic: 'Warm' },
];

const DEFAULT_VOICE = 'Kore';

function populateVoices(filterValue = 'All', keepSelection = false) {
  const previous = keepSelection ? voiceSelect.value : DEFAULT_VOICE;
  const filteredVoices = filterValue === 'All'
    ? VOICES
    : VOICES.filter((voice) => voice.gender === filterValue);

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
    const response = await fetch(window.apiURL('/api/models'));
    if (!response.ok) return;

    const { models, default: defaultModel } = await response.json();
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
