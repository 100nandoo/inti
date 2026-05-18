<script lang="ts">
  import { onMount } from 'svelte';
  import { renderAppShell } from './lib/app-shell.js';

  type FeedModule = {
    initFeed: () => void;
  };

  type MetricsModule = {
    updateTextMetrics: () => void;
  };

  type OCRModule = {
    initOCR: () => void;
  };

  type ProvidersModule = {
    initProviders: () => void;
  };

  type SynthesizeText = (text: string, options?: { sourceLabel?: string }) => Promise<void>;

  type SummarizerModule = {
    initSummarizer: (dependencies: { synthesizeText: SynthesizeText }) => void;
  };

  type TTSModule = {
    initTTS: () => void;
    synthesizeText: SynthesizeText;
  };

  type VoicesModule = {
    initVoices: () => Promise<void>;
  };

  const appShell = renderAppShell();

  async function bootstrapLegacyWorkspace(): Promise<void> {
    const [
      { initFeed },
      { updateTextMetrics },
      { initOCR },
      { initProviders },
      { initSummarizer },
      { initTTS, synthesizeText },
      { initVoices },
    ] = await Promise.all([
      import('../../web/js/feed.js') as Promise<FeedModule>,
      import('../../web/js/metrics.js') as Promise<MetricsModule>,
      import('../../web/js/ocr.js') as Promise<OCRModule>,
      import('../../web/js/providers.js') as Promise<ProvidersModule>,
      import('../../web/js/summarizer.js') as Promise<SummarizerModule>,
      import('../../web/js/tts.js') as Promise<TTSModule>,
      import('../../web/js/voices.js') as Promise<VoicesModule>,
    ]);

    initFeed();
    initProviders();
    await initVoices();
    initOCR();
    initSummarizer({ synthesizeText });
    initTTS();
    updateTextMetrics();
  }

  onMount(() => {
    if (window.__intiLegacyWorkspaceInitialized) return;
    window.__intiLegacyWorkspaceInitialized = true;

    return bootstrapLegacyWorkspace();
  });
</script>

{@html appShell}
