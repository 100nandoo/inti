import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const repoRoot = resolve(new URL('..', import.meta.url).pathname);
const publicDir = resolve(repoRoot, 'web-src/public');
const webOutDir = resolve(repoRoot, 'web');

export async function syncWebPublicAssets({
  sourceDir = publicDir,
  outDir = webOutDir,
} = {}) {
  let entries;
  try {
    entries = await readdir(sourceDir, { withFileTypes: true });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return;
    }
    throw error;
  }

  await mkdir(outDir, { recursive: true });

  for (const entry of entries) {
    const from = resolve(sourceDir, entry.name);
    const to = resolve(outDir, entry.name);
    await rm(to, { recursive: true, force: true });
    await cp(from, to, { recursive: true });
  }
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  await syncWebPublicAssets();
}
