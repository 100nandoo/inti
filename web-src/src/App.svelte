<script lang="ts">
  import { initializeAppRuntime } from './lib/app-runtime.js';
  import LegacyFeedBridge from './bridges/LegacyFeedBridge.svelte';
  import LegacyOCRBridge from './bridges/LegacyOCRBridge.svelte';
  import LegacyProvidersBridge from './bridges/LegacyProvidersBridge.svelte';
  import LegacySpeechBridge from './bridges/LegacySpeechBridge.svelte';
  import { createProtectedPage } from './lib/protected-page.js';
  import MainWorkspacePage from './pages/MainWorkspacePage.svelte';

  const protectedPage = createProtectedPage();
  const navLinks = protectedPage.navLinks();
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    initializeAppRuntime({
      apiURL: protectedPage.apiURL,
    });
  }
</script>

<MainWorkspacePage {navLinks} />
<LegacyFeedBridge />
<LegacyOCRBridge />
<LegacyProvidersBridge />
<LegacySpeechBridge />
