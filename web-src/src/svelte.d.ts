declare module '*.svelte' {
  import type { Component } from 'svelte';

  const component: Component;
  export default component;
}

interface Window {
  IntiTheme?: {
    apply?: (theme: string) => void;
    persist?: (theme: string) => void;
    preview?: (theme: string) => void;
    persistServer?: (theme?: string) => Promise<boolean>;
    active?: () => string;
    syncAppearanceConfig?: (appearanceConfig?: {
      theme?: string;
      summaryDownloadFormat?: string;
      ocrPromotionBehavior?: string;
      summaryPromotionBehavior?: string;
    }) => void;
    loadServerTheme?: () => Promise<boolean>;
    theme?: string;
    serverTheme?: string;
    summaryDownloadFormat?: string;
    ocrPromotionBehavior?: string;
    summaryPromotionBehavior?: string;
  };
  apiURL?: (path: string) => string;
  preserveKeyLinks?: () => void;
}
