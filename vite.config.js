import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const __dirname = dirname(fileURLToPath(import.meta.url));
const webSrcDir = resolve(__dirname, 'web-src');
const webOutDir = resolve(__dirname, 'web');

export default defineConfig({
  root: webSrcDir,
  plugins: [svelte()],
  build: {
    copyPublicDir: false,
    emptyOutDir: false,
    outDir: webOutDir,
    rollupOptions: {
      input: [
        resolve(webSrcDir, 'index.html'),
        resolve(webSrcDir, 'settings.html'),
        resolve(webSrcDir, 'api-keys.html'),
        resolve(webSrcDir, '401.html'),
      ],
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
