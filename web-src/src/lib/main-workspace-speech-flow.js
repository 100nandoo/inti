import { truncate } from '../../../web/js/text.js';
import {
  decodeAndPlayAudio,
  downloadAudioSnapshot,
  requestSpeechSynthesis,
} from './speech-flow.js';

function formatSpeechProvider(provider) {
  return provider === 'kokoro-heart' ? 'kokoro heart' : (provider || 'speech');
}

export async function executeMainWorkspaceSpeech({
  apiURL,
  text,
  provider,
  voice,
  model,
  fetchImpl = fetch,
  performanceNow = () => performance.now(),
}) {
  const normalizedText = text.trim();
  if (!normalizedText) {
    throw new Error('Working text is empty.');
  }

  const startedAt = performanceNow();
  const wordCount = normalizedText.split(/\s+/).length;
  const result = await requestSpeechSynthesis({
    apiURL,
    fetchImpl,
    provider,
    text: normalizedText,
    voice,
    model,
  });
  const duration = ((performanceNow() - startedAt) / 1000).toFixed(1);
  const resolvedConfigLabel = [
    formatSpeechProvider(result.provider),
    result.model,
    result.voice,
  ].filter(Boolean).join(' · ');

  return {
    ...result,
    sourceText: normalizedText,
    feedLabel: `"${truncate(normalizedText, 60)}"`,
    feedMeta: `${wordCount} words · ${duration}s · ${resolvedConfigLabel} · ${(result.bytes.length / 1024).toFixed(1)} KB`,
  };
}

export async function playMainWorkspaceAudio(blob, audioContextFactory) {
  if (!blob) return;
  await decodeAndPlayAudio(blob, audioContextFactory);
}

export function downloadMainWorkspaceAudioSnapshot(blob, sourceText) {
  return downloadAudioSnapshot(blob, sourceText);
}
