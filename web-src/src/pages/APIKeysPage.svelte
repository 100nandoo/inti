<script lang="ts">
  import { onMount } from 'svelte';
  import PageShell from '../components/PageShell.svelte';
  import { createProtectedPage } from '../lib/protected-page.js';
  import { createAPIKey, deleteAPIKey, listAPIKeys } from '../lib/api-keys-service.js';

  type APIKeyRecord = {
    id: string;
    name: string;
    prefix: string;
    createdAt: string;
    lastUsedAt: string;
  };

  type CreateAPIKeyResponse = {
    key?: APIKeyRecord;
    raw?: string;
  };

  type CopyLabel = 'Copy' | 'Copied!' | 'Copy failed';

  type ModalState = {
    open: boolean;
    value: string;
    copyLabel: CopyLabel;
  };

  const protectedPage = createProtectedPage({
    navItems: [
      {
        path: '/',
        label: 'Back',
        title: 'Back to app',
        iconClass: 'icon-chevron-left',
      },
    ],
  });

  const initialModalState = (): ModalState => ({
    open: false,
    value: '',
    copyLabel: 'Copy',
  });

  let navLinks = protectedPage.navLinks();
  let newKeyName = '';
  let createStatus = '';
  let keys: APIKeyRecord[] = [];
  let errorMessage = '';
  let modalState = initialModalState();

  function readErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }

  function formatDate(iso: string): string {
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
      keys = (await listAPIKeys({ apiURL: protectedPage.apiURL })) as APIKeyRecord[];
    } catch (error) {
      errorMessage = `Could not load keys: ${readErrorMessage(error)}`;
    }
  }

  async function handleCreate() {
    createStatus = 'Creating…';
    try {
      const result = (await createAPIKey({
        apiURL: protectedPage.apiURL,
        name: newKeyName.trim(),
      })) as CreateAPIKeyResponse;
      newKeyName = '';
      createStatus = '';
      modalState = {
        open: true,
        value: result.raw || '',
        copyLabel: 'Copy',
      };
      await handleLoad();
    } catch (error) {
      createStatus = `Error: ${readErrorMessage(error)}`;
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete key "${name}"?\n\nAny requests using it will immediately return 401.`)) {
      return;
    }

    try {
      await deleteAPIKey({ apiURL: protectedPage.apiURL, id });
      await handleLoad();
    } catch (error) {
      errorMessage = `Delete failed: ${readErrorMessage(error)}`;
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(modalState.value);
      modalState = {
        ...modalState,
        copyLabel: 'Copied!',
      };
      window.setTimeout(() => {
        if (modalState.copyLabel === 'Copied!') {
          modalState = {
            ...modalState,
            copyLabel: 'Copy',
          };
        }
      }, 2000);
    } catch {
      modalState = {
        ...modalState,
        copyLabel: 'Copy failed',
      };
    }
  }

  function closeModal() {
    modalState = initialModalState();
  }

  function useCreatedKey() {
    navLinks = protectedPage.setCurrentAPIKey(modalState.value);
    closeModal();
    void handleLoad();
  }

  onMount(() => {
    void handleLoad();
  });
</script>

<PageShell {navLinks}>
  <div class="card inti-page-card">
    <div class="info-row inti-section-heading">
      <span class="pill inti-kicker">Manage Keys</span>
      <span class="ocr-hint inti-muted">Keys are stored server-side. This page requires a valid <code>?key=...</code> in the URL.</span>
    </div>

    <div class="settings-actions-row" style="margin-top:4px;">
      <input type="text" id="new-key-name" class="input input-bordered settings-key-input" bind:value={newKeyName} placeholder="Key name (optional)" style="flex:1;max-width:260px;" />
      <button id="create-key-btn" class="btn-primary btn btn-primary" on:click={handleCreate}>+ Create Key</button>
      <span class="status-text">{createStatus}</span>
    </div>

    <div class="settings-hint" style={`display:${keys.length === 0 ? 'block' : 'none'};color:var(--accent);margin-top:12px;`}>
      No keys yet. Open this page with <code>?key=YOUR_INTI_MAIN_KEY</code> to create the first generated key.
    </div>

    {#if keys.length > 0}
      <div class="overflow-x-auto">
        <table class="keys-table table table-zebra">
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
                <button class="btn-secondary btn btn-ghost btn-sm border border-base-300" style="font-size:12px;padding:4px 10px;" on:click={() => handleDelete(key.id, key.name)}>
                  Delete
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
        </table>
      </div>
    {:else}
      <p class="inti-muted" style="font-size:13px;color:var(--muted);margin:16px 0 0;">
        No keys yet. Create one above to enable authentication.
      </p>
    {/if}

    {#if errorMessage}
      <p class="inti-muted" style="font-size:13px;color:var(--error);margin:16px 0 0;">{errorMessage}</p>
    {/if}
  </div>
</PageShell>

{#if modalState.open}
  <div id="key-modal" class="modal modal-open" style="display:flex;">
    <div
      id="key-modal-backdrop"
      class="modal-backdrop"
      role="button"
      tabindex="0"
      aria-label="Close API key modal"
      on:click={closeModal}
      on:keydown={(event) => (event.key === 'Enter' || event.key === ' ') && closeModal()}
    ></div>
    <div id="key-modal-box" class="modal-box inti-page-card">
      <h3>API Key Created</h3>
      <p class="key-warning">Copy this key now - it won't be shown again.</p>
      <code id="key-modal-value" class="key-display">{modalState.value}</code>
      <div class="modal-actions">
        <button id="key-modal-copy" class="btn-secondary btn btn-ghost border border-base-300" on:click={handleCopy}>{modalState.copyLabel}</button>
        <button id="key-modal-save" class="btn-primary btn btn-primary" on:click={useCreatedKey}>Use This Key</button>
      </div>
    </div>
  </div>
{/if}
