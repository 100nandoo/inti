import {
  ocrCount,
  ocrOutputText,
  summaryCount,
  summaryText,
  textInput,
  ttsCount,
  workspaceCount,
  workspaceText,
} from './dom.js';

export function updateTextMetrics() {
  if (ocrCount) ocrCount.textContent = `${ocrOutputText.value.length} characters`;
  if (workspaceCount) workspaceCount.textContent = `${workspaceText.value.length} characters`;
  if (summaryCount) summaryCount.textContent = `${summaryText.innerText.trim().length} characters`;
  if (ttsCount) ttsCount.textContent = `${textInput.value.length} characters`;
}
