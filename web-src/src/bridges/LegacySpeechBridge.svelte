<script lang="ts" context="module">
  let initialized = false;
</script>

<script lang="ts">
  import { onMount } from 'svelte';

  onMount(() => {
    if (initialized) return;
    initialized = true;

    void Promise.all([
      import('../../../web/js/voices.js'),
      import('../../../web/js/tts.js'),
    ]).then(async ([{ initVoices }, { initTTS }]) => {
      await initVoices();
      initTTS();
    });
  });
</script>
