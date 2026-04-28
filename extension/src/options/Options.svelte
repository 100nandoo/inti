<script lang="ts">
  import type { Settings } from '../shared/types.js';
  import { getStorage } from '../shared/storage.js';
  import { STORAGE_KEY_SETTINGS } from '../shared/constants.js';
  import SettingsPanel from '../shared/SettingsPanel.svelte';

  $effect(() => {
    getStorage<Settings>(STORAGE_KEY_SETTINGS).then((stored) => {
      const theme = stored?.theme ?? 'light';
      document.documentElement.setAttribute('data-theme', theme);
    });
  });
</script>

<div class="page">
  <div class="panel-shell">
    <SettingsPanel />
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
    --accent-shadow: rgba(59, 130, 246, 0.15);
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
    --accent-shadow: rgba(96, 165, 250, 0.2);
  }

  :global(*, *::before, *::after) {
    box-sizing: border-box;
  }

  :global(body) {
    margin: 0;
    min-height: 100vh;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    color: var(--text);
    background: var(--bg);
    transition: background 0.2s, color 0.2s;
  }

  .page {
    min-height: 100vh;
    padding: 1rem;
  }

  .panel-shell {
    max-width: 420px;
    margin: 0 auto;
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    background: var(--bg-panel);
  }
</style>
