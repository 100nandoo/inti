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
import { truncate } from './text.js';
import {
  buildSpeechPanelViewModel,
  decodeAndPlayAudio,
  downloadAudioSnapshot,
  requestSpeechSynthesis,
} from '../../web-src/src/lib/speech-flow.js';

function syncTTSControls() {
  const { processing } = getWorkspace();
  const viewModel = buildSpeechPanelViewModel(getWorkspace());

  speechInputPreview.innerHTML = viewModel.speechPreviewHtml;
  speechInputPreview.dataset.previewTextLength = viewModel.speechPreviewLength;

  modelSelect.disabled = viewModel.controlsDisabled;
  genderFilter.disabled = viewModel.controlsDisabled;
  voiceSelect.disabled = viewModel.controlsDisabled;
  providerSelect.disabled = viewModel.controlsDisabled;
  sumModelSelect.disabled = viewModel.controlsDisabled;
  generateWorkingAudioBtn.disabled = processing || !viewModel.hasWorkingText;
  generateResultAudioBtn.disabled = processing || !viewModel.hasResult;
  actionSpeak.disabled = viewModel.controlsDisabled;
  actionDownload.disabled = viewModel.controlsDisabled;
  playAudioBtn.disabled = processing || !viewModel.hasAudio;
  downloadAudioBtn.disabled = processing || !viewModel.hasAudio;

  audioResultMeta.textContent = viewModel.audioMeta;
  audioResultCard.innerHTML = viewModel.audioCardHtml;

  updateTextMetrics();
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
    const { blob, bytes: opusBytes } = await requestSpeechSynthesis({
      apiURL: window.apiURL,
      text,
      voice,
      model,
    });
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
    await decodeAndPlayAudio(lastAudioBlob);
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

  downloadAudioSnapshot(lastAudioBlob, sourceText);
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
