<svelte:options css="injected" />

<script lang="ts">
  type UnauthorizedPageProps = {
    message?: string;
  };

  let { message = '__MESSAGE__' }: UnauthorizedPageProps = $props();
</script>

<svelte:head>
  <title>401 Unauthorized</title>
</svelte:head>

<main class="inti-unauthorized">
  <section class="inti-unauthorized-card">
    <div class="card-body gap-4">
      <div class="flex items-center gap-3">
        <span class="badge badge-warning badge-outline">Protected</span>
        <span class="text-sm text-base-content/70">API key required</span>
      </div>
      <h1 class="text-3xl font-semibold tracking-tight text-base-content">401 Unauthorized</h1>
      <p class="text-base leading-7 text-base-content/80">
        {message}. Open this page with a valid <code>?key=...</code> query parameter.
      </p>
    </div>
  </section>
</main>

<style>
  :global(body) {
    margin: 0;
  }

  code {
    padding: 2px 6px;
    border-radius: 6px;
    background: color-mix(in srgb, var(--paper-3) 70%, transparent);
    color: var(--ink);
  }
</style>
