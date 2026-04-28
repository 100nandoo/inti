<script lang="ts">
  import type { Settings } from './types.js';
  import { getStorage, setStorage } from './storage.js';
  import { STORAGE_KEY_SETTINGS } from './constants.js';

  let { onclose }: { onclose?: () => void } = $props();

  let apiUrl = $state('');
  let apiKey = $state('');
  let savedApiUrl = $state('');
  let savedApiKey = $state('');
  let theme = $state<'light' | 'dark'>('light');
  let saveStatus = $state<'idle' | 'saved' | 'error'>('idle');
  let statusTimeout: ReturnType<typeof setTimeout> | null = null;
  const isDirty = $derived(apiUrl.trim() !== savedApiUrl || apiKey.trim() !== savedApiKey);
  const showOpenIntiPage = $derived(!onclose
    && navigator.userAgent.includes('Android')
    && navigator.userAgent.includes('Firefox'));

  $effect(() => {
    getStorage<Settings>(STORAGE_KEY_SETTINGS).then((stored) => {
      apiUrl = stored?.apiUrl ?? '';
      apiKey = stored?.apiKey ?? '';
      savedApiUrl = apiUrl.trim();
      savedApiKey = apiKey.trim();
      if (stored?.theme) {
        theme = stored.theme;
        applyTheme(stored.theme);
      }
    });
  });

  function applyTheme(t: 'light' | 'dark') {
    document.documentElement.setAttribute('data-theme', t);
  }

  async function toggleTheme() {
    theme = theme === 'light' ? 'dark' : 'light';
    applyTheme(theme);
    const stored = await getStorage<Settings>(STORAGE_KEY_SETTINGS);
    await setStorage<Settings>(STORAGE_KEY_SETTINGS, { ...(stored ?? { apiUrl }), theme });
  }

  async function save() {
    const trimmed = apiUrl.trim();
    const trimmedApiKey = apiKey.trim();
    try {
      new URL(trimmed);
    } catch {
      saveStatus = 'error';
      scheduleReset();
      return;
    }
    const stored = await getStorage<Settings>(STORAGE_KEY_SETTINGS);
    const settings: Settings = { ...(stored ?? {}), apiUrl: trimmed };
    if (trimmedApiKey) {
      settings.apiKey = trimmedApiKey;
    } else {
      delete settings.apiKey;
    }
    await setStorage<Settings>(STORAGE_KEY_SETTINGS, settings);
    savedApiUrl = trimmed;
    savedApiKey = trimmedApiKey;
    saveStatus = 'saved';
    scheduleReset();
  }

  function openIntiPage() {
    window.location.assign(chrome.runtime.getURL('popup.html'));
  }

  function handleInput() {
    if (saveStatus !== 'idle') {
      saveStatus = 'idle';
    }
    if (statusTimeout) {
      clearTimeout(statusTimeout);
      statusTimeout = null;
    }
  }

  function scheduleReset() {
    if (statusTimeout) clearTimeout(statusTimeout);
    statusTimeout = setTimeout(() => {
      saveStatus = 'idle';
      statusTimeout = null;
    }, 2500);
  }
</script>

<div class="panel">
  <div class="panel-header">
    <div class="header-main">
      <span class="panel-title">Settings</span>
      {#if showOpenIntiPage}
        <button class="open-inti-btn" onclick={openIntiPage}>Open Inti</button>
      {/if}
    </div>
    <div class="header-right">
      <button
        class="theme-toggle"
        onclick={toggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
      >
        {#if theme === 'dark'}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
          </svg>
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path fill-rule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clip-rule="evenodd" />
          </svg>
        {/if}
      </button>
      {#if onclose}
        <button class="close-btn" onclick={onclose} aria-label="Close settings">✕</button>
      {/if}
    </div>
  </div>

  <div class="field">
    <label for="sp-api-url">API URL</label>
    <input
      id="sp-api-url"
      type="url"
      placeholder="https://your-api.com/summarize"
      bind:value={apiUrl}
      oninput={handleInput}
      onkeydown={(e) => e.key === 'Enter' && save()}
      class:invalid={saveStatus === 'error'}
    />
  </div>

  <div class="field">
    <label for="sp-api-key">X-API-Key Header</label>
    <input
      id="sp-api-key"
      type="text"
      placeholder="your-api-key"
      bind:value={apiKey}
      oninput={handleInput}
      onkeydown={(e) => e.key === 'Enter' && save()}
    />
  </div>

  <div class="actions">
    <button class="save-btn" onclick={save} disabled={!isDirty}>Save settings</button>
    {#if saveStatus === 'saved'}
      <span class="status success">Saved.</span>
    {:else if saveStatus === 'error'}
      <span class="status error">Enter a valid URL.</span>
    {/if}
  </div>
</div>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.875rem 1rem 1rem;
    border-top: 1px solid var(--border);
    background: var(--bg-panel);
    transition: background 0.2s, border-color 0.2s;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .header-main {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .panel-title {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .theme-toggle {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-muted);
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    line-height: 1;
    display: flex;
    align-items: center;
    transition: color 0.15s, background 0.15s;
  }

  .theme-toggle:hover {
    color: var(--accent);
    background: var(--bg-hover);
  }

  .close-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-muted);
    font-size: 0.75rem;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    line-height: 1;
    transition: color 0.15s, background 0.15s;
  }

  .close-btn:hover {
    color: var(--text);
    background: var(--bg-hover);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  label {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .actions {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.35rem;
    margin-top: 0.15rem;
  }

  input[type="url"],
  input[type="text"] {
    padding: 0.4rem 0.6rem;
    border: 1px solid var(--border-input);
    border-radius: 5px;
    font-size: 0.8rem;
    font-family: ui-monospace, monospace;
    background: var(--bg-input);
    color: var(--text);
    transition: border-color 0.15s, background 0.2s;
  }

  input[type="url"]:focus,
  input[type="text"]:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 2px var(--accent-shadow);
  }

  input.invalid { border-color: #ef4444; }

  button {
    padding: 0.4rem 0.9rem;
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: 5px;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s;
  }

  .save-btn {
    align-self: flex-start;
  }

  .open-inti-btn {
    background: var(--bg-input);
    color: var(--text);
    border: 1px solid var(--border-input);
  }

  button:hover { background: var(--accent-hover); }

  .open-inti-btn:hover {
    background: var(--bg-hover);
    border-color: var(--accent);
  }

  button:disabled {
    background: color-mix(in srgb, var(--accent) 35%, var(--bg-hover));
    color: var(--text-muted);
    cursor: not-allowed;
  }

  button:disabled:hover {
    background: color-mix(in srgb, var(--accent) 35%, var(--bg-hover));
  }

  .status {
    font-size: 0.75rem;
  }

  .status.success { color: #10b981; }
  .status.error   { color: #ef4444; }
</style>
