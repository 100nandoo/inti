import {
  audioResultCard,
  speechInputPreview,
  speechInputCount,
  textResultContent,
  textResultCount,
  workingText,
  workingTextCount,
} from './dom.js';

export function updateTextMetrics() {
  if (workingTextCount) workingTextCount.textContent = `${workingText.value.length} characters`;
  if (textResultCount) textResultCount.textContent = `${textResultContent.innerText.trim().length} characters`;
  if (speechInputCount) speechInputCount.textContent = `${speechInputPreview.dataset.previewTextLength || workingText.value.length} characters`;
}
