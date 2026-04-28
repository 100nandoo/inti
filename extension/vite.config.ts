import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

const r = (p: string) => resolve(__dirname, p);

/**
 * Pages build — popup, sidebar, options
 *
 * These run in their own HTML page context so ES modules and shared chunks work
 * fine. Runs second (emptyOutDir: false) so it adds on top of the scripts build.
 */
export default defineConfig({
  root: r('src'),
  plugins: [svelte()],
  build: {
    outDir: r('build'),
    emptyOutDir: false,
    target: 'es2022',
    modulePreload: { polyfill: false },
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        'popup/popup': r('src/popup/popup.html'),
        'sidebar/sidebar': r('src/sidebar/sidebar.html'),
        'options/options': r('src/options/options.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
});
