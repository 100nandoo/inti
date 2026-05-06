<script lang="ts">
  import type { SummaryData, UIState, Message, Settings } from '../shared/types.js';
  import { getStorage } from '../shared/storage.js';
  import { getSidePanelApi, ignoreAsyncResult, runtimeSendMessage, tabsQuery } from '../shared/webext.js';
  import { STORAGE_KEY_LAST_SUMMARY, STORAGE_KEY_SETTINGS, STORAGE_KEY_UI_STATE } from '../shared/constants.js';
  import SummaryView from '../content/overlay/SummaryView.svelte';
  import LoadingState from '../content/overlay/LoadingState.svelte';
  import ErrorState from '../content/overlay/ErrorState.svelte';
  import SettingsPanel from '../shared/SettingsPanel.svelte';

  const isAndroid = navigator.userAgent.includes('Android');

  let showSettings = $state(false);
  let uiState = $state<UIState>('idle');
  let summary = $state<SummaryData | null>(null);
  let errorMessage = $state('');
  let hasAutoTriggered = $state(false);

  function applyTheme(theme: Settings['theme'] | undefined) {
    document.documentElement.setAttribute('data-theme', theme ?? 'light');
  }

  $effect(() => {
    Promise.all([
      getStorage<UIState>(STORAGE_KEY_UI_STATE),
      getStorage<SummaryData>(STORAGE_KEY_LAST_SUMMARY),
      getStorage<Settings>(STORAGE_KEY_SETTINGS),
    ]).then(([storedState, storedSummary, storedSettings]) => {
      applyTheme(storedSettings?.theme);

      if (storedState === 'loading') {
        uiState = 'loading';
        summary = null;
        return;
      }

      if (storedState === 'error') {
        uiState = 'error';
        summary = null;
        return;
      }

      if (storedSummary) {
        summary = storedSummary;
        uiState = 'done';
      }
    });

    function onMessage(message: Message) {
      if (message.action === 'SUMMARY_READY') {
        summary = message.payload as SummaryData;
        errorMessage = '';
        uiState = 'done';
      } else if (message.action === 'SHOW_LOADING') {
        summary = null;
        errorMessage = '';
        uiState = 'loading';
      } else if (message.action === 'ERROR') {
        summary = null;
        errorMessage = message.payload as string;
        uiState = 'error';
      }
    }

    function onStorageChanged(
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string
    ) {
      if (areaName !== 'local') {
        return;
      }

      const stateChange = changes[STORAGE_KEY_UI_STATE];
      if (stateChange) {
        const nextState = stateChange.newValue as UIState | undefined;
        if (nextState === 'loading') {
          summary = null;
          errorMessage = '';
          uiState = 'loading';
        } else if (nextState === 'error') {
          summary = null;
          uiState = 'error';
        }
      }

      const summaryChange = changes[STORAGE_KEY_LAST_SUMMARY];
      if (summaryChange?.newValue) {
        summary = summaryChange.newValue as SummaryData;
        errorMessage = '';
        uiState = 'done';
      }

      const settingsChange = changes[STORAGE_KEY_SETTINGS];
      if (settingsChange) {
        const nextSettings = settingsChange.newValue as Settings | undefined;
        applyTheme(nextSettings?.theme);
      }
    }

    chrome.runtime.onMessage.addListener(onMessage);
    chrome.storage.onChanged.addListener(onStorageChanged);
    return () => {
      chrome.runtime.onMessage.removeListener(onMessage);
      chrome.storage.onChanged.removeListener(onStorageChanged);
    };
  });

  $effect(() => {
    if (isAndroid && !showSettings && !hasAutoTriggered) {
      hasAutoTriggered = true;
      triggerSummary();
    }
  });

  async function triggerSummary() {
    uiState = 'loading';
    errorMessage = '';
    summary = null;
    ignoreAsyncResult(runtimeSendMessage({ action: 'TRIGGER_SUMMARY' } satisfies Message));

    const sidePanelApi = getSidePanelApi();
    if (!isAndroid && sidePanelApi) {
      try {
        const [tab] = await tabsQuery({ active: true, currentWindow: true });
        if (tab.id) {
          await sidePanelApi.open?.({ tabId: tab.id });
        }
      } catch {
        // Opening the Chrome side panel can fail on restricted pages.
      }
    }
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
        onclick={() => (showSettings = !showSettings)}
        aria-label="Settings"
        aria-pressed={showSettings}
      >⚙</button>
    </div>
  </header>

  {#if showSettings}
    <SettingsPanel onclose={() => (showSettings = false)} />
  {/if}

  <div class="body">
    {#if uiState === 'loading'}
      <LoadingState />
      {#if !isAndroid}
        <p class="hint">Opening sidebar…</p>
      {/if}
    {:else if uiState === 'done' && summary}
      <SummaryView {summary} />
    {:else if uiState === 'error'}
      <ErrorState message={errorMessage} />
    {:else}
      <div class="empty">
        <p>Open an article and click <strong>Summarize</strong> to get started.</p>
        {#if !isAndroid}
          <p class="hint">Results stay in sync with the sidebar.</p>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  :global(:root), :global([data-theme="light"]) {
    --bg: #ffffff;
    --bg-panel: #fafafa;
    --bg-input: #ffffff;
    --bg-hover: #f3f4f6;
    --text: #111827;
    --text-secondary: #374151;
    --text-muted: #6b7280;
    --border: #f3f4f6;
    --border-input: #d1d5db;
    --accent: #3b82f6;
    --accent-hover: #2563eb;
    --accent-shadow: rgba(59,130,246,0.15);
    --summary-text: #374151;
    --copy-btn-bg: #f9fafb;
    --copy-btn-border: #d1d5db;
    --copy-btn-hover: #f3f4f6;
    --loading-color: #9ca3af;
    --skeleton-from: #f3f4f6;
    --skeleton-to: #e5e7eb;
  }

  :global([data-theme="dark"]) {
    --bg: #0f1117;
    --bg-panel: #1a1d27;
    --bg-input: #1e2130;
    --bg-hover: #252836;
    --text: #e2e8f0;
    --text-secondary: #cbd5e1;
    --text-muted: #64748b;
    --border: #252836;
    --border-input: #334155;
    --accent: #60a5fa;
    --accent-hover: #3b82f6;
    --accent-shadow: rgba(96,165,250,0.2);
    --summary-text: #cbd5e1;
    --copy-btn-bg: #1e2130;
    --copy-btn-border: #334155;
    --copy-btn-hover: #252836;
    --loading-color: #64748b;
    --skeleton-from: #1e2130;
    --skeleton-to: #252836;
  }

  :global(*, *::before, *::after) {
    box-sizing: border-box;
  }

  :global(html) {
    min-height: 100%;
  }

  :global(body) {
    margin: 0;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    color: var(--text);
    background: var(--bg);
    min-height: 100vh;
    overflow-y: auto;
    transition: background 0.2s, color 0.2s;
  }

  .root {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
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

  .icon-btn:hover,
  .icon-btn[aria-pressed="true"] {
    color: var(--accent);
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
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 1rem;
  }

  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    height: 100%;
    text-align: center;
  }

  .empty p,
  .hint {
    margin: 0;
    color: var(--text-muted);
    font-size: 0.875rem;
    line-height: 1.6;
  }

  .empty p {
    max-width: 220px;
  }

  .hint {
    margin-top: 0.75rem;
    text-align: center;
  }
</style>
