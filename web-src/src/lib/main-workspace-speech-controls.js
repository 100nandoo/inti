import {
  DEFAULT_GEMINI_VOICE,
  DEFAULT_KOKORO_HEART_VOICE,
  DEFAULT_SPEECH_PROVIDER,
  fetchSpeechModels,
  fetchSpeechVoices,
  getVoiceOptions,
} from './speech-catalog.js';

export const MAIN_WORKSPACE_SPEECH_PROVIDER_OPTIONS = [
  { value: 'gemini', label: 'Gemini' },
  { value: 'kokoro-heart', label: 'kokoro heart' },
];

export function currentDefaultSpeechVoice(provider = DEFAULT_SPEECH_PROVIDER) {
  return provider === 'kokoro-heart' ? DEFAULT_KOKORO_HEART_VOICE : DEFAULT_GEMINI_VOICE;
}

function normalizeProvider(provider) {
  return provider === 'kokoro-heart' ? 'kokoro-heart' : DEFAULT_SPEECH_PROVIDER;
}

function normalizeGenderFilter(provider, filterValue) {
  if (provider !== 'gemini') return 'All';
  return filterValue === 'Female' || filterValue === 'Male' ? filterValue : 'All';
}

function buildVoiceOptions(provider, selectedVoice, filterValue) {
  const voices = getVoiceOptions(provider, filterValue);
  const resolvedVoice = voices.some((voice) => voice.name === selectedVoice)
    ? selectedVoice
    : (voices[0]?.name || currentDefaultSpeechVoice(provider));

  return {
    selectedVoice: resolvedVoice,
    options: voices.map((voice) => ({
      value: voice.name,
      label: `${voice.name} — ${voice.characteristic}`,
    })),
  };
}

export async function loadMainWorkspaceSpeechConfig({ apiURL, fetchImpl = fetch }) {
  const response = await fetchImpl(apiURL('/api/speech-config'));
  if (!response.ok) {
    throw new Error('Could not load speech settings.');
  }
  return response.json();
}

export async function saveMainWorkspaceSpeechConfig({
  apiURL,
  provider,
  voice,
  model,
  fetchImpl = fetch,
}) {
  const normalizedProvider = normalizeProvider(provider);
  const response = await fetchImpl(apiURL('/api/speech-config'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: normalizedProvider,
      voice,
      model: normalizedProvider === 'kokoro-heart' ? '' : model,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(body.error || response.statusText);
  }

  return response.json();
}

export async function loadMainWorkspaceSpeechControlState({
  apiURL,
  provider,
  selectedVoice = '',
  selectedModel = '',
  genderFilter = 'All',
  fetchImpl = fetch,
}) {
  const normalizedProvider = normalizeProvider(provider);
  const normalizedFilter = normalizeGenderFilter(normalizedProvider, genderFilter);

  let models = [];
  let defaultModel = '';

  try {
    const modelPayload = await fetchSpeechModels(apiURL, normalizedProvider, fetchImpl);
    models = Array.isArray(modelPayload.models) ? modelPayload.models : [];
    defaultModel = typeof modelPayload.default === 'string' ? modelPayload.default : '';
  } catch {
    models = [];
    defaultModel = '';
  }

  await fetchSpeechVoices(apiURL, normalizedProvider, fetchImpl);

  const { options: voiceOptions, selectedVoice: resolvedVoice } = buildVoiceOptions(
    normalizedProvider,
    selectedVoice,
    normalizedFilter,
  );
  const selectedResolvedModel = models.includes(selectedModel)
    ? selectedModel
    : (selectedModel || defaultModel || models[0] || '');

  return {
    provider: normalizedProvider,
    genderFilter: normalizedFilter,
    voiceOptions,
    selectedVoice: resolvedVoice,
    modelOptions: models.map((modelName) => ({ value: modelName, label: modelName })),
    selectedModel: normalizedProvider === 'kokoro-heart' ? '' : selectedResolvedModel,
    modelDisabled: models.length === 0,
    genderFilterDisabled: normalizedProvider !== 'gemini',
  };
}
