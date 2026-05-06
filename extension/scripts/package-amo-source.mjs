import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const rootDir = resolve(new URL('..', import.meta.url).pathname);
const distDir = join(rootDir, 'dist');
const stageDir = join(distDir, 'amo-source');
const zipPath = join(distDir, 'amo-source.zip');

const entries = [
  'src',
  'manifests',
  'scripts',
  'AMO-SOURCE-README.md',
  'package.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'tsconfig.json',
  'vite.config.ts',
  'vite.scripts.config.ts',
  'wxt.config.ts',
];

rmSync(stageDir, { recursive: true, force: true });
rmSync(zipPath, { force: true });
mkdirSync(stageDir, { recursive: true });

for (const entry of entries) {
  const sourcePath = join(rootDir, entry);
  if (!existsSync(sourcePath)) {
    throw new Error(`Missing required source entry: ${entry}`);
  }
  cpSync(sourcePath, join(stageDir, entry), { recursive: true });
}

execFileSync('zip', ['-r', zipPath, '.'], {
  cwd: stageDir,
  stdio: 'inherit',
});
