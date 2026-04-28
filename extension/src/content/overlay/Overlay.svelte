<script lang="ts">
  import type { SummaryData, UIState } from '../../shared/types.js';
  import SummaryView from './SummaryView.svelte';
  import LoadingState from './LoadingState.svelte';
  import ErrorState from './ErrorState.svelte';

  let {
    summary = null,
    state = 'idle' as UIState,
    errorMessage = '',
    onClose,
  }: {
    summary?: SummaryData | null;
    state?: UIState;
    errorMessage?: string;
    onClose: () => void;
  } = $props();

  const isAndroid = navigator.userAgent.includes('Android');
</script>

<div class="overlay" class:android={isAndroid} role="complementary" aria-label="Inti summary">
  <div class="header">
    <span class="brand">Inti</span>
    <button class="close-btn" onclick={onClose} aria-label="Close Inti">×</button>
  </div>

  <div class="body">
    {#if state === 'loading'}
      <LoadingState />
    {:else if state === 'done' && summary}
      <SummaryView {summary} />
    {:else if state === 'error'}
      <ErrorState message={errorMessage} />
    {:else}
      <p class="idle-hint">Click "Summarize Article" to get started.</p>
    {/if}
  </div>
</div>

<style>
  /* Reset so host page CSS doesn't bleed in */
  :host {
    all: initial;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .overlay {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    width: 360px;
    max-height: 70vh;
    overflow-y: auto;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(0, 0, 0, 0.08);
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    color: #111827;
    pointer-events: all;
    z-index: 2147483647;
    box-sizing: border-box;
  }

  /* Firefox Android / mobile: full-width bottom sheet */
  .overlay.android {
    bottom: 0;
    right: 0;
    left: 0;
    width: 100%;
    border-radius: 16px 16px 0 0;
    max-height: 60vh;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.875rem 1rem 0.5rem;
    border-bottom: 1px solid #f3f4f6;
  }

  .brand {
    font-weight: 700;
    font-size: 0.875rem;
    color: #3b82f6;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.25rem;
    line-height: 1;
    cursor: pointer;
    color: #9ca3af;
    padding: 0 0.25rem;
    border-radius: 4px;
    transition: color 0.15s;
  }

  .close-btn:hover {
    color: #374151;
  }

  .body {
    padding: 0.875rem 1rem 1.125rem;
  }

  .idle-hint {
    margin: 0;
    color: #9ca3af;
    font-size: 0.875rem;
    text-align: center;
    padding: 1rem 0;
  }
</style>
