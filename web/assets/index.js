const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/feed.js","assets/dom.js","assets/metrics.js","assets/ocr.js","assets/workspace.js","assets/legacy.js","assets/providers.js","assets/summarizer.js","assets/download.js","assets/tts.js","assets/voices.js"])))=>i.map(i=>d[i]);
import{t as w,a as y,b as f,g as m,r as k,c as _,N as x,d as E,o as P,i as S,e as A,f as T,h as L,p as R,j as C,m as I}from"./legacy.js";function z(d,u,r=!1,c=!1,s=!1,v=!1){var i=d,e="";if(r)var l=d;w(()=>{var t=y;if(e!==(e=u()??"")){if(r){t.nodes=null,l.innerHTML=e,e!==""&&f(m(l),l.lastChild);return}if(t.nodes!==null&&(k(t.nodes.start,t.nodes.end),t.nodes=null),e!==""){var o=c?x:s?E:void 0,n=_(c?"svg":s?"math":"template",o);n.innerHTML=e;var a=c||s?n:n.content;if(f(m(a),a.lastChild),c||s)for(;m(a);)i.before(m(a));else i.before(a)}}})}const O="modulepreload",D=function(d){return"/"+d},g={},p=function(u,r,c){let s=Promise.resolve();if(r&&r.length>0){let i=function(t){return Promise.all(t.map(o=>Promise.resolve(o).then(n=>({status:"fulfilled",value:n}),n=>({status:"rejected",reason:n}))))};document.getElementsByTagName("link");const e=document.querySelector("meta[property=csp-nonce]"),l=(e==null?void 0:e.nonce)||(e==null?void 0:e.getAttribute("nonce"));s=i(r.map(t=>{if(t=D(t),t in g)return;g[t]=!0;const o=t.endsWith(".css"),n=o?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${t}"]${n}`))return;const a=document.createElement("link");if(a.rel=o?"stylesheet":O,o||(a.as="script"),a.crossOrigin="",a.href=t,l&&a.setAttribute("nonce",l),document.head.appendChild(a),o)return new Promise((h,b)=>{a.addEventListener("load",h),a.addEventListener("error",()=>b(new Error(`Unable to preload CSS for ${t}`)))})}))}function v(i){const e=new Event("vite:preloadError",{cancelable:!0});if(e.payload=i,window.dispatchEvent(e),!e.defaultPrevented)throw i}return s.then(i=>{for(const e of i||[])e.status==="rejected"&&v(e.reason);return u().catch(v)})};function M(){return`
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
  `}function W(){return`
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
  `}function $(){return`
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
  `}function G(){return`
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
      ${M()}
      <main class="main-grid inti-shell-main">
        ${V()}
        ${W()}
        ${$()}
        ${G()}
      </main>
    </div>
    ${j()}
  `}function N(d,u){C(u,!1);const r=F();async function c(){const[{initFeed:i},{updateTextMetrics:e},{initOCR:l},{initProviders:t},{initSummarizer:o},{initTTS:n,synthesizeText:a},{initVoices:h}]=await Promise.all([p(()=>import("./feed.js").then(b=>b.c),__vite__mapDeps([0,1])),p(()=>import("./metrics.js"),__vite__mapDeps([2,1])),p(()=>import("./ocr.js"),__vite__mapDeps([3,1,0,4,5])),p(()=>import("./providers.js"),__vite__mapDeps([6,1,0,4,5])),p(()=>import("./summarizer.js"),__vite__mapDeps([7,1,0,2,4,5,8])),p(()=>import("./tts.js"),__vite__mapDeps([9,1,0,2,4,5,8])),p(()=>import("./voices.js"),__vite__mapDeps([10,1]))]);i(),t(),h(),l(),o({synthesizeText:a}),n(),e()}P(()=>{if(!window.__intiLegacyWorkspaceInitialized)return window.__intiLegacyWorkspaceInitialized=!0,c()}),S();var s=A(),v=T(s);z(v,()=>r),L(d,s),R()}I(N,{target:document.getElementById("app")});
