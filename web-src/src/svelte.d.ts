declare module '*.svelte' {
  import type { Component } from 'svelte';

  const component: Component;
  export default component;
}

interface Window {
  IntiTheme?: {
    apply?: (theme: string) => void;
    persist?: (theme: string) => void;
    theme?: string;
    summaryDownloadFormat?: string;
    ocrPromotionBehavior?: string;
    summaryPromotionBehavior?: string;
  };
  __intiLegacyWorkspaceInitialized?: boolean;
}
