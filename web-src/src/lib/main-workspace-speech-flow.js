import { truncate } from './text.js';
import {
  decodeAndPlayAudio,
  downloadAudioSnapshot,
  requestSpeechSynthesis,
} from './speech-flow.js';

/**
 * @typedef {import('./workspace-contracts').SpeechAudioSnapshot} SpeechAudioSnapshot
 * @typedef {import('./workspace-contracts').SpeechSynthesisResult} SpeechSynthesisResult
 * @typedef {import('./workspace-contracts').MainWorkspaceSpeechExecutionResult} MainWorkspaceSpeechExecutionResult
 */

function formatSpeechProvider(provider) {
  return provider === 'kokoro-heart' ? 'kokoro heart' : (provider || 'speech');
}

/**
 * @param {SpeechSynthesisResult} result
 * @param {string} sourceText
 * @param {string} sourceLabel
 * @returns {SpeechAudioSnapshot}
 */
function createAudioSnapshot(result, sourceText, sourceLabel) {
  return {
    blob: result.blob,
    sourceLabel,
    sourceText,
    provider: result.provider,
    voice: result.voice,
    model: result.model,
  };
}

/**
 * @param {{
 *   apiURL: (path: string) => string,
 *   text: string,
 *   provider: string,
 *   voice: string,
 *   model: string,
 *   sourceLabel?: string,
 *   onAudioSnapshotReady?: ((audioSnapshot: SpeechAudioSnapshot) => void | Promise<void>) | null,
 *   autoPlay?: boolean,
 *   autoDownload?: boolean,
 *   fetchImpl?: typeof fetch,
 *   performanceNow?: () => number,
 *   audioContextFactory?: (() => AudioContext) | undefined,
 * }} input
 * @returns {Promise<MainWorkspaceSpeechExecutionResult>}
 */
export async function executeMainWorkspaceSpeech({
  apiURL,
  text,
  provider,
  voice,
  model,
  sourceLabel = 'Working Text',
  onAudioSnapshotReady = null,
  autoPlay = false,
  autoDownload = false,
  fetchImpl = fetch,
  performanceNow = () => performance.now(),
  audioContextFactory = undefined,
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
  const audioSnapshot = createAudioSnapshot(result, normalizedText, sourceLabel);

  if (onAudioSnapshotReady) {
    await onAudioSnapshotReady(audioSnapshot);
  }
  if (autoPlay) {
    await playMainWorkspaceAudio(audioSnapshot.blob, audioContextFactory);
  }
  const downloadedAudio = autoDownload
    ? downloadMainWorkspaceAudioSnapshot(audioSnapshot.blob, audioSnapshot.sourceText)
    : false;

  return {
    audioSnapshot,
    feedLabel: `"${truncate(normalizedText, 60)}"`,
    feedMeta: `${wordCount} words · ${duration}s · ${resolvedConfigLabel} · ${(result.bytes.length / 1024).toFixed(1)} KB`,
    downloadedAudio,
  };
}

export async function playMainWorkspaceAudio(blob, audioContextFactory) {
  if (!blob) return;
  await decodeAndPlayAudio(blob, audioContextFactory);
}

export function downloadMainWorkspaceAudioSnapshot(blob, sourceText) {
  return downloadAudioSnapshot(blob, sourceText);
}
