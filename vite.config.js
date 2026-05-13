import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const __dirname = dirname(fileURLToPath(import.meta.url));
const webSrcDir = resolve(__dirname, 'web-src');
const webOutDir = resolve(__dirname, 'web');

function copyHtmlPages() {
  const pages = ['index.html', 'settings.html', 'api-keys.html', '401.html'];

  return {
    name: 'copy-html-pages',
    async writeBundle() {
      await mkdir(webOutDir, { recursive: true });
      await Promise.all(
        pages.map((page) => copyFile(resolve(webSrcDir, page), resolve(webOutDir, page))),
      );
    },
  };
}

export default defineConfig({
  plugins: [svelte(), copyHtmlPages()],
  build: {
    copyPublicDir: false,
    emptyOutDir: false,
    outDir: webOutDir,
    rollupOptions: {
      input: {
        app: resolve(__dirname, 'web-src/src/main.js'),
        settings: resolve(__dirname, 'web-src/src/entries/settings.js'),
        'api-keys': resolve(__dirname, 'web-src/src/entries/api-keys.js'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: (assetInfo) => {
          return 'assets/[name][extname]';
        },
      },
    },
  },
});
