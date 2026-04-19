const VOICES = [
  { name: "Zephyr",        gender: "Female", characteristic: "Bright" },
  { name: "Puck",          gender: "Male",   characteristic: "Upbeat" },
  { name: "Charon",        gender: "Male",   characteristic: "Informative" },
  { name: "Kore",          gender: "Female", characteristic: "Firm" },
  { name: "Fenrir",        gender: "Male",   characteristic: "Excitable" },
  { name: "Leda",          gender: "Female", characteristic: "Youthful" },
  { name: "Orus",          gender: "Male",   characteristic: "Firm" },
  { name: "Aoede",         gender: "Female", characteristic: "Breezy" },
  { name: "Callirrhoe",    gender: "Female", characteristic: "Easy-going" },
  { name: "Autonoe",       gender: "Female", characteristic: "Bright" },
  { name: "Enceladus",     gender: "Male",   characteristic: "Breathy" },
  { name: "Iapetus",       gender: "Male",   characteristic: "Clear" },
  { name: "Umbriel",       gender: "Male",   characteristic: "Easy-going" },
  { name: "Algieba",       gender: "Male",   characteristic: "Smooth" },
  { name: "Despina",       gender: "Female", characteristic: "Smooth" },
  { name: "Erinome",       gender: "Female", characteristic: "Clear" },
  { name: "Algenib",       gender: "Male",   characteristic: "Gravelly" },
  { name: "Rasalgethi",    gender: "Male",   characteristic: "Informative" },
  { name: "Laomedeia",     gender: "Female", characteristic: "Upbeat" },
  { name: "Achernar",      gender: "Female", characteristic: "Soft" },
  { name: "Alnilam",       gender: "Male",   characteristic: "Firm" },
  { name: "Schedar",       gender: "Male",   characteristic: "Even" },
  { name: "Gacrux",        gender: "Female", characteristic: "Mature" },
  { name: "Pulcherrima",   gender: "Male",   characteristic: "Forward" },
  { name: "Achird",        gender: "Male",   characteristic: "Friendly" },
  { name: "Zubenelgenubi", gender: "Male",   characteristic: "Casual" },
  { name: "Vindemiatrix",  gender: "Female", characteristic: "Gentle" },
  { name: "Sadachbia",     gender: "Male",   characteristic: "Lively" },
  { name: "Sadaltager",    gender: "Male",   characteristic: "Knowledgeable" },
  { name: "Sulafat",       gender: "Female", characteristic: "Warm" },
];

const DEFAULT_VOICE = "Kore";

const textInput    = document.getElementById('text-input');
const modelSelect  = document.getElementById('model-select');
const genderFilter = document.getElementById('gender-filter');
const voiceSelect  = document.getElementById('voice-select');
const speakBtn     = document.getElementById('speak-btn');
const speakLabel   = document.getElementById('speak-label');
const downloadBtn  = document.getElementById('download-btn');
const playingBar   = document.getElementById('playing-bar');
const statusText   = document.getElementById('status-text');
const feed         = document.getElementById('feed');
const feedEmpty    = document.getElementById('feed-empty');

let lastWavBlob = null;
let processing  = false;

// --- Model dropdown ---

async function loadModels() {
  try {
    const res = await fetch('/api/models');
    if (!res.ok) return;
    const { models, default: defaultModel } = await res.json();
    modelSelect.innerHTML = '';
    models.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      if (m === defaultModel) opt.selected = true;
      modelSelect.appendChild(opt);
    });
  } catch {
    // server unreachable — leave dropdown empty, speak will fail with a clear error
  }
}

loadModels();

// --- Voice dropdown ---

function populateVoices(genderFilter = 'All', keepSelection = false) {
  const prev = keepSelection ? voiceSelect.value : DEFAULT_VOICE;
  const filtered = genderFilter === 'All' ? VOICES : VOICES.filter(v => v.gender === genderFilter);

  voiceSelect.innerHTML = '';
  filtered.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v.name;
    opt.textContent = `${v.name} — ${v.characteristic}`;
    if (v.name === prev) opt.selected = true;
    voiceSelect.appendChild(opt);
  });

  // If previous selection no longer in list, default to first
  if (!filtered.find(v => v.name === prev) && filtered.length > 0) {
    voiceSelect.selectedIndex = 0;
  }
}

