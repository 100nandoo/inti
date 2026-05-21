<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import PageShell from '../components/PageShell.svelte';
  import { createProtectedPage } from '../lib/protected-page.js';
  import { getSummarizerModels } from '../lib/summarizer-models.js';
  import {
    clearSummarizerSettings,
    loadSettings,
    saveSettings,
  } from '../lib/settings-service.js';
  import type { PageShellNavLink } from '../lib/page-shell-contracts';
  import type {
    AppearanceSettingsInput,
    AppearanceSettingsPayload,
    ProviderDisplayName,
    SettingsOption,
    SummarizerModelOption,
    SummarizerProvider,
    SummarizerSettingsInput,
    SummarizerSettingsPayload,
    ThemeChoice,
  } from '../lib/settings-contracts';
  import type {
    GroqRateLimits,
    SummaryDownloadFormat,
    SummarizerKeys,
  } from '../lib/workspace-contracts';

  type StatusState = {
    message: string;
    isError: boolean;
  };

  type GroqTimerState = ReturnType<typeof window.setInterval> | null;

  const providerOptions: SettingsOption<SummarizerProvider>[] = [
    { value: '', label: 'Server default' },
    { value: 'gemini', label: 'Gemini' },
    { value: 'groq', label: 'Groq' },
    { value: 'openrouter', label: 'OpenRouter' },
    { value: 'mock', label: 'Mock (Testing)' },
  ];

  const themeOptions: SettingsOption<ThemeChoice>[] = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ];

  const summaryFormatOptions: SettingsOption<SummaryDownloadFormat>[] = [
    { value: 'txt', label: 'Plain text (.txt)' },
    { value: 'md', label: 'Markdown (.md)' },
  ];

  const protectedPage = createProtectedPage({
    navItems: [
      {
        path: '/',
        label: 'Back',
        title: 'Back to app',
        iconClass: 'icon-chevron-left',
        placement: 'start',
      },
    ],
  });

  let navLinks: PageShellNavLink[] = [];

  let provider: SummarizerProvider = '';
  let model = '';
  let modelOptions: SummarizerModelOption[] = [];
  let theme: ThemeChoice = 'dark';
  let summaryDownloadFormat: SummaryDownloadFormat = 'md';
  let keyGemini = '';
  let keyGroq = '';
  let keyOpenRouter = '';
  let revealGeminiKey = false;
  let revealGroqKey = false;
  let revealOpenRouterKey = false;
  let groqLimits: GroqRateLimits | null = null;
  let groqNow = Date.now();
  let status: StatusState = { message: '', isError: false };

  let groqTimer: GroqTimerState = null;

  function readErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }

  function normalizeProvider(value?: string): SummarizerProvider {
    switch (value) {
      case 'gemini':
      case 'groq':
      case 'openrouter':
      case 'mock':
        return value;
      default:
        return '';
    }
  }

  function normalizeThemeChoice(value?: string): ThemeChoice {
    return value === 'light' ? 'light' : 'dark';
  }

  function normalizeSummaryDownloadFormat(value?: string): SummaryDownloadFormat {
    return value === 'txt' ? 'txt' : 'md';
  }

  function setStatus(message: string, isError = false): void {
    status = { message, isError };
    if (!message) return;
    window.setTimeout(() => {
      if (status.message === message) {
        status = { message: '', isError: false };
      }
    }, 2000);
  }

  function applySummarizerConfig(config: SummarizerSettingsInput): void {
    provider = normalizeProvider(config.provider);
    model = config.model || '';
    keyGemini = config.keys?.gemini || '';
    keyGroq = config.keys?.groq || '';
    keyOpenRouter = config.keys?.openrouter || '';
    groqLimits = config.groqLimits || null;
    resetGroqTimer();
  }

  function applyAppearanceConfig(config: AppearanceSettingsInput): void {
    theme = normalizeThemeChoice(config.theme);
    summaryDownloadFormat = normalizeSummaryDownloadFormat(config.summaryDownloadFormat);
  }

  async function refreshModelOptions(selectedProvider: SummarizerProvider, selectedModel = ''): Promise<void> {
    if (!selectedProvider || selectedProvider === 'openrouter') {
      modelOptions = [];
      model = '';
      return;
    }

    try {
      modelOptions = (await getSummarizerModels(selectedProvider)) as SummarizerModelOption[];
    } catch (error) {
      modelOptions = [];
      setStatus(readErrorMessage(error), true);
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

  function themeConfigPayload(): AppearanceSettingsPayload {
    return {
      theme,
      summaryDownloadFormat,
      ocrPromotionBehavior: 'replace',
      summaryPromotionBehavior: 'replace',
    };
  }

  function summarizerKeysPayload(): SummarizerKeys {
    return {
      gemini: keyGemini.trim(),
      groq: keyGroq.trim(),
      openrouter: keyOpenRouter.trim(),
    };
  }

  async function handleLoad(): Promise<void> {
    try {
      const result = await loadSettings({ apiURL: protectedPage.apiURL });
      applySummarizerConfig(result.summarizerConfig);
      applyAppearanceConfig(result.appearanceConfig);
      await refreshModelOptions(provider, model);
    } catch (error) {
      setStatus(readErrorMessage(error), true);
    }
  }

  async function handleSave(): Promise<void> {
    try {
      const result = await saveSettings({
        apiURL: protectedPage.apiURL,
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
      setStatus(readErrorMessage(error), true);
    }
  }

  async function handleClear(): Promise<void> {
    try {
      applySummarizerConfig(await clearSummarizerSettings({ apiURL: protectedPage.apiURL }));
      await refreshModelOptions(provider, model);
      setStatus('Cleared');
    } catch (error) {
      setStatus(readErrorMessage(error), true);
    }
  }

  async function handleProviderChange(): Promise<void> {
    await refreshModelOptions(provider);
  }

  function keyVisibilityLabel(showing: boolean, providerName: ProviderDisplayName): string {
    return `${showing ? 'Hide' : 'Show'} ${providerName} API key`;
  }

  function handleThemePreview(): void {
    if (theme) {
      window.IntiTheme?.apply?.(theme);
      window.IntiTheme?.persist?.(theme);
    }
  }

  function fmtDuration(ms: number): string {
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

  function fmtAgo(ms: number): string {
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
    return `${Math.round(seconds / 3600)}h ago`;
  }

  function resetGroqTimer(): void {
    if (groqTimer) {
      window.clearInterval(groqTimer);
      groqTimer = null;
    }

    const currentGroqLimits = groqLimits;
    if (!currentGroqLimits) return;

    groqNow = Date.now();
    groqTimer = window.setInterval(() => {
      groqNow = Date.now();
      const latestReset = Math.max(currentGroqLimits.resetRequestsAt || 0, currentGroqLimits.resetTokensAt || 0);
      if (latestReset && groqNow > latestReset + 2000 && groqTimer) {
        window.clearInterval(groqTimer);
        groqTimer = null;
      }
    }, 1000);
  }

  function handleThemeConfig(event: Event): void {
    if (event instanceof CustomEvent) {
      applyAppearanceConfig((event.detail || {}) as AppearanceSettingsInput);
      return;
    }
    applyAppearanceConfig({});
  }

  onMount(() => {
    navLinks = protectedPage.navLinks();
    document.addEventListener('inti:theme-config', handleThemeConfig);
    void handleLoad();
  });

  onDestroy(() => {
    document.removeEventListener('inti:theme-config', handleThemeConfig);
    if (groqTimer) window.clearInterval(groqTimer);
  });
</script>

<PageShell {navLinks}>
  <section class="card inti-page-card">
    <div class="card-body gap-5">
      <div class="inti-section-heading">
        <span class="inti-kicker">Runtime Settings</span>
        <span class="inti-muted">Save appearance defaults and summarizer behavior in the server config.</span>
      </div>

      <div class="alert border border-base-300/70 bg-base-200/50 text-base-content/80">
        <span>
          Visual Theme saves only explicit <strong>light</strong> or <strong>dark</strong> values. Missing or legacy values fall back to dark.
        </span>
      </div>
    </div>
  </section>

  <section class="card inti-page-card">
    <div class="card-body gap-6">
      <div class="inti-section-heading">
        <span class="inti-kicker">Summarizer</span>
        <span class="inti-muted">Choose which AI provider and model power summaries.</span>
      </div>

      <div class="inti-form-grid">
        <fieldset class="inti-field">
          <legend class="inti-field-legend">Active provider</legend>
          <select class="select select-bordered w-full" id="sum-provider-select" data-inti-dropdown bind:value={provider} title="Active summarizer provider" on:change={handleProviderChange}>
            {#each providerOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </fieldset>
        <fieldset class="inti-field" hidden={modelOptions.length === 0}>
          <legend class="inti-field-legend">Model</legend>
          <select class="select select-bordered w-full" id="sum-model-select" data-inti-dropdown bind:value={model} title="Active summarizer model">
            {#each modelOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </fieldset>
      </div>
    </div>
  </section>

  <section class="card inti-page-card">
    <div class="card-body gap-6">
      <div class="inti-section-heading">
        <span class="inti-kicker">Appearance</span>
        <span class="inti-muted">Choose how saved workspace defaults behave when new pages load.</span>
      </div>

      <div class="inti-form-grid">
        <fieldset class="inti-field">
          <legend class="inti-field-legend">Visual Theme</legend>
          <select class="select select-bordered w-full" id="appearance-theme-select" data-inti-dropdown bind:value={theme} title="Server theme" on:change={handleThemePreview}>
            {#each themeOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
          <p class="inti-field-help">Applies immediately for preview and persists as the saved interface default.</p>
        </fieldset>
        <fieldset class="inti-field">
          <legend class="inti-field-legend">Summary download format</legend>
          <select class="select select-bordered w-full" id="summary-download-format-select" data-inti-dropdown bind:value={summaryDownloadFormat} title="Default summary download format">
            {#each summaryFormatOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
          <p class="inti-field-help">Sets the default format used by the Summary download action on the main page.</p>
        </fieldset>
      </div>
    </div>
  </section>

  <section class="card inti-page-card">
    <div class="card-body gap-6">
      <div class="inti-section-heading">
        <span class="inti-kicker">Providers</span>
        <span class="inti-muted">Store per-provider API keys used by the summarizer.</span>
      </div>

      <div class="inti-provider-stack">
        <section class="provider-section inti-provider-card">
          <div class="provider-section-header inti-provider-header">
            <div>
              <h2 class="provider-section-title">Gemini</h2>
              <p class="provider-section-subtitle">Google AI Studio</p>
            </div>
          </div>
          <div class="settings-form">
            <div class="settings-field">
              <label class="settings-label" for="key-gemini">API Key</label>
              <div class="settings-key-row inti-key-row">
                <input type={revealGeminiKey ? 'text' : 'password'} id="key-gemini" class="input input-bordered w-full settings-key-input" bind:value={keyGemini} placeholder="AIza…" autocomplete="off" />
                <button
                  type="button"
                  class="settings-key-toggle btn btn-square btn-ghost"
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

        <section class="provider-section inti-provider-card">
          <div class="provider-section-header inti-provider-header">
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
              <div class="settings-key-row inti-key-row">
                <input type={revealGroqKey ? 'text' : 'password'} id="key-groq" class="input input-bordered w-full settings-key-input" bind:value={keyGroq} placeholder="gsk_…" autocomplete="off" />
                <button
                  type="button"
                  class="settings-key-toggle btn btn-square btn-ghost"
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

        <section class="provider-section inti-provider-card">
          <div class="provider-section-header inti-provider-header">
            <div>
              <h2 class="provider-section-title">OpenRouter</h2>
              <p class="provider-section-subtitle">Free models available · no credits consumed</p>
            </div>
          </div>
          <div class="settings-form">
            <div class="settings-field">
              <label class="settings-label" for="key-openrouter">API Key</label>
              <div class="settings-key-row inti-key-row">
                <input type={revealOpenRouterKey ? 'text' : 'password'} id="key-openrouter" class="input input-bordered w-full settings-key-input" bind:value={keyOpenRouter} placeholder="sk-or-…" autocomplete="off" />
                <button
                  type="button"
                  class="settings-key-toggle btn btn-square btn-ghost"
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
  </section>

  <div class="settings-actions-row inti-actions">
    <button id="sum-save-btn" class="btn-primary btn btn-primary" on:click={handleSave}>Save</button>
    <button id="sum-clear-btn" class="btn-secondary btn btn-ghost border border-base-300" on:click={handleClear}>Clear Provider Settings</button>
    <span class:error={status.isError} class="status-text">{status.message}</span>
  </div>
</PageShell>
