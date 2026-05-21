const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/feed.js","assets/dom.js","assets/metrics.js","assets/ocr.js","assets/workspace.js","assets/protected-page.js","assets/protected-page.css","assets/providers.js","assets/summarizer.js","assets/download.js","assets/tts.js","assets/voices.js"])))=>i.map(i=>d[i]);
import{t as y,a as k,b as g,g as m,r as x,c as _,N as P,d as E,e as S,f as T,o as A,i as L,h as C,j as R,k as $,p as I,l as z,m as O,n as W}from"./protected-page.js";function D(n,c,s=!1,t=!1,l=!1,b=!1){var o=n,e="";if(s)var p=n;y(()=>{var a=k;if(e!==(e=c()??"")){if(s){a.nodes=null,p.innerHTML=e,e!==""&&g(m(p),p.lastChild);return}if(a.nodes!==null&&(x(a.nodes.start,a.nodes.end),a.nodes=null),e!==""){var d=t?P:l?E:void 0,r=_(t?"svg":l?"math":"template",d);r.innerHTML=e;var i=t||l?r:r.content;if(g(m(i),i.lastChild),t||l)for(;m(i);)o.before(m(i));else o.before(i)}}})}const V="modulepreload",M=function(n){return"/"+n},f={},u=function(c,s,t){let l=Promise.resolve();if(s&&s.length>0){let o=function(a){return Promise.all(a.map(d=>Promise.resolve(d).then(r=>({status:"fulfilled",value:r}),r=>({status:"rejected",reason:r}))))};document.getElementsByTagName("link");const e=document.querySelector("meta[property=csp-nonce]"),p=(e==null?void 0:e.nonce)||(e==null?void 0:e.getAttribute("nonce"));l=o(s.map(a=>{if(a=M(a),a in f)return;f[a]=!0;const d=a.endsWith(".css"),r=d?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${a}"]${r}`))return;const i=document.createElement("link");if(i.rel=d?"stylesheet":V,d||(i.as="script"),i.crossOrigin="",i.href=a,p&&i.setAttribute("nonce",p),document.head.appendChild(i),d)return new Promise((v,h)=>{i.addEventListener("load",v),i.addEventListener("error",()=>h(new Error(`Unable to preload CSS for ${a}`)))})}))}function b(o){const e=new Event("vite:preloadError",{cancelable:!0});if(e.payload=o,window.dispatchEvent(e),!e.defaultPrevented)throw o}return l.then(o=>{for(const e of o||[])e.status==="rejected"&&b(e.reason);return c().catch(b)})};function N({navLinks:n=S()}={}){const c=n.filter(t=>t.placement==="start"),s=n.filter(t=>t.placement!=="start");return`
    <header class="header navbar inti-shell-header">
      <div class="logo">
        <div class="logo-icon" aria-hidden="true">
          <img class="logo-icon-dark" src="/icons/inti-logo.svg" alt="" />
          <img class="logo-icon-light" src="/icons/inti-light.svg" alt="" />
        </div>
        <span class="logo-name">Inti</span>
      </div>
      ${c.length>0?`
      <div class="header-nav header-nav-start">
        ${c.map(t=>`
        <a href="${t.href}" class="header-settings-link inti-nav-link" title="${t.title}">
          <span class="icon ${t.iconClass}" aria-hidden="true"></span>
          ${t.label}
        </a>`).join("")}
      </div>`:""}
      <div class="header-nav header-nav-end">
        ${s.map(t=>`
        <a href="${t.href}" class="header-settings-link inti-nav-link" title="${t.title}">
          <span class="icon ${t.iconClass}" aria-hidden="true"></span>
          ${t.label}
        </a>`).join("")}
        <button id="theme-toggle" class="theme-toggle inti-theme-toggle" type="button" title="Switch theme" aria-label="Switch theme">
          <span class="theme-icon theme-icon-light icon icon-sun" aria-hidden="true"></span>
          <span class="theme-icon theme-icon-dark icon icon-moon" aria-hidden="true"></span>
          <span id="theme-toggle-label">Theme</span>
        </button>
      </div>
    </header>
  `}function j(){return`
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
              <select class="select select-bordered" id="provider-select" data-inti-dropdown title="Summarizer provider">
                <option value="">Server default</option>
              </select>
            </div>
            <div class="select-wrap provider-wrap inti-select-wrap" id="sum-model-wrap" hidden>
              <select class="select select-bordered" id="sum-model-select" data-inti-dropdown title="Summarizer model"></select>
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
  `}function F(){return`
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
          <div class="dropdown dropdown-top dropdown-end split-button inti-split-button" id="result-download-group">
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
            <ul id="result-download-menu" class="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm split-menu" role="menu" hidden>
              <li><button type="button" data-format="txt" role="menuitem">Download .txt</button></li>
              <li><button type="button" data-format="md" role="menuitem">Download .md</button></li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  `}function G(){return`
    <section class="panel panel-tts inti-workspace-card card bg-base-100/90 shadow-2xl shadow-base-content/10">
      <div class="section-heading inti-panel-heading">
        <span class="ornament inti-panel-ornament" aria-hidden="true"></span>
        <h2>Speech</h2>
        <span class="source-chip badge badge-outline">Audio stays available after edits</span>
      </div>

      <div class="field-block inti-surface">
        <div class="field-head">
          <span>Working Text</span>
          <span id="speech-input-count">0 characters</span>
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
  `}function U(){return`
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
  `}function B(){return`
    <div id="img-preview-modal" hidden>
      <div id="img-preview-backdrop"></div>
      <div id="img-preview-box">
        <img id="img-preview-img" src="" alt="Preview" />
        <button id="img-preview-close" title="Close">×</button>
      </div>
    </div>
  `}function H({navLinks:n}={}){return`
    <div class="app inti-shell">
      ${N({navLinks:n})}
      <main class="main-grid inti-shell-main">
        ${j()}
        ${F()}
        ${G()}
        ${U()}
      </main>
    </div>
    ${B()}
  `}function q(n,c){z(c,!1);const s=T(),t=H({navLinks:s.navLinks()});async function l(){const[{initFeed:e},{updateTextMetrics:p},{initOCR:a},{initProviders:d},{initSummarizer:r},{initTTS:i,synthesizeText:v},{initVoices:h}]=await Promise.all([u(()=>import("./feed.js").then(w=>w.c),__vite__mapDeps([0,1])),u(()=>import("./metrics.js"),__vite__mapDeps([2,1])),u(()=>import("./ocr.js"),__vite__mapDeps([3,1,0,4,5,6])),u(()=>import("./providers.js"),__vite__mapDeps([7,1,0,4,5,6])),u(()=>import("./summarizer.js"),__vite__mapDeps([8,1,0,2,4,5,6,9])),u(()=>import("./tts.js"),__vite__mapDeps([10,1,0,2,4,5,6,9])),u(()=>import("./voices.js"),__vite__mapDeps([11,1,0,4,5,6]))]);e(),d(),await h(),a(),r({synthesizeText:v}),i(),p()}A(()=>{if(!window.__intiLegacyWorkspaceInitialized)return window.__intiLegacyWorkspaceInitialized=!0,O({apiURL:s.apiURL}),l()}),L();var b=C(),o=R(b);D(o,()=>t),$(n,b),I()}W(q,{target:document.getElementById("app")});
