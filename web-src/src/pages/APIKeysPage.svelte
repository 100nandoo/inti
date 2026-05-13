<script>
  import { onMount } from 'svelte';
  import PageShell from '../components/PageShell.svelte';
  import { apiURL, buildPageLink, setCurrentAPIKey } from '../lib/page-auth.js';
  import { createAPIKey, deleteAPIKey, listAPIKeys } from '../lib/api-keys-service.js';

  let locationContext;
  let navLinks = [];
  let newKeyName = '';
  let createStatus = '';
  let keys = [];
  let errorMessage = '';
  let modalOpen = false;
  let modalValue = '';
  let copyLabel = 'Copy';

  function syncNavLinks() {
    navLinks = [
      {
        href: buildPageLink('/settings.html', locationContext),
        label: 'Settings',
        title: 'Settings',
        iconClass: 'icon-settings',
      },
      {
        href: buildPageLink('/', locationContext),
        label: 'Back',
        title: 'Back to app',
        iconClass: 'icon-chevron-left',
      },
    ];
  }

  function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  async function handleLoad() {
    errorMessage = '';
    try {
      keys = await listAPIKeys({ apiURL });
    } catch (error) {
      errorMessage = `Could not load keys: ${error.message}`;
    }
  }

  async function handleCreate() {
    createStatus = 'Creating…';
    try {
      const result = await createAPIKey({
        apiURL,
        name: newKeyName.trim(),
      });
      newKeyName = '';
      createStatus = '';
      modalValue = result.raw || '';
      modalOpen = true;
      copyLabel = 'Copy';
      await handleLoad();
    } catch (error) {
      createStatus = `Error: ${error.message}`;
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete key "${name}"?\n\nAny requests using it will immediately return 401.`)) {
      return;
    }

    try {
      await deleteAPIKey({ apiURL, id });
      await handleLoad();
    } catch (error) {
      errorMessage = `Delete failed: ${error.message}`;
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(modalValue);
      copyLabel = 'Copied!';
      window.setTimeout(() => {
        if (copyLabel === 'Copied!') copyLabel = 'Copy';
      }, 2000);
    } catch {
      copyLabel = 'Copy failed';
    }
  }

  function closeModal() {
    modalOpen = false;
    modalValue = '';
    copyLabel = 'Copy';
  }

  function useCreatedKey() {
    setCurrentAPIKey(modalValue);
    locationContext = window.location;
    syncNavLinks();
    closeModal();
    void handleLoad();
  }

  onMount(() => {
    locationContext = window.location;
    syncNavLinks();
    void handleLoad();
  });
</script>

<PageShell badge="API Keys" {navLinks}>
  <div class="card">
    <div class="info-row">
      <span class="pill">Manage Keys</span>
      <span class="ocr-hint">Keys are stored server-side. This page requires a valid <code>?key=...</code> in the URL.</span>
    </div>

    <div class="settings-actions-row" style="margin-top:4px;">
      <input type="text" id="new-key-name" class="settings-key-input" bind:value={newKeyName} placeholder="Key name (optional)" style="flex:1;max-width:260px;" />
      <button id="create-key-btn" class="btn-primary" on:click={handleCreate}>+ Create Key</button>
      <span class="status-text">{createStatus}</span>
    </div>

    <div class="settings-hint" style={`display:${keys.length === 0 ? 'block' : 'none'};color:var(--accent);margin-top:12px;`}>
      No keys yet. Open this page with <code>?key=YOUR_INTI_MAIN_KEY</code> to create the first generated key.
    </div>

    {#if keys.length > 0}
      <table class="keys-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Key prefix</th>
            <th>Created</th>
            <th>Last used</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each keys as key}
            <tr>
              <td>{key.name}</td>
              <td><span class="key-prefix">{key.prefix}…</span></td>
              <td>{formatDate(key.createdAt)}</td>
              <td>{formatDate(key.lastUsedAt)}</td>
              <td>
                <button class="btn-secondary" style="font-size:12px;padding:4px 10px;" on:click={() => handleDelete(key.id, key.name)}>
                  Delete
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else}
      <p style="font-size:13px;color:var(--muted);margin:16px 0 0;">
        No keys yet. Create one above to enable authentication.
      </p>
    {/if}

    {#if errorMessage}
      <p style="font-size:13px;color:var(--error);margin:16px 0 0;">{errorMessage}</p>
    {/if}
  </div>
</PageShell>

{#if modalOpen}
  <div id="key-modal" style="display:flex;">
    <div
      id="key-modal-backdrop"
      role="button"
      tabindex="0"
      aria-label="Close API key modal"
      on:click={closeModal}
      on:keydown={(event) => (event.key === 'Enter' || event.key === ' ') && closeModal()}
    ></div>
    <div id="key-modal-box">
      <h3>API Key Created</h3>
      <p class="key-warning">Copy this key now - it won't be shown again.</p>
      <code id="key-modal-value" class="key-display">{modalValue}</code>
      <div class="modal-actions">
        <button id="key-modal-copy" class="btn-secondary" on:click={handleCopy}>{copyLabel}</button>
        <button id="key-modal-save" class="btn-primary" on:click={useCreatedKey}>Use This Key</button>
      </div>
    </div>
  </div>
{/if}
