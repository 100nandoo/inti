export const GEMINI_VOICES = [
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

export const KOKORO_HEART_VOICES = [
  { name: 'cheery', gender: 'All', characteristic: 'Upstream' },
];

export const DEFAULT_SPEECH_PROVIDER = 'gemini';
export const DEFAULT_GEMINI_VOICE = 'Kore';
export const DEFAULT_KOKORO_HEART_VOICE = 'cheery';

export function getVoiceOptions(provider = DEFAULT_SPEECH_PROVIDER, filterValue = 'All') {
  const voices = provider === 'kokoro-heart' ? KOKORO_HEART_VOICES : GEMINI_VOICES;
  if (provider !== 'gemini' || filterValue === 'All') {
    return voices;
  }
  return voices.filter((voice) => voice.gender === filterValue);
}

export async function fetchSpeechVoices(apiURL, provider, fetchImpl = fetch) {
  const response = await fetchImpl(apiURL(`/api/voices?provider=${encodeURIComponent(provider)}`));
  if (!response.ok) {
    throw new Error(response.statusText || 'Could not load speech voices');
  }

  return response.json();
}

export async function fetchSpeechModels(apiURL, provider, fetchImpl = fetch) {
  const response = await fetchImpl(apiURL(`/api/models?provider=${encodeURIComponent(provider)}`));
  if (!response.ok) {
    throw new Error(response.statusText || 'Could not load speech models');
  }

  return response.json();
}
