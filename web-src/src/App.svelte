<script>
  import { onMount } from 'svelte';
  import { renderAppShell } from './lib/app-shell.js';

  const appShell = renderAppShell();

  onMount(async () => {
    if (window.__intiLegacyWorkspaceInitialized) return;
    window.__intiLegacyWorkspaceInitialized = true;

    const [
      { initFeed },
      { updateTextMetrics },
      { initOCR },
      { initProviders },
      { initSummarizer },
      { initTTS, synthesizeText },
      { initVoices },
    ] = await Promise.all([
      import('../../web/js/feed.js'),
      import('../../web/js/metrics.js'),
      import('../../web/js/ocr.js'),
      import('../../web/js/providers.js'),
      import('../../web/js/summarizer.js'),
      import('../../web/js/tts.js'),
      import('../../web/js/voices.js'),
    ]);

    initFeed();
    initProviders();
    initVoices();
    initOCR();
    initSummarizer({ synthesizeText });
    initTTS();
    updateTextMetrics();
  });
</script>

{@html appShell}
