const STORAGE_KEY = 'vocalize:summarizer';

const sumProviderSelect = document.getElementById('sum-provider-select');
const keyGemini         = document.getElementById('key-gemini');
const keyGroq           = document.getElementById('key-groq');
const keyOpenRouter     = document.getElementById('key-openrouter');
const sumSaveBtn        = document.getElementById('sum-save-btn');
const sumClearBtn       = document.getElementById('sum-clear-btn');
const sumSaveStatus     = document.getElementById('sum-save-status');

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (saved.provider)         sumProviderSelect.value = saved.provider;
    if (saved.keys?.gemini)     keyGemini.value     = saved.keys.gemini;
    if (saved.keys?.groq)       keyGroq.value       = saved.keys.groq;
    if (saved.keys?.openrouter) keyOpenRouter.value = saved.keys.openrouter;
  } catch {}
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    provider: sumProviderSelect.value,
    keys: {
      gemini:      keyGemini.value.trim(),
      groq:        keyGroq.value.trim(),
      openrouter:  keyOpenRouter.value.trim(),
    },
  }));
  sumSaveStatus.textContent = 'Saved';
  sumSaveStatus.className = 'status-text';
  setTimeout(() => { sumSaveStatus.textContent = ''; }, 2000);
}

function clearAll() {
  localStorage.removeItem(STORAGE_KEY);
  sumProviderSelect.value = '';
  keyGemini.value = '';
  keyGroq.value = '';
  keyOpenRouter.value = '';
  sumSaveStatus.textContent = 'Cleared';
  sumSaveStatus.className = 'status-text';
  setTimeout(() => { sumSaveStatus.textContent = ''; }, 2000);
}

sumSaveBtn.addEventListener('click', save);
sumClearBtn.addEventListener('click', clearAll);

load();
