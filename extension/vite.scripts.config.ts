import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

const r = (p: string) => resolve(__dirname, p);

/**
 * Scripts build — service worker + content script
 *
 * These must be completely self-contained files with no import/export statements
 * so they can be loaded as classic scripts by both Chrome (background.service_worker
 * without type:module) and Firefox (background.scripts).
 *
 * `preserveEntrySignatures: false` prevents Rollup from adding a synthetic
 * `export {}` to entries with nothing to export. Since the service worker and
 * content script share no runtime code, Rollup creates no shared chunks —
 * each output file is fully inlined and free of import/export statements.
 *
 * Runs first (emptyOutDir: true) to start with a clean build/ directory.
 */
export default defineConfig({
  root: r('src'),
  plugins: [svelte()],
  build: {
    outDir: r('build'),
    emptyOutDir: true,
    target: 'es2022',
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: {
        'background/service-worker': r('src/background/service-worker.ts'),
        'content/content-script': r('src/content/content-script.ts'),
      },
      output: {
        format: 'es',
        preserveEntrySignatures: false,
        entryFileNames: '[name].js',
        // No manualChunks — each entry inlines all its own dependencies so
        // the output has no import statements pointing to shared chunk files
        manualChunks: undefined,
      },
    },
  },
});
