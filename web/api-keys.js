function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

const newKeyName     = document.getElementById('new-key-name');
const createKeyBtn   = document.getElementById('create-key-btn');
const createStatus   = document.getElementById('create-status');
const setupBanner    = document.getElementById('setup-banner');
const keysTable      = document.getElementById('keys-table');
const keysBody       = document.getElementById('keys-body');
const keysEmpty      = document.getElementById('keys-empty');
const keysError      = document.getElementById('keys-error');

const keyModal       = document.getElementById('key-modal');
const keyModalValue  = document.getElementById('key-modal-value');
const keyModalCopy   = document.getElementById('key-modal-copy');
const keyModalSave   = document.getElementById('key-modal-save');
const keyModalBackdrop = document.getElementById('key-modal-backdrop');

async function loadKeys() {
  keysError.style.display = 'none';
  try {
    const res = await fetch(apiURL('/api/admin/keys'));
    if (!res.ok) throw new Error(res.statusText);
    const { keys } = await res.json();
    renderKeys(keys || []);
  } catch (e) {
    showError('Could not load keys: ' + e.message);
  }
}

function renderKeys(keys) {
  if (keys.length === 0) {
    keysTable.style.display  = 'none';
    keysEmpty.style.display  = 'block';
    setupBanner.style.display = 'block';
  } else {
    keysEmpty.style.display   = 'none';
    setupBanner.style.display = 'none';
    keysTable.style.display   = 'table';
    keysBody.innerHTML = '';
    keys.forEach((k) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${escHtml(k.name)}</td>
        <td><span class="key-prefix">${escHtml(k.prefix)}…</span></td>
        <td>${formatDate(k.createdAt)}</td>
        <td>${formatDate(k.lastUsedAt)}</td>
        <td></td>
      `;

      const actionsCell = row.lastElementChild;
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-secondary';
      deleteBtn.style.fontSize = '12px';
      deleteBtn.style.padding = '4px 10px';
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', () => deleteKey(k.id, k.name));
      actionsCell.appendChild(deleteBtn);

      keysBody.appendChild(row);
    });
  }
}

function showError(msg) {
  keysError.textContent = msg;
  keysError.style.display = 'block';
}

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

createKeyBtn.addEventListener('click', async () => {
  createKeyBtn.disabled = true;
  createStatus.textContent = 'Creating…';
  const name = newKeyName.value.trim();
  try {
    const res = await fetch(apiURL('/api/admin/keys'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error(res.statusText);
    const { raw } = await res.json();
    newKeyName.value = '';
    createStatus.textContent = '';
    showKeyModal(raw);
    await loadKeys();
  } catch (e) {
    createStatus.textContent = 'Error: ' + e.message;
  } finally {
    createKeyBtn.disabled = false;
  }
});

async function deleteKey(id, name) {
  if (!confirm(`Delete key "${name}"?\n\nAny requests using it will immediately return 401.`)) return;
  try {
    const res = await fetch(apiURL(`/api/admin/keys/${id}`), {
      method: 'DELETE',
    });
    if (!res.ok && res.status !== 204) throw new Error(res.statusText);
    await loadKeys();
  } catch (e) {
    showError('Delete failed: ' + e.message);
  }
}

function showKeyModal(raw) {
  keyModalValue.textContent = raw;
  keyModal.style.display = 'flex';
}

function closeKeyModal() {
  keyModal.style.display = 'none';
  keyModalValue.textContent = '';
}

keyModalCopy.addEventListener('click', () => {
  navigator.clipboard.writeText(keyModalValue.textContent).then(() => {
    keyModalCopy.textContent = 'Copied!';
    setTimeout(() => { keyModalCopy.textContent = 'Copy'; }, 2000);
  });
});

keyModalSave.addEventListener('click', () => {
  const raw = keyModalValue.textContent;
  setCurrentAPIKey(raw);
  closeKeyModal();
  loadKeys();
});

keyModalBackdrop.addEventListener('click', closeKeyModal);

preserveKeyLinks();
loadKeys();
