import { downloadAudioExport } from './export-service.js';
import { escHtml, truncate } from './text.js';

/**
 * @typedef {import('./workspace-contracts').SpeechPanelViewModel} SpeechPanelViewModel
 * @typedef {import('./workspace-contracts').SpeechPanelWorkspace} SpeechPanelWorkspace
 * @typedef {import('./workspace-contracts').SpeechRequestInput} SpeechRequestInput
 * @typedef {import('./workspace-contracts').SpeechResponsePayload} SpeechResponsePayload
 * @typedef {import('./workspace-contracts').SpeechSynthesisResult} SpeechSynthesisResult
 */

/**
 * @param {SpeechResponsePayload} payload
 * @returns {Uint8Array<ArrayBuffer>}
 */
function decodeOpusBytes(payload) {
  if (!payload.opus) {
    throw new Error('invalid speech response');
  }
  return Uint8Array.from(atob(payload.opus), (char) => char.charCodeAt(0));
}

function formatSpeechProvider(provider) {
  return provider === 'kokoro-heart' ? 'kokoro heart' : (provider || 'speech');
}

function buildAudioProviderDetails(provider, voice, model) {
  const details = [formatSpeechProvider(provider)];
  if (model) details.push(model);
  if (voice) details.push(voice);
  if (!model && provider === 'kokoro-heart') {
    details.push('experimental upstream');
  }
  return details.join(' · ');
}

/** @param {SpeechPanelWorkspace} workspace
 * @returns {SpeechPanelViewModel}
 */
export function buildSpeechPanelViewModel(workspace) {
  const {
    processing,
    workingText,
    latestTextResult,
    lastAudioBlob,
    lastAudioSourceLabel,
    lastAudioSourceText,
    lastAudioProvider,
    lastAudioVoice,
    lastAudioModel,
  } = workspace;
  const hasWorkingText = workingText.trim().length > 0;
  const hasAudio = Boolean(lastAudioBlob);
  const providerDetails = buildAudioProviderDetails(lastAudioProvider, lastAudioVoice, lastAudioModel);

  return {
    hasWorkingText,
    hasAudio,
    speechPreviewHtml: workingText.trim()
      ? renderSpeechPreview(workingText)
      : '<p>Generate speech from Working Text to keep an audio snapshot here.</p>',
    speechPreviewLength: String(workingText.length),
    controlsDisabled: processing,
    audioMeta: hasAudio
      ? `${lastAudioSourceLabel || 'Audio result'} · ${providerDetails} · ${countWords(lastAudioSourceText)} words · ${(lastAudioBlob.size / 1024).toFixed(1)} KB`
      : 'No audio yet',
    audioCardHtml: hasAudio
      ? `<p>${escHtml(lastAudioSourceLabel || 'Generated from working text')}</p><p>${escHtml(providerDetails)}</p><p>${escHtml(truncate(lastAudioSourceText, 180))}</p>`
      : '<p>Generate speech from Working Text to keep an audio snapshot here.</p>',
  };
}

export function renderSpeechPreview(text) {
  if (!text.trim()) return '';
  return text
    .split(/\n{2,}/)
    .slice(0, 3)
    .map((paragraph) => `<p>${escHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function countWords(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

/** @param {SpeechRequestInput} input
 * @returns {Promise<SpeechSynthesisResult>}
 */
export async function requestSpeechSynthesis({
  apiURL,
  provider,
  text,
  voice,
  model,
  fetchImpl = fetch,
}) {
  const response = await fetchImpl(apiURL('/api/speak'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, provider, voice, model }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(body.error || response.statusText);
  }

  /** @type {SpeechResponsePayload} */
  const payload = await response.json();
  const opusBytes = decodeOpusBytes(payload);
  const resolvedProvider = payload.provider || provider;
  return {
    blob: new Blob([opusBytes], { type: 'audio/opus' }),
    bytes: opusBytes,
    provider: resolvedProvider,
    voice: payload.voice || voice,
    model: payload.model || (resolvedProvider === 'kokoro-heart' ? '' : model),
  };
}

export async function decodeAndPlayAudio(blob, audioContextFactory = () => new AudioContext()) {
  const base64Audio = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const data = result.split(',')[1] || result;
      resolve(data);
    };
    reader.readAsDataURL(blob);
  });

  const bytes = Uint8Array.from(atob(base64Audio), (char) => char.charCodeAt(0));
  const audioContext = audioContextFactory();
  const buffer = await audioContext.decodeAudioData(bytes.buffer);
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  source.start();

  return new Promise((resolve) => {
    source.onended = () => {
      audioContext.close();
      resolve();
    };
  });
}

export function downloadAudioSnapshot(blob, sourceText) {
  return downloadAudioExport(blob, sourceText);
}
