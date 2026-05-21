<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import PageShell from '../components/PageShell.svelte';
  import type { PageShellNavLink } from '../lib/page-shell-contracts';
  import {
    applyAppearanceConfig,
    applySummarizerConfig,
    getSelectedSummarizerModel,
    getSelectedSummarizerProvider,
    promoteLatestTextResult,
    setGroqRateLimits,
    setInputMode,
    setLatestTextResult,
    setProcessing,
    setSelectedSummarizerSelection,
    setWorkingText,
    setWorkingTextRunMode,
    workspaceStore,
  } from '../lib/workspace-state.js';
  import { copyLatestResultText, downloadLatestResult } from '../lib/result-surface.js';
  import {
    buildMainWorkspaceViewModel,
    buildPromotionStatusMessage,
    executeMainWorkspaceSummary,
  } from '../lib/main-workspace-flow.js';
  import {
    buildMainWorkspaceProviderOptions,
    loadMainWorkspaceModelOptions,
    loadMainWorkspaceSummarizerConfig,
    saveMainWorkspaceSummarizerConfig,
  } from '../lib/main-workspace-summary-controls.js';
  import type { SummaryDownloadFormat, WorkspaceState } from '../lib/workspace-contracts';
  import { addFeed, setStatus, updateFeedItem } from '../../../web/js/feed.js';

  export let navLinks: PageShellNavLink[] = [];

  type SummaryOption = { value: string; label: string };

  let workspace: WorkspaceState;
  let summaryDownloadFormat: SummaryDownloadFormat = 'md';
  let resultDownloadMenuOpen = false;
  let resultCopyLabel = 'Copy';
  let resultDownloadGroup: HTMLDivElement | null = null;
  let resetCopyLabelTimer: ReturnType<typeof window.setTimeout> | null = null;
  let providerOptions: SummaryOption[] = [{ value: '', label: 'Server default' }];
  let modelOptions: SummaryOption[] = [];
  let summaryModelHidden = true;
  let summaryControlsRequestKey = 0;

  const unsubscribeWorkspace = workspaceStore.subscribe((value) => {
    workspace = value;
  });

  function normalizeSummaryDownloadFormat(value?: string): SummaryDownloadFormat {
    return value === 'txt' ? 'txt' : 'md';
  }

  function applyThemeConfig(config?: typeof window.IntiTheme): void {
    applyAppearanceConfig(config || {});
    summaryDownloadFormat = normalizeSummaryDownloadFormat(config?.summaryDownloadFormat);
  }

  function closeResultDownloadMenu(): void {
    resultDownloadMenuOpen = false;
  }

  function handleDocumentClick(event: MouseEvent): void {
    if (!resultDownloadGroup?.contains(event.target as Node)) {
      closeResultDownloadMenu();
    }
  }

  function handleThemeConfigEvent(event: Event): void {
    const customEvent = event as CustomEvent<typeof window.IntiTheme>;
    applyThemeConfig(customEvent.detail || {});
  }

  async function syncSummarizerControls(preferredProvider?: string, preferredModel?: string): Promise<void> {
    const requestKey = ++summaryControlsRequestKey;
    const options = buildMainWorkspaceProviderOptions(workspace.summarizerConfig);
    providerOptions = options;

    const configuredProvider = preferredProvider !== undefined
      ? preferredProvider
      : (workspace.selectedSummarizerProvider || workspace.summarizerConfig.provider || '');
    const nextProvider = options.some((option) => option.value === configuredProvider) ? configuredProvider : '';
    const configuredModel = preferredModel !== undefined
      ? preferredModel
      : (workspace.selectedSummarizerModel || workspace.summarizerConfig.model || '');
    const { hidden, options: nextModelOptions, selectedModel } = await loadMainWorkspaceModelOptions({
      provider: nextProvider,
      selectedModel: configuredModel,
    });

    if (requestKey !== summaryControlsRequestKey) return;

    modelOptions = nextModelOptions as SummaryOption[];
    summaryModelHidden = hidden;
    setSelectedSummarizerSelection(nextProvider, selectedModel);
  }

  async function saveSummarizerSelection(provider: string, model: string): Promise<void> {
    const summarizerConfig = await saveMainWorkspaceSummarizerConfig({
      apiURL: window.apiURL || ((path: string) => path),
      provider,
      model,
      keys: workspace.summarizerConfig.keys,
    });
    applySummarizerConfig(summarizerConfig);
  }

  async function initializeSummarizerControls(): Promise<void> {
    try {
      const summarizerConfig = await loadMainWorkspaceSummarizerConfig({
        apiURL: window.apiURL || ((path: string) => path),
      });
      applySummarizerConfig(summarizerConfig);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load summarizer settings.';
      setStatus(message, 'error');
    }

    await syncSummarizerControls();
  }

  async function handleProviderChange(provider: string): Promise<void> {
    const currentModel = provider === 'openrouter' ? '' : workspace.selectedSummarizerModel;
    await syncSummarizerControls(provider, currentModel);

    try {
      await saveSummarizerSelection(provider, provider === 'openrouter' ? '' : getSelectedSummarizerModel());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save summarizer settings.';
      setStatus(message, 'error');
    }
  }

  async function handleModelChange(model: string): Promise<void> {
    setSelectedSummarizerSelection(workspace.selectedSummarizerProvider, model);

    try {
      await saveSummarizerSelection(workspace.selectedSummarizerProvider, model);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save summarizer settings.';
      setStatus(message, 'error');
    }
  }

  async function summarizeWorkingText(): Promise<void> {
    const text = workspace.workingText.trim();
    if (!text || workspace.processing || workspace.inputMode !== 'working-text' || workspace.workingTextRunMode !== 'summary') {
      return;
    }

    setProcessing(true);
    setStatus('Summarizing…');
    const feedItem = addFeed('info', 'Working Text', 'summarizing…');

    try {
      const apiURL = window.apiURL || ((path: string) => path);
      const { rateLimits, summaryResult, feedLabel, feedMeta } = await executeMainWorkspaceSummary({
        apiURL,
        text,
        provider: getSelectedSummarizerProvider(),
        model: getSelectedSummarizerModel(),
      });
      if (rateLimits) setGroqRateLimits(rateLimits);
      setLatestTextResult(summaryResult);
      setStatus('Summary result ready for review.', 'success');
      updateFeedItem(feedItem, 'ok', feedLabel, feedMeta);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setStatus(message, 'error');
      updateFeedItem(feedItem, 'fail', 'Working Text', message);
    } finally {
      setProcessing(false);
    }
  }

  function handlePromoteLatestTextResult(): void {
    if (!promoteLatestTextResult('replace')) return;
    setInputMode('working-text');
    setStatus(buildPromotionStatusMessage(workspace.latestTextResult.kind), 'success');
  }

  async function handleCopyLatestResult(): Promise<void> {
    const copied = await copyLatestResultText(workspace.latestTextResult);
    if (!copied) return;

    resultCopyLabel = 'Copied!';
    if (resetCopyLabelTimer) {
      window.clearTimeout(resetCopyLabelTimer);
    }
    resetCopyLabelTimer = window.setTimeout(() => {
      resultCopyLabel = 'Copy';
      resetCopyLabelTimer = null;
    }, 1500);
  }

  function handleDownloadLatestResult(format: SummaryDownloadFormat = summaryDownloadFormat): void {
    if (workspace.processing) return;
    downloadLatestResult(workspace.latestTextResult, format);
    closeResultDownloadMenu();
  }

  onMount(() => {
    applyThemeConfig(window.IntiTheme);
    document.addEventListener('inti:theme-config', handleThemeConfigEvent);
    document.addEventListener('click', handleDocumentClick);
    void initializeSummarizerControls();
  });

  onDestroy(() => {
    unsubscribeWorkspace();
    document.removeEventListener('inti:theme-config', handleThemeConfigEvent);
    document.removeEventListener('click', handleDocumentClick);
    if (resetCopyLabelTimer) {
      window.clearTimeout(resetCopyLabelTimer);
    }
  });

  $: mainWorkspaceViewModel = buildMainWorkspaceViewModel(workspace);
  $: resultViewModel = mainWorkspaceViewModel.resultViewModel;
  $: isOcrMode = mainWorkspaceViewModel.isOcrMode;
  $: isWorkingTextMode = mainWorkspaceViewModel.isWorkingTextMode;
  $: isSummaryMode = mainWorkspaceViewModel.isSummaryMode;
  $: isVoiceMode = mainWorkspaceViewModel.isVoiceMode;
  $: hasWorkingText = mainWorkspaceViewModel.hasWorkingText;
  $: textResultCharacterCount = mainWorkspaceViewModel.textResultCharacterCount;
