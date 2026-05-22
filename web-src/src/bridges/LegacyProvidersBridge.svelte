<script lang="ts" context="module">
  let initialized = false;
</script>

<script lang="ts">
  import { onMount } from 'svelte';

  onMount(() => {
    if (initialized) return;
    initialized = true;

    void import('../../../web/js/providers.js').then(({ initProviders }) => {
      initProviders();
    });
  });
</script>
