import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tempRoot = resolve(repoRoot, '.tmp');
await mkdir(tempRoot, { recursive: true });
const tempOutDir = await mkdtemp(resolve(tempRoot, 'inti-unauthorized-'));

try {
  await build({
    appType: 'custom',
    configFile: false,
    plugins: [svelte()],
    publicDir: false,
    root: repoRoot,
    build: {
      emptyOutDir: true,
      minify: false,
      outDir: tempOutDir,
      rollupOptions: {
        input: resolve(repoRoot, 'web-src/src/unauthorized/render.js'),
        external: ['svelte', 'svelte/internal', 'svelte/internal/server', 'svelte/server'],
        output: {
          entryFileNames: 'render.mjs',
          format: 'es',
        },
      },
      ssr: true,
    },
  });

  const { renderUnauthorizedPage } = await import(pathToFileURL(resolve(tempOutDir, 'render.mjs')).href);
  await writeFile(resolve(repoRoot, 'web/401.html'), renderUnauthorizedPage());
} finally {
  await rm(tempOutDir, { recursive: true, force: true });
}