</script>

<PageShell {navLinks}>
  <div class="main-grid">
    <section class="panel panel-workspace inti-workspace-card card bg-base-100/90 shadow-2xl shadow-base-content/10" id="ocr-card">
      <div class="section-heading inti-panel-heading">
        <span class="ornament inti-panel-ornament" aria-hidden="true"></span>
        <h2>Text Workspace</h2>
        <span class="source-chip badge badge-warning badge-outline">One working text</span>
      </div>
      <div class="input-mode-toggle inti-input-mode-toggle" role="tablist" aria-label="Input mode">
        <button
          id="input-mode-ocr-btn"
          class="input-mode-btn"
          class:is-active={isOcrMode}
          type="button"
          role="tab"
          aria-selected={isOcrMode}
          aria-controls="ocr-input-panel"
          on:click={() => setInputMode('ocr')}
        >
          OCR
        </button>
        <button
          id="input-mode-working-text-btn"
          class="input-mode-btn"
          class:is-active={!isOcrMode}
          type="button"
          role="tab"
          aria-selected={!isOcrMode}
          aria-controls="working-text-panel"
          on:click={() => setInputMode('working-text')}
        >
          Working Text
        </button>
      </div>

      <div id="ocr-input-panel" class="input-mode-panel" hidden={!isOcrMode}>
        <div class="drop-zone inti-surface" id="drop-zone" role="button" tabindex="0" aria-label="Import images for OCR">
          <span class="icon icon-upload-cloud drop-zone-icon" aria-hidden="true"></span>
          <p>Import images for OCR<br />or click to <label for="file-input" class="file-label">browse</label></p>
          <span class="drop-hint" id="drop-hint">PNG, JPG, JPEG, WEBP, TIFF up to 25MB</span>
          <input type="file" id="file-input" accept=".png,.jpg,.jpeg,.webp,.tif,.tiff,image/png,image/jpeg,image/webp,image/tiff" multiple hidden />
        </div>

        <div id="file-staging" class="inti-surface" hidden>
          <div class="field-head">
            <span>Staged files</span>
            <span id="staged-count">0 files</span>
          </div>
          <ul id="file-list"></ul>
          <div class="staging-actions inti-action-row">
            <button id="clear-files-btn" class="btn-secondary btn btn-ghost border border-base-300 icon-only" title="Clear staged files">
              <span class="icon icon-trash" aria-hidden="true"></span>
            </button>
            <button id="run-ocr-btn" class="btn-primary btn btn-primary">
              <span aria-hidden="true">--</span>
              Extract Text
              <span class="icon icon-bolt" aria-hidden="true"></span>
            </button>
          </div>
        </div>
      </div>

      <div id="working-text-panel" class="field-block inti-surface ocr-output-block input-mode-panel" hidden={isOcrMode}>
        <div class="field-head">
          <span>Working Text</span>
          <span id="working-text-count">{workspace.workingText.length} characters</span>
        </div>
        <textarea
          id="working-text"
          rows="9"
          placeholder="Paste or build text here. OCR and summarization operate on this text by default."
          value={workspace.workingText}
          disabled={workspace.processing}
          on:input={(event) => setWorkingText((event.currentTarget as HTMLTextAreaElement).value)}
        ></textarea>
      </div>

      <div id="working-text-run-panel" class="inti-control-band working-text-run-panel" hidden={!isWorkingTextMode}>
        <div class="run-mode-toggle" role="tablist" aria-label="Working Text run mode">
          <button
            id="run-mode-summary-btn"
            class="run-mode-btn"
            class:is-active={isSummaryMode}
            type="button"
            role="tab"
            aria-selected={isSummaryMode}
            aria-controls="summary-run-panel"
            on:click={() => setWorkingTextRunMode('summary')}
          >
            Summary
          </button>
          <button
            id="run-mode-voice-btn"
            class="run-mode-btn"
            class:is-active={isVoiceMode}
            type="button"
            role="tab"
            aria-selected={isVoiceMode}
            aria-controls="summary-run-panel"
            on:click={() => setWorkingTextRunMode('voice')}
          >
            Voice
          </button>
        </div>

        <div id="summary-run-panel" class="run-mode-panel" hidden={!isSummaryMode}>
          <div class="run-config-row">
            <div class="select-wrap provider-wrap inti-select-wrap">
              <select
                class="select select-bordered"
                id="provider-select"
                data-inti-dropdown
                title="Summarizer provider"
                value={workspace.selectedSummarizerProvider}
                on:change={(event) => {
                  void handleProviderChange((event.currentTarget as HTMLSelectElement).value);
                }}
              >
                {#each providerOptions as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            </div>
            <div class="select-wrap provider-wrap inti-select-wrap" id="sum-model-wrap" hidden={summaryModelHidden}>
              <select
                class="select select-bordered"
                id="sum-model-select"
                data-inti-dropdown
                title="Summarizer model"
                value={workspace.selectedSummarizerModel}
                on:change={(event) => {
                  void handleModelChange((event.currentTarget as HTMLSelectElement).value);
                }}
              >
                {#each modelOptions as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            </div>
          </div>

          <div class="run-action-row">
            <button
              id="clear-workspace-btn"
              class="btn-secondary btn btn-ghost border border-base-300"
              title="Clear working text"
              disabled={workspace.processing || !hasWorkingText || !isSummaryMode}
              on:click={() => {
                setWorkingText('');
                setStatus('Working text cleared.', 'success');
              }}
            >
              <span class="icon icon-x" aria-hidden="true"></span>
              Clear
            </button>
            <button
              id="summarize-btn"
              class="btn-primary btn btn-primary"
              title="Summarize source text"
              disabled={workspace.processing || !hasWorkingText || !isSummaryMode}
              on:click={() => {
                void summarizeWorkingText();
              }}
            >
              <span class="icon icon-bolt" aria-hidden="true"></span>
              <span>Summarize</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="panel panel-result inti-workspace-card card bg-base-100/90 shadow-2xl shadow-base-content/10">
      <div class="section-heading inti-panel-heading">
        <span class="ornament inti-panel-ornament" aria-hidden="true"></span>
        <h2>Latest Text Result</h2>
        <span class="source-chip badge badge-outline" id="text-result-kind-chip">{resultViewModel.kindChip}</span>
      </div>

      <div id="text-result" class="field-block inti-surface">
        <div class="field-head">
          <span id="text-result-title">{resultViewModel.title}</span>
          <span id="text-result-count">{textResultCharacterCount} characters</span>
        </div>
        <div id="text-result-content" class="summary-markdown">{@html resultViewModel.contentHtml}</div>
        <div class="summary-actions result-actions inti-action-row">
          <button
            id="result-promote-default-btn"
            class="btn-primary btn btn-primary"
            disabled={workspace.processing || !resultViewModel.hasResult}
            on:click={handlePromoteLatestTextResult}
          >
            <span class="icon icon-arrow-up" aria-hidden="true"></span>
            <span id="result-promote-default-label">{resultViewModel.defaultPromotionLabel}</span>
          </button>
          <button
            id="result-copy-btn"
            class="btn-secondary btn btn-ghost border border-base-300"
            disabled={workspace.processing || !resultViewModel.hasResult}
            on:click={() => {
              void handleCopyLatestResult();
            }}
          >
            <span class="icon icon-copy" aria-hidden="true"></span>
            <span id="result-copy-label">{resultCopyLabel}</span>
          </button>
          <div
            class="dropdown dropdown-top dropdown-end split-button inti-split-button"
            class:dropdown-open={resultDownloadMenuOpen}
            class:is-open={resultDownloadMenuOpen}
            id="result-download-group"
            bind:this={resultDownloadGroup}
          >
            <button
              id="result-download-btn"
              class="btn-secondary btn btn-ghost border border-base-300 split-button-main"
              disabled={workspace.processing || !resultViewModel.hasResult}
              on:click={() => handleDownloadLatestResult()}
            >
              <span class="icon icon-download" aria-hidden="true"></span>
              Download
            </button>
            <button
              id="result-download-toggle"
              class="btn-secondary btn btn-ghost border border-base-300 split-button-toggle"
              aria-haspopup="menu"
              aria-expanded={resultDownloadMenuOpen}
              aria-controls="result-download-menu"
              title="Choose download format"
              disabled={workspace.processing || !resultViewModel.hasResult}
              on:click|stopPropagation={() => {
                if (workspace.processing || !resultViewModel.hasResult) return;
                resultDownloadMenuOpen = !resultDownloadMenuOpen;
              }}
            >
              <span class="icon icon-chevron-down" aria-hidden="true"></span>
            </button>
            <ul
              id="result-download-menu"
              class="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm split-menu"
              role="menu"
              hidden={!resultDownloadMenuOpen}
              on:keydown={(event) => {
                if (event.key === 'Escape') {
                  closeResultDownloadMenu();
                  (document.getElementById('result-download-toggle') as HTMLButtonElement | null)?.focus();
                }
              }}
            >
              <li><button type="button" data-format="txt" role="menuitem" on:click={() => handleDownloadLatestResult('txt')}>Download .txt</button></li>
              <li><button type="button" data-format="md" role="menuitem" on:click={() => handleDownloadLatestResult('md')}>Download .md</button></li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section class="panel panel-tts inti-workspace-card card bg-base-100/90 shadow-2xl shadow-base-content/10">
      <div class="section-heading inti-panel-heading">
        <span class="ornament inti-panel-ornament" aria-hidden="true"></span>
        <h2>Speech</h2>
        <span class="source-chip badge badge-outline">Audio stays available after edits</span>
      </div>

      <div class="field-block inti-surface">
        <div class="field-head">
          <span>Working Text</span>
          <span id="speech-input-count">{workspace.workingText.length} characters</span>
        </div>
        <div id="speech-input-preview" class="summary-markdown speech-preview"></div>
      </div>

      <div class="controls inti-control-band">
        <div class="select-wrap inti-select-wrap">
          <select class="select select-bordered" id="speech-provider-select" data-inti-dropdown title="Select speech provider">
            <option value="gemini">Gemini</option>
            <option value="kokoro-heart">kokoro heart</option>
          </select>
        </div>
        <div class="select-wrap inti-select-wrap">
          <select class="select select-bordered" id="model-select" data-inti-dropdown title="Select TTS model"></select>
        </div>
        <div class="select-wrap inti-select-wrap">
          <select class="select select-bordered" id="voice-select" data-inti-dropdown title="Select voice"></select>
        </div>
        <div class="select-wrap inti-select-wrap">
          <select class="select select-bordered" id="gender-filter" data-inti-dropdown title="Filter by gender">
            <option value="All">All voices</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
          </select>
        </div>

        <div class="action-checkboxes inti-checkboxes">
          <label class="action-check label cursor-pointer gap-2 rounded-full border border-base-300 bg-base-100/80 px-3 py-2"><input type="checkbox" id="action-speak" class="checkbox checkbox-sm" /> Auto-play</label>
          <label class="action-check label cursor-pointer gap-2 rounded-full border border-base-300 bg-base-100/80 px-3 py-2"><input type="checkbox" id="action-download" class="checkbox checkbox-sm" /> Download</label>
        </div>
        <button id="generate-working-audio-btn" class="btn-primary btn btn-primary generate-btn">
          <span class="icon icon-speaker" aria-hidden="true"></span>
          Generate from Working Text
        </button>
        <div class="playing-bar" id="playing-bar">
          <div class="bar"></div>
          <div class="bar"></div>
          <div class="bar"></div>
          <div class="bar"></div>
          <div class="bar"></div>
        </div>

        <span class="status-text" id="status-text"></span>
      </div>

      <div class="field-block inti-surface">
        <div class="field-head">
          <span>Latest audio result</span>
          <span id="audio-result-meta">No audio yet</span>
        </div>
        <div id="audio-result-card" class="summary-markdown speech-preview"></div>
        <div class="summary-actions inti-action-row">
          <button id="play-audio-btn" class="btn-secondary btn btn-ghost border border-base-300">
            <span class="icon icon-speaker-waves" aria-hidden="true"></span>
            Play
          </button>
          <button id="download-audio-btn" class="btn-secondary btn btn-ghost border border-base-300">
            <span class="icon icon-download" aria-hidden="true"></span>
            Download
          </button>
        </div>
      </div>
    </section>

    <section class="panel panel-activity inti-workspace-card card bg-base-100/90 shadow-2xl shadow-base-content/10">
      <div class="section-heading inti-panel-heading">
        <span class="ornament inti-panel-ornament" aria-hidden="true"></span>
        <h2>Activity</h2>
      </div>
      <div class="feed inti-surface" id="feed">
        <p class="feed-empty" id="feed-empty">No activity yet.</p>
      </div>
      <button class="btn-secondary btn btn-ghost border border-base-300 view-all-btn" type="button">View all</button>
    </section>
  </div>
</PageShell>

<div id="img-preview-modal" hidden>
  <div id="img-preview-backdrop"></div>
  <div id="img-preview-box">
    <img id="img-preview-img" src="" alt="Preview" />
    <button id="img-preview-close" title="Close">×</button>
  </div>
</div>
