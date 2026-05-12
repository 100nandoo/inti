import {
  actionDownload,
  actionSpeak,
  audioResultCard,
  audioResultMeta,
  downloadAudioBtn,
  generateResultAudioBtn,
  generateWorkingAudioBtn,
  genderFilter,
  modelSelect,
  playAudioBtn,
  providerSelect,
  speechInputPreview,
  sumModelSelect,
  voiceSelect,
} from './dom.js';
import { addFeed, setPlaying, setStatus, updateFeedItem } from './feed.js';
import { buildDownloadFilename } from './filename.js';
import { downloadBlob } from './download.js';
import { updateTextMetrics } from './metrics.js';
import {
  clearLastAudioBlob,
  getWorkspace,
  setLastAudioResult,
  setProcessing,
  subscribeWorkspace,
} from './workspace.js';
import { escHtml, truncate } from './text.js';

function syncTTSControls() {
  const { processing, workingText, latestTextResult, lastAudioBlob, lastAudioSourceLabel, lastAudioSourceText } = getWorkspace();
  const hasWorkingText = workingText.trim().length > 0;
  const hasResult = latestTextResult.plainText.trim().length > 0;
  const hasAudio = Boolean(lastAudioBlob);

  speechInputPreview.innerHTML = workingText.trim()
    ? renderSpeechPreview(workingText)
    : '<p>Generate speech from the current working text or the latest text result.</p>';
  speechInputPreview.dataset.previewTextLength = String(workingText.length);

  modelSelect.disabled = processing;
  genderFilter.disabled = processing;
  voiceSelect.disabled = processing;
  providerSelect.disabled = processing;
  sumModelSelect.disabled = processing;
  generateWorkingAudioBtn.disabled = processing || !hasWorkingText;
  generateResultAudioBtn.disabled = processing || !hasResult;
  actionSpeak.disabled = processing;
  actionDownload.disabled = processing;
  playAudioBtn.disabled = processing || !hasAudio;
  downloadAudioBtn.disabled = processing || !hasAudio;

  if (hasAudio) {
    const words = lastAudioSourceText.trim() ? lastAudioSourceText.trim().split(/\s+/).length : 0;
    audioResultMeta.textContent = `${lastAudioSourceLabel || 'Audio result'} · ${words} words · ${(lastAudioBlob.size / 1024).toFixed(1)} KB`;
    audioResultCard.innerHTML = `<p>${escHtml(lastAudioSourceLabel || 'Generated from working text')}</p><p>${escHtml(truncate(lastAudioSourceText, 180))}</p>`;
  } else {
    audioResultMeta.textContent = 'No audio yet';
    audioResultCard.innerHTML = '<p>Generate speech from the current working text or the latest text result to keep an audio snapshot here.</p>';
  }

  updateTextMetrics();
}

function renderSpeechPreview(text) {
  if (!text.trim()) return '';
  return text
    .split(/\n{2,}/)
    .slice(0, 3)
    .map((paragraph) => `<p>${escHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('');
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

export async function synthesizeText(text, { sourceLabel = 'Working Text' } = {}) {
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
    const blob = new Blob([opusBytes], { type: 'audio/opus' });
    setLastAudioResult(blob, text, sourceLabel);

    const duration = ((performance.now() - startTime) / 1000).toFixed(1);
    setStatus('Audio result ready.', 'success');
    updateFeedItem(
      feedItem,
      'ok',
      `"${truncate(text, 60)}"`,
      `${wordCount} words · ${duration}s · ${model} · ${voice} · ${(opusBytes.length / 1024).toFixed(1)} KB`,
    );

    if (actionSpeak.checked) {
      await playAudio();
    }
    if (actionDownload.checked) {
      downloadGeneratedAudio(text);
    }
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

export function initTTS() {
  subscribeWorkspace(syncTTSControls);

  generateWorkingAudioBtn.addEventListener('click', async () => {
    const { processing, workingText } = getWorkspace();
    const text = workingText.trim();
    if (!text || processing) return;
    await synthesizeText(text, { sourceLabel: 'Working Text' });
  });

  generateResultAudioBtn.addEventListener('click', async () => {
    const { processing, latestTextResult } = getWorkspace();
    const text = latestTextResult.plainText.trim();
    if (!text || processing) return;
    await synthesizeText(text, { sourceLabel: latestTextResult.title || 'Latest Text Result' });
  });

  playAudioBtn.addEventListener('click', async () => {
    if (!hasGeneratedAudio()) return;
    await playAudio();
  });

  downloadAudioBtn.addEventListener('click', () => {
    const { lastAudioSourceText } = getWorkspace();
    if (!hasGeneratedAudio()) return;
    downloadGeneratedAudio(lastAudioSourceText || 'audio');
  });

  syncTTSControls();
}
