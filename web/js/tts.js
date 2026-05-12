import {
  actionDownload,
  actionSpeak,
  actionSummarize,
  actionSynthesize,
  genderFilter,
  modelSelect,
  providerSelect,
  submitBtn,
  sumModelSelect,
  textInput,
  voiceSelect,
} from './dom.js';
import { addFeed, setPlaying, setStatus, updateFeedItem } from './feed.js';
import { buildDownloadFilename } from './filename.js';
import { updateTextMetrics } from './metrics.js';
import {
  clearLastAudioBlob,
  getWorkspace,
  setLastAudioBlob,
  setProcessing,
  setTextToSpeechText,
  subscribeWorkspace,
} from './workspace.js';
import { truncate } from './text.js';
import { downloadBlob } from './download.js';

function syncTTSControls() {
  const { processing, textToSpeechText } = getWorkspace();
  if (textInput.value !== textToSpeechText) {
    textInput.value = textToSpeechText;
  }
  textInput.disabled = processing;
  modelSelect.disabled = processing;
  genderFilter.disabled = processing;
  voiceSelect.disabled = processing;
  providerSelect.disabled = processing;
  sumModelSelect.disabled = processing;
  submitBtn.disabled = processing || !textToSpeechText.trim();
  actionSynthesize.disabled = processing;
  actionSpeak.disabled = processing;
  actionDownload.disabled = processing;
  actionSummarize.disabled = processing;

  if (!processing) {
    textInput.focus();
  }
}

async function playEncodedAudio(blob) {
  const base64Audio = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result.split(',')[1] || reader.result;
      resolve(data);
    };
    reader.readAsDataURL(blob);
  });

  const bytes = Uint8Array.from(atob(base64Audio), (char) => char.charCodeAt(0));
  const audioContext = new AudioContext();
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

export async function synthesizeText(text) {
  const voice = voiceSelect.value;
  const model = modelSelect.value;

  setProcessing(true);
  setStatus('Synthesizing…');

  const startTime = performance.now();
  const wordCount = text.trim().split(/\s+/).length;
  const feedItem = addFeed('info', `"${truncate(text, 60)}"`, `${model} · ${voice} · synthesizing…`);

  try {
    const response = await fetch(window.apiURL('/api/speak'), {
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
    setLastAudioBlob(new Blob([opusBytes], { type: 'audio/opus' }));

    const duration = ((performance.now() - startTime) / 1000).toFixed(1);
    setStatus('');
    updateFeedItem(
      feedItem,
      'ok',
      `"${truncate(text, 60)}"`,
      `${wordCount} words · ${duration}s · ${model} · ${voice} · ${(opusBytes.length / 1024).toFixed(1)} KB`,
    );
  } catch (error) {
    setStatus(error.message, 'error');
    updateFeedItem(feedItem, 'fail', `"${truncate(text, 60)}"`, error.message);
  } finally {
    setProcessing(false);
  }
}

export async function playAudio() {
  const { lastAudioBlob } = getWorkspace();
  if (!lastAudioBlob) return;

  setStatus('Playing…');
  setPlaying(true);

  try {
    await playEncodedAudio(lastAudioBlob);
    setStatus('');
  } catch (error) {
    setStatus(error.message, 'error');
  } finally {
    setPlaying(false);
  }
}

export function hasGeneratedAudio() {
  return Boolean(getWorkspace().lastAudioBlob);
}

export function clearGeneratedAudio() {
  clearLastAudioBlob();
}

export function downloadGeneratedAudio(sourceText) {
  const { lastAudioBlob } = getWorkspace();
  if (!lastAudioBlob) return false;

  downloadBlob(lastAudioBlob, buildDownloadFilename(sourceText, 'opus'));
  addFeed('ok', 'Downloaded', 'Opus file saved to your downloads folder');
  return true;
}

export function initTTS({ summarizeText }) {
  subscribeWorkspace(syncTTSControls);

  textInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      submitBtn.click();
    }
  });

  textInput.addEventListener('input', () => {
    setTextToSpeechText(textInput.value);
    clearGeneratedAudio();
    updateTextMetrics();
    syncTTSControls();
  });

  submitBtn.addEventListener('click', async () => {
    const { processing, textToSpeechText } = getWorkspace();
    const text = textToSpeechText.trim();
    if (!text || processing) return;

    const shouldSummarize = actionSummarize.checked;
    const shouldSynthesize = actionSynthesize.checked || actionSpeak.checked || actionDownload.checked;
    const shouldSpeak = actionSpeak.checked;
    const shouldDownload = actionDownload.checked;

    if (shouldSummarize) await summarizeText(text, false);
    if (shouldSynthesize) await synthesizeText(text);
    if (shouldSpeak && hasGeneratedAudio()) await playAudio();
    if (shouldDownload) downloadGeneratedAudio(text);
  });
}