populateVoices();

genderFilter.addEventListener('change', () => {
  populateVoices(genderFilter.value, true);
});

// --- Events ---

speakBtn.addEventListener('click', async () => {
  const text = textInput.value.trim();
  if (!text || processing) return;
  await speakText(text);
});

textInput.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    const text = textInput.value.trim();
    if (text && !processing) await speakText(text);
  }
});

downloadBtn.addEventListener('click', () => {
  if (!lastWavBlob) return;
  const url = URL.createObjectURL(lastWavBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vocalize-${Date.now()}.wav`;
  a.click();
  URL.revokeObjectURL(url);
  addFeed('ok', 'Downloaded', 'WAV file saved to your downloads folder');
});

// --- Core ---

async function speakText(text) {
  const voice = voiceSelect.value;
  const model = modelSelect.value;
  setProcessing(true);
  setStatus('Synthesizing…', '');

  const item = addFeed('info', `"${truncate(text, 60)}"`, `${model} · ${voice} · synthesizing…`);

  try {
    const res = await fetch('/api/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice, model }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(body.error || res.statusText);
    }

    const { wav } = await res.json();
    const wavBytes = Uint8Array.from(atob(wav), c => c.charCodeAt(0));
    lastWavBlob = new Blob([wavBytes], { type: 'audio/wav' });
    downloadBtn.disabled = false;

    updateFeedItem(item, 'ok', `"${truncate(text, 60)}"`, `${model} · ${voice} · playing…`);
    setStatus('Playing…', '');
    setPlaying(true);

    await playWAV(wav);

    setPlaying(false);
    setStatus('', '');
    updateFeedItem(item, 'ok', `"${truncate(text, 60)}"`, `${model} · ${voice} · ${(wavBytes.length / 1024).toFixed(1)} KB`);
  } catch (err) {
    setPlaying(false);
    setStatus(err.message, 'error');
    updateFeedItem(item, 'fail', `"${truncate(text, 60)}"`, err.message);
  } finally {
    setProcessing(false);
  }
}

async function playWAV(base64Wav) {
  const bytes = Uint8Array.from(atob(base64Wav), c => c.charCodeAt(0));
  const ctx   = new AudioContext();
  const buf   = await ctx.decodeAudioData(bytes.buffer);
  const src   = ctx.createBufferSource();
  src.buffer  = buf;
  src.connect(ctx.destination);
  src.start();
  return new Promise(resolve => { src.onended = () => { ctx.close(); resolve(); }; });
}

// --- UI helpers ---

function addFeed(kind, label, meta) {
  feedEmpty?.remove();
  const item = document.createElement('div');
  item.className = `feed-item ${kind}`;
  item.innerHTML = `
    <div class="feed-dot"></div>
    <div class="feed-content">
      <div class="feed-label">${escHtml(label)}</div>
      <div class="feed-meta">${escHtml(meta)}</div>
    </div>`;
  feed.prepend(item);
  return item;
}

function updateFeedItem(item, kind, label, meta) {
  item.className = `feed-item ${kind}`;
  item.querySelector('.feed-label').textContent = label;
  item.querySelector('.feed-meta').textContent  = meta;
}

function setProcessing(val) {
  processing = val;
  textInput.disabled    = val;
  modelSelect.disabled  = val;
  genderFilter.disabled = val;
  voiceSelect.disabled  = val;
  speakBtn.disabled     = val;
  speakLabel.textContent = val ? 'Synthesizing…' : 'Speak';
  const existing = speakBtn.querySelector('.btn-spinner');
  if (val && !existing) {
    const s = document.createElement('div');
    s.className = 'btn-spinner';
    speakBtn.prepend(s);
  } else if (!val && existing) {
    existing.remove();
  }
  if (!val) textInput.focus();
}

function setPlaying(val) {
  playingBar.classList.toggle('active', val);
}

function setStatus(msg, kind) {
  statusText.textContent = msg;
  statusText.className   = 'status-text' + (kind ? ` ${kind}` : '');
}

function truncate(str, n) {
  return str.length > n ? str.slice(0, n) + '…' : str;
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
