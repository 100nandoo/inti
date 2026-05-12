<script>
  import { onMount } from 'svelte';

  onMount(async () => {
    if (window.__intiLegacyWorkspaceInitialized) return;
    window.__intiLegacyWorkspaceInitialized = true;

    const [
      { initFeed },
      { updateTextMetrics },
      { initOCR },
      { initProviders },
      { initSummarizer },
      { initTTS, synthesizeText },
      { initVoices },
    ] = await Promise.all([
      import('../../web/js/feed.js'),
      import('../../web/js/metrics.js'),
      import('../../web/js/ocr.js'),
      import('../../web/js/providers.js'),
      import('../../web/js/summarizer.js'),
      import('../../web/js/tts.js'),
      import('../../web/js/voices.js'),
    ]);

    initFeed();
    initProviders();
    initVoices();
    initOCR();
    initSummarizer({ synthesizeText });
    initTTS();
    updateTextMetrics();
  });
</script>

<div class="app">
  <header class="header">
    <div class="logo">
      <div class="logo-icon" aria-hidden="true">
        <img class="logo-icon-dark" src="/icons/inti-logo.svg" alt="" />
        <img class="logo-icon-light" src="/icons/inti-light.svg" alt="" />
      </div>
      <span class="logo-name">Inti</span>
    </div>
    <div class="header-nav">
      <a href="/api-keys.html" class="header-settings-link" title="Manage API keys">
        <span class="icon icon-key" aria-hidden="true"></span>
        API Keys
      </a>
      <a href="/settings.html" class="header-settings-link" title="Summarizer settings">
        <span class="icon icon-settings" aria-hidden="true"></span>
        Settings
      </a>
      <button id="theme-toggle" class="theme-toggle" type="button" title="Switch theme" aria-label="Switch theme">
        <span class="theme-icon theme-icon-light icon icon-sun" aria-hidden="true"></span>
        <span class="theme-icon theme-icon-dark icon icon-moon" aria-hidden="true"></span>
        <span class="theme-icon theme-icon-minimal icon icon-minimal" aria-hidden="true"></span>
        <span class="theme-icon theme-icon-minimal-dark icon icon-minimal-dark" aria-hidden="true"></span>
        <span id="theme-toggle-label">Theme</span>
      </button>
    </div>
  </header>

  <main class="main-grid">
    <section class="panel panel-workspace" id="ocr-card">
      <div class="section-heading">
        <span class="ornament" aria-hidden="true"></span>
        <h2>Text Workspace</h2>
        <span class="source-chip">One working text</span>
      </div>
      <div class="drop-zone" id="drop-zone" role="button" tabindex="0" aria-label="Import images for OCR">
        <span class="icon icon-upload-cloud drop-zone-icon" aria-hidden="true"></span>
        <p>Import images for OCR<br />or click to <label for="file-input" class="file-label">browse</label></p>
        <span class="drop-hint" id="drop-hint">PNG, JPG, JPEG, WEBP, TIFF up to 25MB</span>
        <input type="file" id="file-input" accept=".png,.jpg,.jpeg,.webp,.tif,.tiff,image/png,image/jpeg,image/webp,image/tiff" multiple hidden />
      </div>

      <div id="file-staging" hidden>
        <div class="field-head">
          <span>Staged files</span>
          <span id="staged-count">0 files</span>
        </div>
        <ul id="file-list"></ul>
        <div class="staging-actions">
          <button id="clear-files-btn" class="btn-secondary icon-only" title="Clear staged files">
            <span class="icon icon-trash" aria-hidden="true"></span>
          </button>
          <button id="run-ocr-btn" class="btn-primary">
            <span aria-hidden="true">--</span>
            Extract Text
            <span class="icon icon-bolt" aria-hidden="true"></span>
          </button>
        </div>
      </div>

      <div class="field-block ocr-output-block">
        <div class="field-head">
          <span>Working text</span>
          <span id="working-text-count">0 characters</span>
        </div>
        <textarea id="working-text" rows="9" placeholder="Paste or build text here. OCR and summarization operate on this text by default."></textarea>
      </div>

      <div id="workspace-actions" class="workspace-actions">
        <button id="clear-workspace-btn" class="btn-secondary" title="Clear working text">
          <span class="icon icon-x" aria-hidden="true"></span>
          Clear
        </button>
        <div class="select-wrap provider-wrap">
          <select id="provider-select" title="Summarizer provider">
            <option value="">Server default</option>
          </select>
        </div>
        <div class="select-wrap provider-wrap" id="sum-model-wrap" hidden>
          <select id="sum-model-select" title="Summarizer model"></select>
        </div>
        <button id="summarize-btn" class="btn-primary" title="Summarize source text">
          <span class="icon icon-bolt" aria-hidden="true"></span>
          <span>Summarize</span>
        </button>
      </div>
    </section>

    <section class="panel panel-result">
      <div class="section-heading">
        <span class="ornament" aria-hidden="true"></span>
        <h2>Latest Text Result</h2>
        <span class="source-chip" id="text-result-kind-chip">No result yet</span>
      </div>

      <div id="text-result" class="field-block">
        <div class="field-head">
          <span id="text-result-title">Transform result</span>
          <span id="text-result-count">0 characters</span>
        </div>
        <div id="text-result-content" class="summary-markdown"></div>
        <div class="summary-actions result-actions">
          <button id="result-promote-default-btn" class="btn-primary">
            <span class="icon icon-arrow-up" aria-hidden="true"></span>
            <span id="result-promote-default-label">Append to Working Text</span>
          </button>
          <button id="result-append-btn" class="btn-secondary">
            <span class="icon icon-arrow-up" aria-hidden="true"></span>
            <span>Append</span>
          </button>
          <button id="result-replace-btn" class="btn-secondary">
            <span class="icon icon-brackets-horizontal" aria-hidden="true"></span>
            <span>Replace</span>
          </button>
          <button id="result-copy-btn" class="btn-secondary">
            <span class="icon icon-copy" aria-hidden="true"></span>
            <span id="result-copy-label">Copy</span>
          </button>
          <div class="split-button" id="result-download-group">
            <button id="result-download-btn" class="btn-secondary split-button-main">
              <span class="icon icon-download" aria-hidden="true"></span>
              Download
            </button>
            <button
              id="result-download-toggle"
              class="btn-secondary split-button-toggle"
              aria-haspopup="menu"
              aria-expanded="false"
              aria-controls="result-download-menu"
              title="Choose download format"
            >
              <span class="icon icon-chevron-down" aria-hidden="true"></span>
            </button>
            <div id="result-download-menu" class="split-menu" role="menu" hidden>
              <button type="button" class="split-menu-item" data-format="txt" role="menuitem">Download .txt</button>
              <button type="button" class="split-menu-item" data-format="md" role="menuitem">Download .md</button>
            </div>
          </div>
          <button id="result-speak-btn" class="btn-secondary">
            <span class="icon icon-speaker-waves" aria-hidden="true"></span>
            Generate Speech from Result
          </button>
        </div>
      </div>
    </section>

    <section class="panel panel-tts">
      <div class="section-heading">
        <span class="ornament" aria-hidden="true"></span>
        <h2>Speech</h2>
        <span class="source-chip">Audio stays available after edits</span>
      </div>

      <div class="field-block">
        <div class="field-head">
          <span>Speech input</span>
          <span id="speech-input-count">0 characters</span>
        </div>
        <div id="speech-input-preview" class="summary-markdown speech-preview"></div>
      </div>

      <div class="controls">
        <div class="select-wrap">
          <select id="model-select" title="Select TTS model"></select>
        </div>
        <div class="select-wrap">
          <select id="voice-select" title="Select voice"></select>
        </div>
        <div class="select-wrap">
          <select id="gender-filter" title="Filter by gender">
            <option value="All">All voices</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
          </select>
        </div>

        <div class="action-checkboxes">
          <label class="action-check"><input type="checkbox" id="action-speak" /> Auto-play</label>
          <label class="action-check"><input type="checkbox" id="action-download" /> Download</label>
        </div>
        <button id="generate-working-audio-btn" class="btn-primary generate-btn">
          <span class="icon icon-speaker" aria-hidden="true"></span>
          Generate from Working Text
        </button>
        <button id="generate-result-audio-btn" class="btn-secondary">
          <span class="icon icon-speaker-waves" aria-hidden="true"></span>
          Generate from Result
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

      <div class="field-block">
        <div class="field-head">
          <span>Latest audio result</span>
          <span id="audio-result-meta">No audio yet</span>
        </div>
        <div id="audio-result-card" class="summary-markdown speech-preview"></div>
        <div class="summary-actions">
          <button id="play-audio-btn" class="btn-secondary">
            <span class="icon icon-speaker-waves" aria-hidden="true"></span>
            Play
          </button>
          <button id="download-audio-btn" class="btn-secondary">
            <span class="icon icon-download" aria-hidden="true"></span>
            Download
          </button>
        </div>
      </div>
    </section>

    <section class="panel panel-activity">
      <div class="section-heading">
        <span class="ornament" aria-hidden="true"></span>
        <h2>Activity</h2>
      </div>
      <div class="feed" id="feed">
        <p class="feed-empty" id="feed-empty">No activity yet.</p>
      </div>
      <button class="btn-secondary view-all-btn" type="button">View all</button>
    </section>
  </main>
</div>

<div id="img-preview-modal" hidden>
  <div id="img-preview-backdrop"></div>
  <div id="img-preview-box">
    <img id="img-preview-img" src="" alt="Preview" />
    <button id="img-preview-close" title="Close">×</button>
  </div>
</div>
