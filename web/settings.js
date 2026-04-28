const sumProviderSelect = document.getElementById('sum-provider-select');
const keyGemini         = document.getElementById('key-gemini');
const keyGroq           = document.getElementById('key-groq');
const keyOpenRouter     = document.getElementById('key-openrouter');
const sumSaveBtn        = document.getElementById('sum-save-btn');
const sumClearBtn       = document.getElementById('sum-clear-btn');
const sumSaveStatus     = document.getElementById('sum-save-status');

let serverConfig = {
  provider: '',
  model: '',
  keys: { gemini: '', groq: '', openrouter: '' },
  groqLimits: null,
};

function applyConfig(config) {
  serverConfig = {
    provider: config.provider || '',
    model: config.model || '',
    keys: {
      gemini: config.keys?.gemini || '',
      groq: config.keys?.groq || '',
      openrouter: config.keys?.openrouter || '',
    },
    groqLimits: config.groqLimits || null,
  };

  sumProviderSelect.value = serverConfig.provider;
  keyGemini.value = serverConfig.keys.gemini;
  keyGroq.value = serverConfig.keys.groq;
  keyOpenRouter.value = serverConfig.keys.openrouter;
  renderGroqUsage();
}

async function load() {
  try {
    const res = await fetch(apiURL('/api/summarizer-config'));
    if (!res.ok) throw new Error('Could not load settings');
    applyConfig(await res.json());
  } catch (err) {
    sumSaveStatus.textContent = err.message;
    sumSaveStatus.className = 'status-text error';
  }
}

async function save() {
  const provider = sumProviderSelect.value;
  const keys = {
    gemini: keyGemini.value.trim(),
    groq: keyGroq.value.trim(),
    openrouter: keyOpenRouter.value.trim(),
  };

  try {
    const res = await fetch(apiURL('/api/summarizer-config'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, model: '', keys }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(body.error || res.statusText);
    }
    applyConfig(await res.json());
    sumSaveStatus.textContent = 'Saved';
    sumSaveStatus.className = 'status-text';
  } catch (err) {
    sumSaveStatus.textContent = err.message;
    sumSaveStatus.className = 'status-text error';
  }
  setTimeout(() => { sumSaveStatus.textContent = ''; }, 2000);
}

async function clearAll() {
  try {
    const res = await fetch(apiURL('/api/summarizer-config'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: '',
        model: '',
        keys: { gemini: '', groq: '', openrouter: '' },
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(body.error || res.statusText);
    }
    applyConfig(await res.json());
    document.getElementById('groq-usage-section').hidden = true;
    sumSaveStatus.textContent = 'Cleared';
    sumSaveStatus.className = 'status-text';
  } catch (err) {
    sumSaveStatus.textContent = err.message;
    sumSaveStatus.className = 'status-text error';
  }
  setTimeout(() => { sumSaveStatus.textContent = ''; }, 2000);
}

sumSaveBtn.addEventListener('click', save);
sumClearBtn.addEventListener('click', clearAll);

preserveKeyLinks();
load();

function fmtDuration(ms) {
  if (ms <= 0) return 'now';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60), rs = s % 60;
  if (m < 60) return rs > 0 ? `${m}m ${rs}s` : `${m}m`;
  const h = Math.floor(m / 60), rm = m % 60;
  return rm > 0 ? `${h}h ${rm}m` : `${h}h`;
}

function fmtAgo(ms) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  return `${Math.round(s / 3600)}h ago`;
}

function renderGroqUsage() {
  const limits = serverConfig.groqLimits;
  if (!limits) {
    document.getElementById('groq-usage-section').hidden = true;
    return;
  }

  document.getElementById('groq-usage-section').hidden = false;

  const now = Date.now();

  if (limits.capturedAt) {
    document.getElementById('groq-usage-ts').textContent = `Updated ${fmtAgo(now - limits.capturedAt)}`;
  }

  const limReq = parseInt(limits.limitRequests) || 0;
  const remReq = parseInt(limits.remainingRequests) || 0;
  if (limReq > 0) {
    const pct = Math.round((remReq / limReq) * 100);
    const bar = document.getElementById('groq-req-bar');
    bar.style.width = pct + '%';
    bar.classList.toggle('low', pct < 20);
    document.getElementById('groq-req-numbers').textContent =
      `${remReq.toLocaleString()} / ${limReq.toLocaleString()}`;
  }

  const limTok = parseInt(limits.limitTokens) || 0;
  const remTok = parseInt(limits.remainingTokens) || 0;
  if (limTok > 0) {
    const pct = Math.round((remTok / limTok) * 100);
    const bar = document.getElementById('groq-tok-bar');
    bar.style.width = pct + '%';
    bar.classList.toggle('low', pct < 20);
    document.getElementById('groq-tok-numbers').textContent =
      `${remTok.toLocaleString()} / ${limTok.toLocaleString()}`;
  }

  function tickResets() {
    const n = Date.now();
    const reqEl = document.getElementById('groq-req-reset');
    const tokEl = document.getElementById('groq-tok-reset');
    if (limits.resetRequestsAt) {
      reqEl.textContent = `Resets in ${fmtDuration(limits.resetRequestsAt - n)}`;
    }
    if (limits.resetTokensAt) {
      tokEl.textContent = `Resets in ${fmtDuration(limits.resetTokensAt - n)}`;
    }
  }

  tickResets();
  const timer = setInterval(tickResets, 1000);
  setTimeout(() => clearInterval(timer),
    Math.max(limits.resetRequestsAt || 0, limits.resetTokensAt || 0) - Date.now() + 2000);
}
