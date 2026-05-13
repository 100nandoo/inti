<script>
  import { onDestroy, onMount } from 'svelte';
  import PageShell from '../components/PageShell.svelte';
  import { apiURL, buildPageLink } from '../lib/page-auth.js';
  import { getSummarizerModels } from '../lib/summarizer-models.js';
  import {
    clearSummarizerSettings,
    loadSettings,
    saveSettings,
  } from '../lib/settings-service.js';

  const providerOptions = [
    { value: '', label: 'Server default' },
    { value: 'gemini', label: 'Gemini' },
    { value: 'groq', label: 'Groq' },
    { value: 'openrouter', label: 'OpenRouter' },
    { value: 'mock', label: 'Mock (Testing)' },
  ];

  const themeOptions = [
    { value: '', label: 'Server default' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'minimal', label: 'Minimal' },
    { value: 'minimal-dark', label: 'Minimal Dark' },
  ];

  const summaryFormatOptions = [
    { value: 'txt', label: 'Plain text (.txt)' },
    { value: 'md', label: 'Markdown (.md)' },
  ];

  const promotionOptions = [
    { value: 'append', label: 'Append to working text' },
    { value: 'replace', label: 'Replace working text' },
  ];

  let locationContext;
  let navLinks = [];

  let provider = '';
  let model = '';
  let modelOptions = [];
  let theme = '';
  let summaryDownloadFormat = 'md';
  let ocrPromotionBehavior = 'append';
  let summaryPromotionBehavior = 'append';
  let keyGemini = '';
  let keyGroq = '';
  let keyOpenRouter = '';
  let revealGeminiKey = false;
  let revealGroqKey = false;
  let revealOpenRouterKey = false;
  let groqLimits = null;
  let groqNow = Date.now();
  let statusMessage = '';
  let statusError = false;

  let groqTimer = null;

  function syncNavLinks() {
    navLinks = [
      {
        href: buildPageLink('/api-keys.html', locationContext),
        label: 'API Keys',
        title: 'Manage API keys',
        iconClass: 'icon-key',
      },
      {
        href: buildPageLink('/', locationContext),
        label: 'Back',
        title: 'Back to app',
        iconClass: 'icon-chevron-left',
      },
    ];
  }

  function setStatus(message, isError = false) {
    statusMessage = message;
    statusError = isError;
    if (!message) return;
    window.setTimeout(() => {
      if (statusMessage === message) statusMessage = '';
    }, 2000);
  }

  function applySummarizerConfig(config) {
    provider = config.provider || '';
    model = config.model || '';
    keyGemini = config.keys?.gemini || '';
    keyGroq = config.keys?.groq || '';
    keyOpenRouter = config.keys?.openrouter || '';
    groqLimits = config.groqLimits || null;
    resetGroqTimer();
  }

  function applyAppearanceConfig(config) {
    theme = config.theme || '';
    summaryDownloadFormat = config.summaryDownloadFormat || 'md';
    ocrPromotionBehavior = config.ocrPromotionBehavior || 'append';
    summaryPromotionBehavior = config.summaryPromotionBehavior || 'append';
  }

  async function refreshModelOptions(selectedProvider, selectedModel = '') {
    if (!selectedProvider || selectedProvider === 'openrouter') {
      modelOptions = [];
      model = '';
      return;
    }

    try {
      modelOptions = await getSummarizerModels(selectedProvider);
    } catch (error) {
      modelOptions = [];
      setStatus(error.message, true);
      return;
    }

    if (modelOptions.length === 0) {
      model = '';
      return;
    }

    model = modelOptions.some((option) => option.value === selectedModel)
      ? selectedModel
      : modelOptions[0].value;
  }

  function themeConfigPayload() {
    return {
      theme,
      summaryDownloadFormat,
      ocrPromotionBehavior,
      summaryPromotionBehavior,
    };
  }

  function summarizerKeysPayload() {
    return {
      gemini: keyGemini.trim(),
      groq: keyGroq.trim(),
      openrouter: keyOpenRouter.trim(),
    };
  }

  async function handleLoad() {
    try {
      const result = await loadSettings({ apiURL });
      applySummarizerConfig(result.summarizerConfig);
      applyAppearanceConfig(result.appearanceConfig);
      await refreshModelOptions(provider, model);
    } catch (error) {
      setStatus(error.message, true);
    }
  }

  async function handleSave() {
    try {
      const result = await saveSettings({
        apiURL,
        provider,
        model: provider === 'openrouter' ? '' : model,
        keys: summarizerKeysPayload(),
        appearanceConfig: themeConfigPayload(),
      });
      applySummarizerConfig(result.summarizerConfig);
      applyAppearanceConfig(result.appearanceConfig);
      await refreshModelOptions(provider, model);
      setStatus('Saved');
    } catch (error) {
      setStatus(error.message, true);
    }
  }

  async function handleClear() {
    try {
      applySummarizerConfig(await clearSummarizerSettings({ apiURL }));
      await refreshModelOptions(provider, model);
      setStatus('Cleared');
    } catch (error) {
      setStatus(error.message, true);
    }
  }

  async function handleProviderChange() {
    await refreshModelOptions(provider);
  }

  function keyVisibilityLabel(showing, providerName) {
    return `${showing ? 'Hide' : 'Show'} ${providerName} API key`;
  }

  function handleThemePreview() {
    if (theme) {
      window.IntiTheme?.apply(theme);
      window.IntiTheme?.persist(theme);
    }
  }

  function fmtDuration(ms) {
    if (ms <= 0) return 'now';
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  function fmtAgo(ms) {
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
    return `${Math.round(seconds / 3600)}h ago`;
  }

  function resetGroqTimer() {
    if (groqTimer) {
      window.clearInterval(groqTimer);
      groqTimer = null;
    }

    if (!groqLimits) return;

    groqNow = Date.now();
    groqTimer = window.setInterval(() => {
      groqNow = Date.now();
      const latestReset = Math.max(groqLimits.resetRequestsAt || 0, groqLimits.resetTokensAt || 0);
      if (latestReset && groqNow > latestReset + 2000 && groqTimer) {
        window.clearInterval(groqTimer);
        groqTimer = null;
      }
    }, 1000);
  }

  function handleThemeConfig(event) {
    applyAppearanceConfig(event.detail || {});
  }

  onMount(() => {
    locationContext = window.location;
    syncNavLinks();
    document.addEventListener('inti:theme-config', handleThemeConfig);
    void handleLoad();
  });

  onDestroy(() => {
    document.removeEventListener('inti:theme-config', handleThemeConfig);
    if (groqTimer) window.clearInterval(groqTimer);
  });
</script>

<PageShell badge="Settings" {navLinks}>
  <div class="card">
    <div class="info-row">
      <span class="pill">Summarizer</span>
      <span class="ocr-hint">Choose which AI provider to use for summarization</span>
    </div>
    <div class="settings-form">
      <div class="settings-field">
        <label class="settings-label" for="sum-provider-select">Active provider</label>
        <div class="select-wrap">
          <select id="sum-provider-select" bind:value={provider} title="Active summarizer provider" on:change={handleProviderChange}>
            {#each providerOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </div>
      </div>
      <div class="settings-field" hidden={modelOptions.length === 0}>
        <label class="settings-label" for="sum-model-select">Model</label>
        <div class="select-wrap">
          <select id="sum-model-select" bind:value={model} title="Active summarizer model">
            {#each modelOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="info-row">
      <span class="pill">Appearance</span>
      <span class="ocr-hint">Save interface defaults in the server config</span>
    </div>
    <div class="settings-form">
      <div class="settings-field">
        <label class="settings-label" for="appearance-theme-select">Theme</label>
        <div class="select-wrap">
          <select id="appearance-theme-select" bind:value={theme} title="Server theme" on:change={handleThemePreview}>
            {#each themeOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </div>
        <p class="settings-hint">
          A saved server theme overrides each browser's local theme after the page loads.
        </p>
      </div>
      <div class="settings-field">
        <label class="settings-label" for="summary-download-format-select">Summary download format</label>
        <div class="select-wrap">
          <select id="summary-download-format-select" bind:value={summaryDownloadFormat} title="Default summary download format">
            {#each summaryFormatOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </div>
        <p class="settings-hint">
          Sets the default format used by the Summary download button on the main page.
        </p>
      </div>
      <div class="settings-field">
        <label class="settings-label" for="ocr-promotion-behavior-select">OCR promotion default</label>
        <div class="select-wrap">
          <select id="ocr-promotion-behavior-select" bind:value={ocrPromotionBehavior} title="Default OCR promotion behavior">
            {#each promotionOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </div>
        <p class="settings-hint">
          Sets the default action when promoting an OCR result into the main workspace.
        </p>
      </div>
      <div class="settings-field">
        <label class="settings-label" for="summary-promotion-behavior-select">Summary promotion default</label>
        <div class="select-wrap">
          <select id="summary-promotion-behavior-select" bind:value={summaryPromotionBehavior} title="Default summary promotion behavior">
            {#each promotionOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </div>
        <p class="settings-hint">
          Sets the default action when promoting a summary result into the main workspace.
        </p>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="info-row">
      <span class="pill">Providers</span>
      <span class="ocr-hint">Store per-provider API keys used by the summarizer</span>
    </div>

    <div class="provider-sections">
      <section class="provider-section">
        <div class="provider-section-header">
          <div>
            <h2 class="provider-section-title">Gemini</h2>
            <p class="provider-section-subtitle">Google AI Studio</p>
          </div>
        </div>
        <div class="settings-form">
          <div class="settings-field">
            <label class="settings-label" for="key-gemini">API Key</label>
            <div class="settings-key-row">
              <input type={revealGeminiKey ? 'text' : 'password'} id="key-gemini" class="settings-key-input" bind:value={keyGemini} placeholder="AIza…" autocomplete="off" />
              <button
                type="button"
                class="settings-key-toggle"
                aria-label={keyVisibilityLabel(revealGeminiKey, 'Gemini')}
                aria-pressed={revealGeminiKey}
                on:click={() => (revealGeminiKey = !revealGeminiKey)}
              >
                <span class={`icon ${revealGeminiKey ? 'icon-eye-off' : 'icon-eye'}`} aria-hidden="true"></span>
              </button>
            </div>
            <p class="settings-hint">
              Get your key at
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" class="settings-link">aistudio.google.com</a>
            </p>
          </div>
        </div>
      </section>

      <hr class="provider-divider" />

      <section class="provider-section">
        <div class="provider-section-header">
          <div>
            <h2 class="provider-section-title">Groq</h2>
            <p class="provider-section-subtitle">Free tier · no billing required</p>
          </div>
          <div class="provider-section-actions">
            <div class="usage-popover">
              <button type="button" class="usage-trigger" aria-label="View Groq usage">
                <span class="icon icon-bolt" aria-hidden="true"></span>
                <span>Usage</span>
              </button>

              <div class="rate-usage-section" hidden={!groqLimits}>
                {#if groqLimits}
                  <div class="rate-usage-header">
                    <span class="rate-usage-title">Current Usage</span>
                    <span class="rate-usage-ts">
                      {#if groqLimits.capturedAt}
                        Updated {fmtAgo(groqNow - groqLimits.capturedAt)}
                      {/if}
                    </span>
                  </div>
                  <div class="rate-usage-row">
                    <span class="rate-usage-label">Requests remaining today (RPD)</span>
                    <div class="rate-usage-bar-wrap">
                      <div class="rate-usage-bar">
                        <div
                          class:low={Number(groqLimits.limitRequests) > 0 && Math.round((Number(groqLimits.remainingRequests) / Number(groqLimits.limitRequests)) * 100) < 20}
                          class="rate-usage-bar-fill"
                          style={`width:${Number(groqLimits.limitRequests) > 0 ? Math.round((Number(groqLimits.remainingRequests) / Number(groqLimits.limitRequests)) * 100) : 0}%`}
                        ></div>
                      </div>
                      <span class="rate-usage-numbers">
                        {Number(groqLimits.remainingRequests || 0).toLocaleString()} / {Number(groqLimits.limitRequests || 0).toLocaleString()}
                      </span>
                    </div>
                    <span class="rate-usage-reset">
                      {#if groqLimits.resetRequestsAt}
                        Resets in {fmtDuration(groqLimits.resetRequestsAt - groqNow)}
                      {/if}
                    </span>
                  </div>
                  <div class="rate-usage-row">
                    <span class="rate-usage-label">Tokens remaining this minute (TPM)</span>
                    <div class="rate-usage-bar-wrap">
                      <div class="rate-usage-bar">
                        <div
                          class:low={Number(groqLimits.limitTokens) > 0 && Math.round((Number(groqLimits.remainingTokens) / Number(groqLimits.limitTokens)) * 100) < 20}
                          class="rate-usage-bar-fill"
                          style={`width:${Number(groqLimits.limitTokens) > 0 ? Math.round((Number(groqLimits.remainingTokens) / Number(groqLimits.limitTokens)) * 100) : 0}%`}
                        ></div>
                      </div>
                      <span class="rate-usage-numbers">
                        {Number(groqLimits.remainingTokens || 0).toLocaleString()} / {Number(groqLimits.limitTokens || 0).toLocaleString()}
                      </span>
                    </div>
                    <span class="rate-usage-reset">
                      {#if groqLimits.resetTokensAt}
                        Resets in {fmtDuration(groqLimits.resetTokensAt - groqNow)}
                      {/if}
                    </span>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        </div>
        <div class="settings-form">
          <div class="settings-field">
            <label class="settings-label" for="key-groq">API Key</label>
            <div class="settings-key-row">
              <input type={revealGroqKey ? 'text' : 'password'} id="key-groq" class="settings-key-input" bind:value={keyGroq} placeholder="gsk_…" autocomplete="off" />
              <button
                type="button"
                class="settings-key-toggle"
                aria-label={keyVisibilityLabel(revealGroqKey, 'Groq')}
                aria-pressed={revealGroqKey}
                on:click={() => (revealGroqKey = !revealGroqKey)}
              >
                <span class={`icon ${revealGroqKey ? 'icon-eye-off' : 'icon-eye'}`} aria-hidden="true"></span>
              </button>
            </div>
            <p class="settings-hint">
              Get your key at
              <a href="https://console.groq.com/keys" target="_blank" rel="noopener" class="settings-link">console.groq.com</a>
              <span class="settings-hint-separator">·</span>
              <a href="https://console.groq.com/docs/rate-limits" target="_blank" rel="noopener" class="settings-link">Rate limits ↗</a>
            </p>
          </div>
        </div>
      </section>

      <hr class="provider-divider" />

      <section class="provider-section">
        <div class="provider-section-header">
          <div>
            <h2 class="provider-section-title">OpenRouter</h2>
            <p class="provider-section-subtitle">Free models available · no credits consumed</p>
          </div>
        </div>
        <div class="settings-form">
          <div class="settings-field">
            <label class="settings-label" for="key-openrouter">API Key</label>
            <div class="settings-key-row">
              <input type={revealOpenRouterKey ? 'text' : 'password'} id="key-openrouter" class="settings-key-input" bind:value={keyOpenRouter} placeholder="sk-or-…" autocomplete="off" />
              <button
                type="button"
                class="settings-key-toggle"
                aria-label={keyVisibilityLabel(revealOpenRouterKey, 'OpenRouter')}
                aria-pressed={revealOpenRouterKey}
                on:click={() => (revealOpenRouterKey = !revealOpenRouterKey)}
              >
                <span class={`icon ${revealOpenRouterKey ? 'icon-eye-off' : 'icon-eye'}`} aria-hidden="true"></span>
              </button>
            </div>
            <p class="settings-hint">
              Get your key at
              <a href="https://openrouter.ai/keys" target="_blank" rel="noopener" class="settings-link">openrouter.ai/keys</a>
            </p>
          </div>
        </div>
      </section>
    </div>
  </div>

  <div class="settings-actions-row" style="padding-bottom: 32px">
    <button id="sum-save-btn" class="btn-primary" on:click={handleSave}>Save</button>
    <button id="sum-clear-btn" class="btn-secondary" on:click={handleClear}>Clear Provider Settings</button>
    <span class:error={statusError} class="status-text">{statusMessage}</span>
  </div>
</PageShell>
