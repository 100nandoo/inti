const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/feed.js","assets/dom.js","assets/metrics.js","assets/ocr.js","assets/workspace.js","assets/legacy.js","assets/providers.js","assets/summarizer.js","assets/download.js","assets/tts.js","assets/voices.js"])))=>i.map(i=>d[i]);
import{t as w,a as y,b as g,g as m,r as k,c as x,N as _,d as S,o as E,i as P,e as T,f as A,h as R,p as C,j as I,m as L}from"./legacy.js";function z(d,u,o=!1,c=!1,s=!1,b=!1){var n=d,e="";if(o)var l=d;w(()=>{var t=y;if(e!==(e=u()??"")){if(o){t.nodes=null,l.innerHTML=e,e!==""&&g(m(l),l.lastChild);return}if(t.nodes!==null&&(k(t.nodes.start,t.nodes.end),t.nodes=null),e!==""){var r=c?_:s?S:void 0,i=x(c?"svg":s?"math":"template",r);i.innerHTML=e;var a=c||s?i:i.content;if(g(m(a),a.lastChild),c||s)for(;m(a);)n.before(m(a));else n.before(a)}}})}const O="modulepreload",D=function(d){return"/"+d},f={},p=function(u,o,c){let s=Promise.resolve();if(o&&o.length>0){let n=function(t){return Promise.all(t.map(r=>Promise.resolve(r).then(i=>({status:"fulfilled",value:i}),i=>({status:"rejected",reason:i}))))};document.getElementsByTagName("link");const e=document.querySelector("meta[property=csp-nonce]"),l=(e==null?void 0:e.nonce)||(e==null?void 0:e.getAttribute("nonce"));s=n(o.map(t=>{if(t=D(t),t in f)return;f[t]=!0;const r=t.endsWith(".css"),i=r?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${t}"]${i}`))return;const a=document.createElement("link");if(a.rel=r?"stylesheet":O,r||(a.as="script"),a.crossOrigin="",a.href=t,l&&a.setAttribute("nonce",l),document.head.appendChild(a),r)return new Promise((v,h)=>{a.addEventListener("load",v),a.addEventListener("error",()=>h(new Error(`Unable to preload CSS for ${t}`)))})}))}function b(n){const e=new Event("vite:preloadError",{cancelable:!0});if(e.payload=n,window.dispatchEvent(e),!e.defaultPrevented)throw n}return s.then(n=>{for(const e of n||[])e.status==="rejected"&&b(e.reason);return u().catch(b)})};function W(){return`
    <header class="header navbar inti-shell-header">
      <div class="logo">
        <div class="logo-icon" aria-hidden="true">
          <img class="logo-icon-dark" src="/icons/inti-logo.svg" alt="" />
          <img class="logo-icon-light" src="/icons/inti-light.svg" alt="" />
        </div>
        <span class="logo-name">Inti</span>
      </div>
      <div class="header-nav">
        <a href="/api-keys.html" class="header-settings-link inti-nav-link" title="Manage API keys">
          <span class="icon icon-key" aria-hidden="true"></span>
          API Keys
        </a>
        <a href="/settings.html" class="header-settings-link inti-nav-link" title="Summarizer settings">
          <span class="icon icon-settings" aria-hidden="true"></span>
          Settings
        </a>
        <button id="theme-toggle" class="theme-toggle inti-theme-toggle" type="button" title="Switch theme" aria-label="Switch theme">
          <span class="theme-icon theme-icon-light icon icon-sun" aria-hidden="true"></span>
          <span class="theme-icon theme-icon-dark icon icon-moon" aria-hidden="true"></span>
          <span id="theme-toggle-label">Theme</span>
        </button>
      </div>
    </header>
  `}function V(){return`
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
          type="button"
          role="tab"
          aria-selected="false"
          aria-controls="ocr-input-panel"
        >
          OCR
        </button>
        <button
          id="input-mode-working-text-btn"
          class="input-mode-btn"
          type="button"
          role="tab"
          aria-selected="true"
          aria-controls="working-text-panel"
        >
          Working Text
        </button>
      </div>

      <div id="ocr-input-panel" class="input-mode-panel">
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

      <div id="working-text-panel" class="field-block inti-surface ocr-output-block input-mode-panel">
        <div class="field-head">
          <span>Working Text</span>
          <span id="working-text-count">0 characters</span>
        </div>
        <textarea id="working-text" rows="9" placeholder="Paste or build text here. OCR and summarization operate on this text by default."></textarea>
      </div>

      <div id="working-text-run-panel" class="inti-control-band working-text-run-panel">
        <div class="run-mode-toggle" role="tablist" aria-label="Working Text run mode">
          <button
            id="run-mode-summary-btn"
            class="run-mode-btn"
            type="button"
            role="tab"
            aria-selected="true"
            aria-controls="summary-run-panel"
          >
            Summary
          </button>
          <button
            id="run-mode-voice-btn"
            class="run-mode-btn"
            type="button"
            role="tab"
            aria-selected="false"
            aria-controls="summary-run-panel"
          >
            Voice
          </button>
        </div>

        <div id="summary-run-panel" class="run-mode-panel">
          <div class="run-config-row">
            <div class="select-wrap provider-wrap inti-select-wrap">
              <select class="select select-bordered" id="provider-select" title="Summarizer provider">
                <option value="">Server default</option>
              </select>
            </div>
            <div class="select-wrap provider-wrap inti-select-wrap" id="sum-model-wrap" hidden>
              <select class="select select-bordered" id="sum-model-select" title="Summarizer model"></select>
            </div>
          </div>

          <div class="run-action-row">
            <button id="clear-workspace-btn" class="btn-secondary btn btn-ghost border border-base-300" title="Clear working text">
              <span class="icon icon-x" aria-hidden="true"></span>
              Clear
            </button>
            <button id="summarize-btn" class="btn-primary btn btn-primary" title="Summarize source text">
              <span class="icon icon-bolt" aria-hidden="true"></span>
              <span>Summarize</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  `}function M(){return`
    <section class="panel panel-result inti-workspace-card card bg-base-100/90 shadow-2xl shadow-base-content/10">
      <div class="section-heading inti-panel-heading">
        <span class="ornament inti-panel-ornament" aria-hidden="true"></span>
        <h2>Latest Text Result</h2>
        <span class="source-chip badge badge-outline" id="text-result-kind-chip">No result yet</span>
      </div>

      <div id="text-result" class="field-block inti-surface">
        <div class="field-head">
          <span id="text-result-title">Transform result</span>
          <span id="text-result-count">0 characters</span>
        </div>
        <div id="text-result-content" class="summary-markdown"></div>
        <div class="summary-actions result-actions inti-action-row">
          <button id="result-promote-default-btn" class="btn-primary btn btn-primary">
            <span class="icon icon-arrow-up" aria-hidden="true"></span>
            <span id="result-promote-default-label">Replace Working Text</span>
          </button>
          <button id="result-copy-btn" class="btn-secondary btn btn-ghost border border-base-300">
            <span class="icon icon-copy" aria-hidden="true"></span>
            <span id="result-copy-label">Copy</span>
          </button>
          <div class="split-button inti-split-button" id="result-download-group">
            <button id="result-download-btn" class="btn-secondary btn btn-ghost border border-base-300 split-button-main">
              <span class="icon icon-download" aria-hidden="true"></span>
              Download
            </button>
            <button
              id="result-download-toggle"
              class="btn-secondary btn btn-ghost border border-base-300 split-button-toggle"
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
          <button id="result-speak-btn" class="btn-secondary btn btn-ghost border border-base-300">
            <span class="icon icon-speaker-waves" aria-hidden="true"></span>
            Generate Speech from Result
          </button>
        </div>
      </div>
    </section>
  `}function $(){return`
    <section class="panel panel-tts inti-workspace-card card bg-base-100/90 shadow-2xl shadow-base-content/10">
      <div class="section-heading inti-panel-heading">
        <span class="ornament inti-panel-ornament" aria-hidden="true"></span>
        <h2>Speech</h2>
        <span class="source-chip badge badge-outline">Audio stays available after edits</span>
      </div>

      <div class="field-block inti-surface">
        <div class="field-head">
          <span>Speech input</span>
          <span id="speech-input-count">0 characters</span>
        </div>
        <div id="speech-input-preview" class="summary-markdown speech-preview"></div>
      </div>

      <div class="controls inti-control-band">
        <div class="select-wrap inti-select-wrap">
          <select class="select select-bordered" id="speech-provider-select" title="Select speech provider">
            <option value="gemini">Gemini</option>
            <option value="kokoro-heart">kokoro heart</option>
          </select>
        </div>
        <div class="select-wrap inti-select-wrap">
          <select class="select select-bordered" id="model-select" title="Select TTS model"></select>
        </div>
        <div class="select-wrap inti-select-wrap">
          <select class="select select-bordered" id="voice-select" title="Select voice"></select>
        </div>
        <div class="select-wrap inti-select-wrap">
          <select class="select select-bordered" id="gender-filter" title="Filter by gender">
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
        <button id="generate-result-audio-btn" class="btn-secondary btn btn-ghost border border-base-300">
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
  `}function G(){return`
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
  `}function j(){return`
    <div id="img-preview-modal" hidden>
      <div id="img-preview-backdrop"></div>
      <div id="img-preview-box">
        <img id="img-preview-img" src="" alt="Preview" />
        <button id="img-preview-close" title="Close">×</button>
      </div>
    </div>
  `}function F(){return`
    <div class="app inti-shell">
      ${W()}
      <main class="main-grid inti-shell-main">
        ${V()}
        ${M()}
        ${$()}
        ${G()}
      </main>
    </div>
    ${j()}
  `}function N(d,u){I(u,!1);const o=F();async function c(){const[{initFeed:n},{updateTextMetrics:e},{initOCR:l},{initProviders:t},{initSummarizer:r},{initTTS:i,synthesizeText:a},{initVoices:v}]=await Promise.all([p(()=>import("./feed.js").then(h=>h.c),__vite__mapDeps([0,1])),p(()=>import("./metrics.js"),__vite__mapDeps([2,1])),p(()=>import("./ocr.js"),__vite__mapDeps([3,1,0,4,5])),p(()=>import("./providers.js"),__vite__mapDeps([6,1,0,4,5])),p(()=>import("./summarizer.js"),__vite__mapDeps([7,1,0,2,4,5,8])),p(()=>import("./tts.js"),__vite__mapDeps([9,1,0,2,4,5,8])),p(()=>import("./voices.js"),__vite__mapDeps([10,1,0,4,5]))]);n(),t(),await v(),l(),r({synthesizeText:a}),i(),e()}E(()=>{if(!window.__intiLegacyWorkspaceInitialized)return window.__intiLegacyWorkspaceInitialized=!0,c()}),P();var s=T(),b=A(s);z(b,()=>o),R(d,s),C()}L(N,{target:document.getElementById("app")});
