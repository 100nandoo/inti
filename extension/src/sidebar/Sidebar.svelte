<script lang="ts">
  import type { SummaryData, UIState, Message, Settings } from '../shared/types.js';
  import { openOrFocusIntiPage } from '../shared/inti-url.js';
  import { getStorage } from '../shared/storage.js';
  import { ignoreAsyncResult, runtimeSendMessage } from '../shared/webext.js';
  import { STORAGE_KEY_LAST_SUMMARY, STORAGE_KEY_SETTINGS, STORAGE_KEY_UI_STATE } from '../shared/constants.js';
  import SummaryView from '../content/overlay/SummaryView.svelte';
  import LoadingState from '../content/overlay/LoadingState.svelte';
  import ErrorState from '../content/overlay/ErrorState.svelte';
  import SettingsPanel from '../shared/SettingsPanel.svelte';
  import openInNewIconUrl from '../icons/open-in-new.svg';
  import settingsIconUrl from '../icons/settings.svg';

  let showSettings = $state(false);
  let settings = $state<Settings | null>(null);
  let uiState = $state<UIState>('idle');
  let summary = $state<SummaryData | null>(null);
  let errorMessage = $state('');

  function maskIconStyle(iconUrl: string) {
    return `mask-image: url("${iconUrl}"); -webkit-mask-image: url("${iconUrl}");`;
  }

  $effect(() => {
    // Restore last summary from storage when sidebar opens
    getStorage<SummaryData>(STORAGE_KEY_LAST_SUMMARY).then((stored) => {
      if (stored && uiState === 'idle') {
        summary = stored;
        uiState = 'done';
      }
    });

    // Check if a summary is currently in progress
    getStorage<UIState>(STORAGE_KEY_UI_STATE).then((state) => {
      if (state === 'loading') {
        uiState = 'loading';
      }
    });

    // Apply saved theme on mount
    getStorage<Settings>(STORAGE_KEY_SETTINGS).then((stored) => {
      settings = stored;
      const t = stored?.theme ?? 'light';
      document.documentElement.setAttribute('data-theme', t);
    });

    // Listen for updates from the service worker
    function onMessage(message: Message) {
      if (message.action === 'SUMMARY_READY') {
        summary = message.payload as SummaryData;
        uiState = 'done';
      } else if (message.action === 'ERROR') {
        errorMessage = message.payload as string;
        uiState = 'error';
      } else if (message.action === 'SHOW_LOADING') {
        uiState = 'loading';
        errorMessage = '';
      }
    }

    function onStorageChanged(
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string
    ) {
      if (areaName !== 'local') {
        return;
      }

      const settingsChange = changes[STORAGE_KEY_SETTINGS];
      if (!settingsChange) {
        return;
      }

      const nextSettings = settingsChange.newValue as Settings | undefined;
      settings = nextSettings ?? null;
      document.documentElement.setAttribute('data-theme', nextSettings?.theme ?? 'light');
    }

    chrome.runtime.onMessage.addListener(onMessage);
    chrome.storage.onChanged.addListener(onStorageChanged);
    return () => {
      chrome.runtime.onMessage.removeListener(onMessage);
      chrome.storage.onChanged.removeListener(onStorageChanged);
    };
  });

  function triggerSummary() {
    uiState = 'loading';
    errorMessage = '';
    ignoreAsyncResult(runtimeSendMessage({ action: 'TRIGGER_SUMMARY' } satisfies Message));
  }

  async function openIntiPage() {
    await openOrFocusIntiPage(settings);
  }
</script>

