import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [svelte()],
  build: {
    copyPublicDir: false,
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'web-src/src/main.js'),
      fileName: () => 'app.js',
      cssFileName: 'app',
      formats: ['es'],
    },
    outDir: resolve(__dirname, 'web/assets'),
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'app.css') return 'app.css';
          return '[name][extname]';
        },
      },
    },
  },
});
