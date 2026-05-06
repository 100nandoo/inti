import { existsSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

const rootDir = resolve(new URL('..', import.meta.url).pathname);
const firefoxDistDir = join(rootDir, 'dist', 'firefox-mv2');

if (existsSync(firefoxDistDir)) {
  rmSync(firefoxDistDir, { recursive: true, force: true });
}
