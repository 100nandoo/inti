<script lang="ts">
  import { initializeAppRuntime } from './lib/app-runtime.js';
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
