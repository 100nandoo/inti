<svelte:options css="injected" />

<script>
  let { message = '__MESSAGE__' } = $props();
</script>

<svelte:head>
  <title>401 Unauthorized</title>
</svelte:head>

<main class="card">
  <h1>401 Unauthorized</h1>
  <p>{message}. Open this page with a valid <code>?key=...</code> query parameter.</p>
</main>

<style>
  :global(body) {
    margin: 0;
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 16px;
  }

  .card {
    width: min(520px, calc(100vw - 32px));
    padding: 28px;
    border-radius: 18px;
    background: color-mix(in srgb, var(--paper-2) 88%, transparent);
    border: 1px solid var(--line);
    box-shadow: var(--panel-shadow);
    backdrop-filter: blur(8px);
  }

  h1 {
    margin: 0 0 12px;
    color: var(--ink);
    font-size: 28px;
    line-height: 1.1;
  }

  p {
    margin: 0;
    color: var(--ink-soft);
    line-height: 1.6;
  }

  code {
    padding: 2px 6px;
    border-radius: 6px;
    background: color-mix(in srgb, var(--paper-3) 70%, transparent);
    color: var(--ink);
  }
</style>
