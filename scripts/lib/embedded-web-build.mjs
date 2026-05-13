import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const unauthorizedEntry = resolve(repoRoot, 'web-src/src/unauthorized/render.ts');
export const unauthorizedOutputFile = resolve(repoRoot, 'web/401.html');

export function createUnauthorizedBuildConfig({ outDir, watch = null, extraPlugins = [] }) {
  return {
    appType: 'custom',
    configFile: false,
    plugins: [svelte(), ...extraPlugins],
    publicDir: false,
    root: repoRoot,
    build: {
      emptyOutDir: true,
      minify: false,
      outDir,
      rollupOptions: {
        input: unauthorizedEntry,
        external: ['svelte', 'svelte/internal', 'svelte/internal/server', 'svelte/server'],
        output: {
          entryFileNames: 'render.mjs',
          format: 'es',
        },
      },
      ssr: true,
      ...(watch ? { watch } : {}),
    },
  };
}

export async function writeUnauthorizedPage({ rendererModulePath, outputFile = unauthorizedOutputFile }) {
  const moduleUrl = new URL(`?t=${Date.now()}`, pathToFileURL(rendererModulePath));
  const { renderUnauthorizedPage } = await import(moduleUrl.href);
  await writeFile(outputFile, renderUnauthorizedPage());
}

export function createUnauthorizedPageWriter({
  rendererModulePath,
  outputFile = unauthorizedOutputFile,
  log = () => {},
}) {
  return {
    name: 'inti-unauthorized-page-writer',
    async writeBundle() {
      await writeUnauthorizedPage({ rendererModulePath, outputFile });
      log(`wrote ${outputFile}`);
    },
  };
}
