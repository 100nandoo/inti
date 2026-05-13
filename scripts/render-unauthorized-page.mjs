import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from 'vite';
import {
  createUnauthorizedBuildConfig,
  repoRoot,
  writeUnauthorizedPage,
} from './lib/embedded-web-build.mjs';

const tempRoot = resolve(repoRoot, '.tmp');
await mkdir(tempRoot, { recursive: true });
const tempOutDir = await mkdtemp(resolve(tempRoot, 'inti-unauthorized-'));

try {
  await build(createUnauthorizedBuildConfig({ outDir: tempOutDir }));
  await writeUnauthorizedPage({ rendererModulePath: resolve(tempOutDir, 'render.mjs') });
} finally {
  await rm(tempOutDir, { recursive: true, force: true });
}
