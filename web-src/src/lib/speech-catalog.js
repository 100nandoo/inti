export const VOICES = [
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

export const DEFAULT_VOICE = 'Kore';

export function getVoiceOptions(filterValue = 'All') {
  return filterValue === 'All'
    ? VOICES
    : VOICES.filter((voice) => voice.gender === filterValue);
}

export async function fetchSpeechModels(apiURL, fetchImpl = fetch) {
  const response = await fetchImpl(apiURL('/api/models'));
  if (!response.ok) {
    throw new Error(response.statusText || 'Could not load speech models');
  }

  return response.json();
}
