<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import PageShell from '../components/PageShell.svelte';
  import type { PageShellNavLink } from '../lib/page-shell-contracts';
  import {
    applyAppearanceConfig,
    applySpeechConfig,
    applySummarizerConfig,
    getActiveTextResult,
    getSelectedSpeechModel,
    getSelectedSpeechProvider,
    getSelectedSpeechVoice,
    getSelectedSummarizerModel,
    getSelectedSummarizerProvider,
    promoteLatestTextResult,
    setActiveOutputTab,
    setLastAudioResult,
    setGroqRateLimits,
    setDragSourceIndex,
    setInputMode,
    setLatestTextResult,
    setPointerOverOcrCard,
    setProcessing,
    setSelectedSpeechSelection,
    setSelectedSummarizerSelection,
    setStagedFiles,
    setWorkingText,
    setWorkingTextRunMode,
    workspaceStore,
  } from '../lib/workspace-state.js';
  import { buildSpeechPanelViewModel } from '../lib/speech-flow.js';
  import { copyLatestResultText, downloadLatestResult } from '../lib/result-surface.js';
  import {
    buildMainWorkspaceViewModel,
    buildPromotionStatusMessage,
    executeMainWorkspaceSummary,
  } from '../lib/main-workspace-flow.js';
  import {
    MAIN_WORKSPACE_SPEECH_PROVIDER_OPTIONS,
    currentDefaultSpeechVoice,
    loadMainWorkspaceSpeechConfig,
    loadMainWorkspaceSpeechControlState,
    saveMainWorkspaceSpeechConfig,
  } from '../lib/main-workspace-speech-controls.js';
  import {
    buildOCRRejectedFilesMessage,
    executeMainWorkspaceOCR,
    shouldHandleOCRGlobalPaste,
  } from '../lib/main-workspace-ocr.js';
  import {
    appendStagedFiles,
    filterAllowedImageFiles,
    formatStagedCount,
    getImageFilesFromClipboard,
    removeStagedFile,
    reorderStagedFiles,
  } from '../lib/ocr-file-staging.js';
  import {
    downloadMainWorkspaceAudioSnapshot,
    executeMainWorkspaceSpeech,
    playMainWorkspaceAudio,
  } from '../lib/main-workspace-speech-flow.js';
  import {
    buildMainWorkspaceProviderOptions,
    loadMainWorkspaceModelOptions,
    loadMainWorkspaceSummarizerConfig,
    saveMainWorkspaceSummarizerConfig,
  } from '../lib/main-workspace-summary-controls.js';
  import type { SummaryDownloadFormat, WorkspaceState } from '../lib/workspace-contracts';
  import { addFeed, setPlaying, setStatus, updateFeedItem } from '../../../web/js/feed.js';

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
  let speechProviderOptions: SummaryOption[] = MAIN_WORKSPACE_SPEECH_PROVIDER_OPTIONS;
  let speechModelOptions: SummaryOption[] = [];
  let speechVoiceOptions: SummaryOption[] = [];
  let speechGenderFilter = 'All';
  let speechControlsRequestKey = 0;
  let autoPlayAudio = false;
  let autoDownloadAudio = false;
  let ocrCardElement: HTMLElement | null = null;
  let fileInputElement: HTMLInputElement | null = null;
  let resultDropZoneActive = false;
  let dragOverIndex: number | null = null;
  let imagePreviewOpen = false;
  let imagePreviewSrc = '';
  const stagedPreviewUrls = new Map<File, string>();

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

  function syncStagedPreviewUrls(files: File[]): void {
    const activeFiles = new Set(files);
    stagedPreviewUrls.forEach((url, file) => {
      if (activeFiles.has(file)) return;
      URL.revokeObjectURL(url);
      stagedPreviewUrls.delete(file);
    });
  }

  function getStagedPreviewUrl(file: File): string {
    const existing = stagedPreviewUrls.get(file);
    if (existing) return existing;
    const next = URL.createObjectURL(file);
    stagedPreviewUrls.set(file, next);
    return next;
  }

  function announceRejectedFiles(rejectedCount: number): void {
    const message = buildOCRRejectedFilesMessage(rejectedCount);
    if (message) setStatus(message, 'error');
  }

  function addStagedFiles(files: File[]): void {
    setStagedFiles(appendStagedFiles(workspace.stagedFiles, files));
  }

  function closeImagePreview(): void {
    imagePreviewOpen = false;
    imagePreviewSrc = '';
  }

  function openImagePreview(file: File): void {
    imagePreviewSrc = getStagedPreviewUrl(file);
    imagePreviewOpen = true;
  }

  function handleImagePreviewKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      closeImagePreview();
    }
  }

  function handleDropZoneClick(event: MouseEvent): void {
    if (event.target instanceof HTMLLabelElement) return;
    fileInputElement?.click();
  }

  function handleDropZoneKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      fileInputElement?.click();
    }
  }

  function handleFileInputChange(event: Event): void {
    const input = event.currentTarget as HTMLInputElement;
    const { allowedFiles, rejectedCount } = filterAllowedImageFiles(Array.from(input.files || []));
    announceRejectedFiles(rejectedCount);
    if (allowedFiles.length > 0) addStagedFiles(allowedFiles);
    input.value = '';
  }

  function handleDropZoneDragEnter(event: DragEvent): void {
    event.preventDefault();
    resultDropZoneActive = true;
  }

  function handleDropZoneDragOver(event: DragEvent): void {
    event.preventDefault();
    resultDropZoneActive = true;
  }

  function handleDropZoneDragLeave(event: DragEvent): void {
    const relatedTarget = event.relatedTarget;
    if (relatedTarget instanceof Node && ocrCardElement?.contains(relatedTarget)) return;
    resultDropZoneActive = false;
  }

  function handleDropZoneDrop(event: DragEvent): void {
    event.preventDefault();
    resultDropZoneActive = false;
    const { allowedFiles, rejectedCount } = filterAllowedImageFiles(Array.from(event.dataTransfer?.files || []));
    announceRejectedFiles(rejectedCount);
    if (allowedFiles.length > 0) addStagedFiles(allowedFiles);
  }

  function handleStageDragStart(index: number, event: DragEvent): void {
    setDragSourceIndex(index);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  function handleStageDragEnd(): void {
    dragOverIndex = null;
    setDragSourceIndex(null);
  }

  function handleStageDragOver(index: number, event: DragEvent): void {
    event.preventDefault();
    dragOverIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  function handleStageDrop(index: number, event: DragEvent): void {
    event.preventDefault();
    dragOverIndex = null;
    setStagedFiles(reorderStagedFiles(workspace.stagedFiles, workspace.dragSrcIndex, index));
    setDragSourceIndex(null);
  }

  function handleGlobalPaste(event: ClipboardEvent): void {
    if (!shouldHandleOCRGlobalPaste({
      inputMode: workspace.inputMode,
      isPointerOverOcrCard: workspace.isPointerOverOcrCard,
      activeElement: document.activeElement,
      ocrCardElement,
    })) {
      return;
    }

    const { files, rejectedCount } = getImageFilesFromClipboard(event.clipboardData);
    announceRejectedFiles(rejectedCount);
    if (files.length === 0) return;

    event.preventDefault();
    addStagedFiles(files);
    setStatus(`Staged ${files.length} pasted image${files.length === 1 ? '' : 's'}.`, 'success');
  }

  function clearStagedFiles(): void {
    setStagedFiles([]);
    setStatus('Cleared staged OCR files.', 'success');
  }

  async function runOCR(): Promise<void> {
    const files = workspace.stagedFiles;
    if (files.length === 0 || workspace.processing) return;

    const apiURL = window.apiURL || ((path: string) => path);
    const label = files.length === 1 ? files[0].name : `${files.length} images`;
    const feedItem = addFeed('info', `OCR: ${label}`, 'extracting text…');
    setProcessing(true);

    try {
      const { ocrResult, feedMeta } = await executeMainWorkspaceOCR({
        apiURL,
        files,
        workingText: workspace.workingText,
      });
      setLatestTextResult(ocrResult);
      setStatus('OCR result ready for review.', 'success');
      setStagedFiles([]);
      updateFeedItem(feedItem, 'ok', `OCR: ${label}`, feedMeta);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setStatus(message, 'error');
      updateFeedItem(feedItem, 'fail', `OCR: ${label}`, message);
    } finally {
      setProcessing(false);
    }
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

  async function syncSpeechControls(
    preferredProvider?: string,
    preferredVoice?: string,
    preferredModel?: string,
    preferredGenderFilter?: string,
  ): Promise<void> {
    const requestKey = ++speechControlsRequestKey;
    const provider = preferredProvider !== undefined
      ? preferredProvider
      : (getSelectedSpeechProvider() || workspace.speechConfig.provider || 'gemini');
    const voice = preferredVoice !== undefined
      ? preferredVoice
      : (getSelectedSpeechVoice() || workspace.speechConfig.voice || currentDefaultSpeechVoice(provider));
    const model = preferredModel !== undefined
      ? preferredModel
      : (getSelectedSpeechModel() || workspace.speechConfig.model || '');
    const genderFilter = preferredGenderFilter !== undefined ? preferredGenderFilter : speechGenderFilter;

    try {
      const nextControls = await loadMainWorkspaceSpeechControlState({
        apiURL: window.apiURL || ((path: string) => path),
        provider,
        selectedVoice: voice,
        selectedModel: model,
        genderFilter,
      });
      if (requestKey !== speechControlsRequestKey) return;

      speechGenderFilter = nextControls.genderFilter;
      speechModelOptions = nextControls.modelOptions as SummaryOption[];
      speechVoiceOptions = nextControls.voiceOptions as SummaryOption[];
      setSelectedSpeechSelection(
        nextControls.provider,
        nextControls.selectedVoice,
        nextControls.selectedModel,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load speech settings.';
      setStatus(message, 'error');
    }
  }

  async function saveSpeechSelection(provider: string, voice: string, model: string): Promise<void> {
    const speechConfig = await saveMainWorkspaceSpeechConfig({
      apiURL: window.apiURL || ((path: string) => path),
      provider,
      voice,
      model,
    });
    applySpeechConfig(speechConfig);
  }

  async function initializeSpeechControls(): Promise<void> {
    try {
      const speechConfig = await loadMainWorkspaceSpeechConfig({
        apiURL: window.apiURL || ((path: string) => path),
      });
      applySpeechConfig(speechConfig);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load speech settings.';
      setStatus(message, 'error');
    }

    await syncSpeechControls();
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

  async function handleSpeechProviderChange(provider: string): Promise<void> {
    const nextVoice = currentDefaultSpeechVoice(provider);
    await syncSpeechControls(provider, nextVoice, '', 'All');

    try {
      await saveSpeechSelection(provider, getSelectedSpeechVoice(), getSelectedSpeechModel());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save speech settings.';
      setStatus(message, 'error');
    }
  }

  async function handleSpeechVoiceChange(voice: string): Promise<void> {
    setSelectedSpeechSelection(getSelectedSpeechProvider(), voice, getSelectedSpeechModel());

    try {
      await saveSpeechSelection(getSelectedSpeechProvider(), voice, getSelectedSpeechModel());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save speech settings.';
      setStatus(message, 'error');
    }
  }

  async function handleSpeechModelChange(model: string): Promise<void> {
    setSelectedSpeechSelection(getSelectedSpeechProvider(), getSelectedSpeechVoice(), model);

    try {
      await saveSpeechSelection(getSelectedSpeechProvider(), getSelectedSpeechVoice(), model);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save speech settings.';
      setStatus(message, 'error');
    }
  }

  function handleSpeechGenderFilterChange(value: string): void {
    void syncSpeechControls(
      getSelectedSpeechProvider(),
      getSelectedSpeechVoice(),
      getSelectedSpeechModel(),
      value,
    );
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

  async function playLatestAudio(): Promise<void> {
    if (!workspace.lastAudioBlob) return;

    setStatus('Playing…');
    setPlaying(true);

    try {
      await playMainWorkspaceAudio(workspace.lastAudioBlob);
      setStatus('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not play audio.';
      setStatus(message, 'error');
    } finally {
      setPlaying(false);
    }
  }

  function handleDownloadAudioSnapshot(): void {
    if (!downloadMainWorkspaceAudioSnapshot(workspace.lastAudioBlob, workspace.lastAudioSourceText || 'audio')) {
      return;
    }
    addFeed('ok', 'Downloaded', 'Opus file saved to your downloads folder');
  }

  async function synthesizeWorkingText(): Promise<void> {
    const text = workspace.workingText.trim();
    if (!text || workspace.processing) return;

    setProcessing(true);
    setStatus('Synthesizing…');
    const feedItem = addFeed('info', `"${text.slice(0, 60)}${text.length > 60 ? '…' : ''}"`, 'speech · synthesizing…');

    try {
      const result = await executeMainWorkspaceSpeech({
        apiURL: window.apiURL || ((path: string) => path),
        text,
        provider: getSelectedSpeechProvider(),
        voice: getSelectedSpeechVoice(),
        model: getSelectedSpeechModel(),
      });
      setLastAudioResult(result.blob, result.sourceText, 'Working Text', {
        provider: result.provider,
        voice: result.voice,
        model: result.model,
      });
      setActiveOutputTab('voice');
      setStatus('Audio result ready.', 'success');
      updateFeedItem(feedItem, 'ok', result.feedLabel, result.feedMeta);

      if (autoPlayAudio) {
        await playLatestAudio();
      }
      if (autoDownloadAudio) {
        handleDownloadAudioSnapshot();
      }
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
    setStatus(buildPromotionStatusMessage(getActiveTextResult().kind), 'success');
  }

  async function handleCopyLatestResult(): Promise<void> {
    const copied = await copyLatestResultText(getActiveTextResult());
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
    downloadLatestResult(getActiveTextResult(), format);
    closeResultDownloadMenu();
  }

  onMount(() => {
    applyThemeConfig(window.IntiTheme);
    document.addEventListener('inti:theme-config', handleThemeConfigEvent);
    document.addEventListener('click', handleDocumentClick);
    void initializeSummarizerControls();
    void initializeSpeechControls();
  });

  onDestroy(() => {
    unsubscribeWorkspace();
    document.removeEventListener('inti:theme-config', handleThemeConfigEvent);
    document.removeEventListener('click', handleDocumentClick);
    syncStagedPreviewUrls([]);
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
  $: speechViewModel = buildSpeechPanelViewModel(workspace);
  $: stagedCountLabel = formatStagedCount(workspace?.stagedFiles?.length || 0);
  $: activeOutputTab = resultViewModel.activeTab;
  $: syncStagedPreviewUrls(workspace?.stagedFiles || []);
</script>

<svelte:window on:paste={handleGlobalPaste} on:keydown={handleImagePreviewKeydown} />

<PageShell {navLinks}>
  <div class="main-grid">
    <section
      class="panel panel-workspace inti-workspace-card card bg-base-100/90 shadow-2xl shadow-base-content/10"
      id="ocr-card"
      aria-labelledby="workspace-heading"
      bind:this={ocrCardElement}
      on:mouseenter={() => setPointerOverOcrCard(true)}
      on:mouseleave={() => setPointerOverOcrCard(false)}
      on:focusin={() => setPointerOverOcrCard(true)}
      on:focusout={() => setPointerOverOcrCard(false)}
    >
      <div class="section-heading inti-panel-heading">
        <span class="ornament inti-panel-ornament" aria-hidden="true"></span>
        <h2 id="workspace-heading">Input</h2>
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
          <div
            class="drop-zone inti-surface"
            class:drag-active={resultDropZoneActive}
            class:ocr-loading={workspace.processing && isOcrMode}
            id="drop-zone"
            role="button"
            tabindex="0"
            aria-label="Import images for OCR"
            on:click={handleDropZoneClick}
            on:keydown={handleDropZoneKeydown}
            on:dragenter={handleDropZoneDragEnter}
            on:dragover={handleDropZoneDragOver}
            on:dragleave={handleDropZoneDragLeave}
            on:drop={handleDropZoneDrop}
          >
            <span class="icon icon-upload-cloud drop-zone-icon" aria-hidden="true"></span>
            <p>Import images for OCR<br />or click to <label for="file-input" class="file-label">browse</label></p>
            <span class="drop-hint" id="drop-hint">PNG, JPG, JPEG, WEBP, TIFF up to 25MB</span>
            <input
              type="file"
              id="file-input"
              accept=".png,.jpg,.jpeg,.webp,.tif,.tiff,image/png,image/jpeg,image/webp,image/tiff"
              multiple
              hidden
              bind:this={fileInputElement}
              on:change={handleFileInputChange}
            />
          </div>

          <div id="file-staging" class="inti-surface" hidden={workspace.stagedFiles.length === 0}>
            <div class="field-head">
              <span>Staged files</span>
              <span id="staged-count">{stagedCountLabel}</span>
            </div>
            <ul id="file-list">
              {#each workspace.stagedFiles as file, index (file)}
                <li
                  class="file-item"
                  class:drag-over={dragOverIndex === index}
                  class:dragging={workspace.dragSrcIndex === index}
                  draggable="true"
                  data-index={index}
                  on:dragstart={(event) => handleStageDragStart(index, event)}
                  on:dragend={handleStageDragEnd}
                  on:dragover={(event) => handleStageDragOver(index, event)}
                  on:drop={(event) => handleStageDrop(index, event)}
                >
                  <span class="drag-handle" title="Drag to reorder">::</span>
                  <button class="file-thumb-button" type="button" title={`Preview ${file.name}`} on:click={() => openImagePreview(file)}>
                    <img class="file-thumb" src={getStagedPreviewUrl(file)} alt="" />
                  </button>
                  <span class="file-info">
                    <span class="file-name" title={file.name}>{file.name}</span>
                    <span class="file-meta">{Math.ceil(file.size / 1024)} KB</span>
                  </span>
                  <span class="file-ok" title="Ready">
                    <span class="icon icon-check" aria-hidden="true"></span>
                  </span>
                  <button class="file-remove" type="button" data-index={index} title="Remove" on:click={() => setStagedFiles(removeStagedFile(workspace.stagedFiles, index))}>
                    <span class="icon icon-trash" aria-hidden="true"></span>
                  </button>
                </li>
              {/each}
            </ul>
            <div class="staging-actions inti-action-row">
              <button
                id="clear-files-btn"
                class="btn-secondary btn btn-ghost border border-base-300 icon-only"
                title="Clear staged files"
                disabled={workspace.processing || workspace.stagedFiles.length === 0}
                on:click={clearStagedFiles}
              >
                <span class="icon icon-trash" aria-hidden="true"></span>
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
        <div class="run-action-row">
          <button
            id="clear-workspace-btn"
            class="btn-secondary btn btn-ghost border border-base-300"
            title="Clear working text"
            disabled={workspace.processing || !hasWorkingText}
            on:click={() => {
              setWorkingText('');
              setStatus('Working text cleared.', 'success');
            }}
          >
            <span class="icon icon-x" aria-hidden="true"></span>
            Clear
          </button>
        </div>
      </div>
    </section>

    <section class="panel panel-result inti-workspace-card card bg-base-100/90 shadow-2xl shadow-base-content/10" id="working-text-run-panel">
      <div class="section-heading inti-panel-heading">
        <span class="ornament inti-panel-ornament" aria-hidden="true"></span>
        <h2>Action</h2>
        <span class="source-chip badge badge-outline">{isOcrMode ? 'OCR ready' : isVoiceMode ? 'Voice ready' : 'Summary ready'}</span>
      </div>

      <div class="run-mode-toggle" role="tablist" aria-label="Action tabs">
        <button
          id="run-ocr-btn"
          class="run-mode-btn"
          class:is-active={mainWorkspaceViewModel.actionTabs.ocr.active}
          type="button"
          role="tab"
          aria-selected={mainWorkspaceViewModel.actionTabs.ocr.active}
          aria-controls="ocr-run-panel"
          disabled={mainWorkspaceViewModel.actionTabs.ocr.disabled}
        >
          OCR
        </button>
        <button
          id="run-mode-summary-btn"
          class="run-mode-btn"
          class:is-active={mainWorkspaceViewModel.actionTabs.summary.active}
          type="button"
          role="tab"
          aria-selected={mainWorkspaceViewModel.actionTabs.summary.active}
          aria-controls="summary-run-panel"
          disabled={mainWorkspaceViewModel.actionTabs.summary.disabled}
          on:click={() => setWorkingTextRunMode('summary')}
        >
          Summary
        </button>
        <button
          id="run-mode-voice-btn"
          class="run-mode-btn"
          class:is-active={mainWorkspaceViewModel.actionTabs.voice.active}
          type="button"
          role="tab"
          aria-selected={mainWorkspaceViewModel.actionTabs.voice.active}
          aria-controls="voice-run-panel"
          disabled={mainWorkspaceViewModel.actionTabs.voice.disabled}
          on:click={() => setWorkingTextRunMode('voice')}
        >
          Voice
        </button>
      </div>

      <div id="ocr-run-panel" class="field-block inti-surface" hidden={!isOcrMode}>
        <div class="field-head">
          <span>OCR</span>
          <span>{stagedCountLabel}</span>
        </div>
        <p>Extract text from the staged files and send the result to Output.</p>
        <div class="run-action-row">
          <button
            class="btn-primary btn btn-primary"
            disabled={workspace.processing || workspace.stagedFiles.length === 0}
            on:click={() => {
              void runOCR();
            }}
          >
            <span aria-hidden="true">--</span>
            Extract Text
            <span class="icon icon-bolt" aria-hidden="true"></span>
          </button>
        </div>
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

      <div id="voice-run-panel" class="run-mode-panel" hidden={!isVoiceMode}>
        <div class="field-block inti-surface">
          <div class="field-head">
            <span>Working Text</span>
            <span id="speech-input-count">{mainWorkspaceViewModel.speechInputCharacterCount} characters</span>
          </div>
          <div id="speech-input-preview" class="summary-markdown speech-preview">{@html speechViewModel.speechPreviewHtml}</div>
        </div>

        <div class="controls inti-control-band">
          <div class="select-wrap inti-select-wrap">
            <select
              class="select select-bordered"
              id="speech-provider-select"
              data-inti-dropdown
              title="Select speech provider"
              value={workspace.selectedSpeechProvider}
              disabled={speechViewModel.controlsDisabled}
              on:change={(event) => {
                void handleSpeechProviderChange((event.currentTarget as HTMLSelectElement).value);
              }}
            >
              {#each speechProviderOptions as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
          </div>
          <div class="select-wrap inti-select-wrap">
            <select
              class="select select-bordered"
              id="model-select"
              data-inti-dropdown
              title="Select TTS model"
              value={workspace.selectedSpeechModel}
              disabled={speechViewModel.controlsDisabled || workspace.selectedSpeechProvider === 'kokoro-heart' || speechModelOptions.length === 0}
              on:change={(event) => {
                void handleSpeechModelChange((event.currentTarget as HTMLSelectElement).value);
              }}
            >
              {#if speechModelOptions.length === 0}
                <option value="">No model selection</option>
              {:else}
                {#each speechModelOptions as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              {/if}
            </select>
          </div>
          <div class="select-wrap inti-select-wrap">
            <select
              class="select select-bordered"
              id="voice-select"
              data-inti-dropdown
              title="Select voice"
              value={workspace.selectedSpeechVoice}
              disabled={speechViewModel.controlsDisabled}
              on:change={(event) => {
                void handleSpeechVoiceChange((event.currentTarget as HTMLSelectElement).value);
              }}
            >
              {#each speechVoiceOptions as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
          </div>
          <div class="select-wrap inti-select-wrap">
            <select
              class="select select-bordered"
              id="gender-filter"
              data-inti-dropdown
              title="Filter by gender"
              value={speechGenderFilter}
              disabled={speechViewModel.controlsDisabled || workspace.selectedSpeechProvider !== 'gemini'}
              on:change={(event) => {
                handleSpeechGenderFilterChange((event.currentTarget as HTMLSelectElement).value);
              }}
            >
              <option value="All">All voices</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
            </select>
          </div>

          <div class="action-checkboxes inti-checkboxes">
            <label class="action-check label cursor-pointer gap-2 rounded-full border border-base-300 bg-base-100/80 px-3 py-2"><input type="checkbox" id="action-speak" class="checkbox checkbox-sm" bind:checked={autoPlayAudio} disabled={speechViewModel.controlsDisabled} /> Auto-play</label>
            <label class="action-check label cursor-pointer gap-2 rounded-full border border-base-300 bg-base-100/80 px-3 py-2"><input type="checkbox" id="action-download" class="checkbox checkbox-sm" bind:checked={autoDownloadAudio} disabled={speechViewModel.controlsDisabled} /> Download</label>
          </div>
          <button
            id="generate-working-audio-btn"
            class="btn-primary btn btn-primary generate-btn"
            disabled={workspace.processing || !speechViewModel.hasWorkingText}
            on:click={() => {
              void synthesizeWorkingText();
            }}
          >
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
      </div>
    </section>

    <section class="panel panel-tts inti-workspace-card card bg-base-100/90 shadow-2xl shadow-base-content/10">
      <div class="section-heading inti-panel-heading">
        <span class="ornament inti-panel-ornament" aria-hidden="true"></span>
        <h2>Output</h2>
        <span class="source-chip badge badge-outline" id="text-result-kind-chip">{resultViewModel.kindChip}</span>
      </div>

      <div class="run-mode-toggle" role="tablist" aria-label="Output tabs">
        <button
          id="output-tab-ocr-btn"
          class="run-mode-btn"
          class:is-active={activeOutputTab === 'ocr'}
          type="button"
          role="tab"
          aria-selected={activeOutputTab === 'ocr'}
          aria-controls="text-result"
          on:click={() => setActiveOutputTab('ocr')}
        >
          OCR
        </button>
        <button
          id="output-tab-summary-btn"
          class="run-mode-btn"
          class:is-active={activeOutputTab === 'summary'}
          type="button"
          role="tab"
          aria-selected={activeOutputTab === 'summary'}
          aria-controls="text-result"
          on:click={() => setActiveOutputTab('summary')}
        >
          Summary
        </button>
        <button
          id="output-tab-voice-btn"
          class="run-mode-btn"
          class:is-active={activeOutputTab === 'voice'}
          type="button"
          role="tab"
          aria-selected={activeOutputTab === 'voice'}
          aria-controls="audio-result-card"
          on:click={() => setActiveOutputTab('voice')}
        >
          Voice
        </button>
      </div>

      {#if resultViewModel.isVoiceTab}
        <div class="field-block inti-surface">
          <div class="field-head">
            <span>Latest audio result</span>
            <span id="audio-result-meta">{speechViewModel.audioMeta}</span>
          </div>
          <div id="audio-result-card" class="summary-markdown speech-preview">{@html speechViewModel.audioCardHtml}</div>
          <div class="summary-actions inti-action-row">
            <button
              id="play-audio-btn"
              class="btn-secondary btn btn-ghost border border-base-300"
              disabled={workspace.processing || !speechViewModel.hasAudio}
              on:click={() => {
                void playLatestAudio();
              }}
            >
              <span class="icon icon-speaker-waves" aria-hidden="true"></span>
              Play
            </button>
            <button
              id="download-audio-btn"
              class="btn-secondary btn btn-ghost border border-base-300"
              disabled={workspace.processing || !speechViewModel.hasAudio}
              on:click={handleDownloadAudioSnapshot}
            >
              <span class="icon icon-download" aria-hidden="true"></span>
              Download
            </button>
          </div>
        </div>
      {:else}
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
              disabled={workspace.processing || !resultViewModel.hasTextResult}
              on:click={handlePromoteLatestTextResult}
            >
              <span class="icon icon-arrow-up" aria-hidden="true"></span>
              <span id="result-promote-default-label">{resultViewModel.defaultPromotionLabel}</span>
            </button>
            <button
              id="result-copy-btn"
              class="btn-secondary btn btn-ghost border border-base-300"
              disabled={workspace.processing || !resultViewModel.hasTextResult}
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
                disabled={workspace.processing || !resultViewModel.hasTextResult}
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
                disabled={workspace.processing || !resultViewModel.hasTextResult}
                on:click|stopPropagation={() => {
                  if (workspace.processing || !resultViewModel.hasTextResult) return;
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
      {/if}
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

<div id="img-preview-modal" hidden={!imagePreviewOpen}>
  <button id="img-preview-backdrop" type="button" aria-label="Close preview" on:click={closeImagePreview}></button>
  <div id="img-preview-box">
    <img id="img-preview-img" src={imagePreviewSrc} alt="Preview" />
    <button id="img-preview-close" title="Close" on:click={closeImagePreview}>×</button>
  </div>
</div>
