import { buildDownloadFilename } from '../../../web/js/filename.js';
import { downloadBlob } from '../../../web/js/download.js';
import { escHtml, truncate } from '../../../web/js/text.js';

export function buildSpeechPanelViewModel(workspace) {
  const { processing, workingText, latestTextResult, lastAudioBlob, lastAudioSourceLabel, lastAudioSourceText } = workspace;
  const hasWorkingText = workingText.trim().length > 0;
  const hasResult = latestTextResult.plainText.trim().length > 0;
  const hasAudio = Boolean(lastAudioBlob);

  return {
    hasWorkingText,
    hasResult,
    hasAudio,
    speechPreviewHtml: workingText.trim()
      ? renderSpeechPreview(workingText)
      : '<p>Generate speech from the current working text or the latest text result.</p>',
    speechPreviewLength: String(workingText.length),
    controlsDisabled: processing,
    audioMeta: hasAudio
      ? `${lastAudioSourceLabel || 'Audio result'} · ${countWords(lastAudioSourceText)} words · ${(lastAudioBlob.size / 1024).toFixed(1)} KB`
      : 'No audio yet',
    audioCardHtml: hasAudio
      ? `<p>${escHtml(lastAudioSourceLabel || 'Generated from working text')}</p><p>${escHtml(truncate(lastAudioSourceText, 180))}</p>`
      : '<p>Generate speech from the current working text or the latest text result to keep an audio snapshot here.</p>',
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

export async function requestSpeechSynthesis({
  apiURL,
  text,
  voice,
  model,
  fetchImpl = fetch,
}) {
  const response = await fetchImpl(apiURL('/api/speak'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice, model }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(body.error || response.statusText);
  }

  const { opus } = await response.json();
  const opusBytes = Uint8Array.from(atob(opus), (char) => char.charCodeAt(0));
  return {
    blob: new Blob([opusBytes], { type: 'audio/opus' }),
    bytes: opusBytes,
  };
}

export async function decodeAndPlayAudio(blob, audioContextFactory = () => new AudioContext()) {
  const base64Audio = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result.split(',')[1] || reader.result;
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
  if (!blob) return false;
  downloadBlob(blob, buildDownloadFilename(sourceText, 'opus'));
  return true;
}