<div class="root">
  <header>
    <span class="brand">Inti</span>
    <div class="header-actions">
      <button
        class="summarize-btn"
        onclick={triggerSummary}
        disabled={uiState === 'loading'}
      >
        {uiState === 'loading' ? 'Summarizing…' : 'Summarize'}
      </button>
      <button
        class="icon-btn"
        onclick={() => ignoreAsyncResult(openIntiPage())}
        aria-label="Open Inti page"
        title={settings?.apiUrl?.trim() ? 'Open Inti page' : 'Configure API URL first'}
        disabled={!settings?.apiUrl?.trim()}
      >
        <span class="icon" style={maskIconStyle(openInNewIconUrl)} aria-hidden="true"></span>
      </button>
      <button
        class="icon-btn"
        onclick={() => (showSettings = !showSettings)}
        aria-label="Settings"
        aria-pressed={showSettings}
      >
        <span class="icon" style={maskIconStyle(settingsIconUrl)} aria-hidden="true"></span>
      </button>
    </div>
  </header>

  {#if showSettings}
    <SettingsPanel onclose={() => (showSettings = false)} />
  {/if}

  <div class="body">
    {#if uiState === 'loading'}
      <LoadingState />
    {:else if uiState === 'done' && summary}
      <SummaryView {summary} />
    {:else if uiState === 'error'}
      <ErrorState message={errorMessage} />
    {:else}
      <div class="empty">
        <p>Open an article and click <strong>Summarize</strong> to get started.</p>
      </div>
    {/if}
  </div>
</div>

<style>
  /* ─── Theme tokens ─── */
  :global(:root), :global([data-theme="light"]) {
    --bg:          #ffffff;
    --bg-panel:    #fafafa;
    --bg-input:    #ffffff;
    --bg-hover:    #f3f4f6;
    --text:        #111827;
    --text-secondary: #374151;
    --text-muted:  #6b7280;
    --border:      #f3f4f6;
    --border-input:#d1d5db;
    --accent:      #3b82f6;
    --accent-hover:#2563eb;
    --accent-shadow: rgba(59,130,246,0.15);
    --summary-text:#374151;
    --copy-btn-bg: #f9fafb;
    --copy-btn-border: #d1d5db;
    --copy-btn-hover: #f3f4f6;
    --loading-color:#9ca3af;
    --skeleton-from:#f3f4f6;
    --skeleton-to:  #e5e7eb;
  }

  :global([data-theme="dark"]) {
    --bg:          #0f1117;
    --bg-panel:    #1a1d27;
    --bg-input:    #1e2130;
    --bg-hover:    #252836;
    --text:        #e2e8f0;
    --text-secondary: #cbd5e1;
    --text-muted:  #64748b;
    --border:      #252836;
    --border-input:#334155;
    --accent:      #60a5fa;
    --accent-hover:#3b82f6;
    --accent-shadow: rgba(96,165,250,0.2);
    --summary-text:#cbd5e1;
    --copy-btn-bg: #1e2130;
    --copy-btn-border: #334155;
    --copy-btn-hover: #252836;
    --loading-color:#64748b;
    --skeleton-from:#1e2130;
    --skeleton-to:  #252836;
  }

  :global(*, *::before, *::after) {
    box-sizing: border-box;
  }

  :global(body) {
    margin: 0;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    color: var(--text);
    background: var(--bg);
    height: 100vh;
    overflow: hidden;
    transition: background 0.2s, color 0.2s;
  }

  .root {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.875rem 1rem;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
    transition: border-color 0.2s;
  }

  .brand {
    font-weight: 700;
    font-size: 0.875rem;
    color: var(--accent);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .icon-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-muted);
    font-size: 1rem;
    padding: 0.2rem;
    border-radius: 4px;
    line-height: 1;
    transition: color 0.15s;
  }

  .icon-btn:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .icon-btn:hover,
  .icon-btn[aria-pressed="true"] { color: var(--accent); }

  .icon-btn:disabled:hover {
    color: var(--text-muted);
    border-color: var(--copy-btn-border);
    background: var(--copy-btn-bg);
  }

  .icon {
    display: inline-block;
    width: 14px;
    height: 14px;
    background-color: currentColor;
    mask-repeat: no-repeat;
    mask-position: center;
    mask-size: contain;
    -webkit-mask-repeat: no-repeat;
    -webkit-mask-position: center;
    -webkit-mask-size: contain;
  }

  .summarize-btn {
    padding: 0.4rem 0.9rem;
    background: var(--accent);
    color: #ffffff;
    border: none;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s;
  }

  .summarize-btn:hover:not(:disabled) {
    background: var(--accent-hover);
  }

  .summarize-btn:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  .body {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }

  .empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
  }

  .empty p {
    margin: 0;
    color: var(--text-muted);
    font-size: 0.875rem;
    line-height: 1.6;
    max-width: 200px;
  }
</style>
