import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';
import {
  createUnauthorizedBuildConfig,
  createUnauthorizedPageWriter,
  repoRoot,
} from './lib/embedded-web-build.mjs';

export function formatWatchEvent(label, event) {
  switch (event.code) {
    case 'START':
      return `${label} build started`;
    case 'END':
      return `${label} build completed`;
    case 'ERROR':
      return `${label} build failed`;
    default:
      return null;
  }
}

function log(message) {
  console.log(`[watch:web] ${message}`);
}

function logEvent(label, event) {
  const message = formatWatchEvent(label, event);
  if (!message) {
    return;
  }

  log(message);

  if (event.code === 'ERROR' && event.error) {
    console.error(event.error);
  }
}

async function startWatcher(label, config) {
  const watcher = await build(config);
  watcher.on('event', (event) => {
    logEvent(label, event);
  });
  return watcher;
}

async function main() {
  const tempRoot = resolve(repoRoot, '.tmp');
  await mkdir(tempRoot, { recursive: true });
  const unauthorizedOutDir = await mkdtemp(resolve(tempRoot, 'inti-unauthorized-watch-'));

  const watchers = await Promise.all([
    startWatcher('embedded web', {
      configFile: resolve(repoRoot, 'vite.config.js'),
      build: {
        watch: {},
      },
    }),
    startWatcher(
      'unauthorized page',
      createUnauthorizedBuildConfig({
        outDir: unauthorizedOutDir,
        watch: {},
        extraPlugins: [
          createUnauthorizedPageWriter({
            rendererModulePath: resolve(unauthorizedOutDir, 'render.mjs'),
            log,
          }),
        ],
      }),
    ),
  ]);

  log('watching embedded web sources');

  let closed = false;

  async function closeAll(exitCode) {
    if (closed) {
      return;
    }
    closed = true;

    await Promise.allSettled(watchers.map((watcher) => watcher.close()));
    await rm(unauthorizedOutDir, { recursive: true, force: true });
    process.exit(exitCode);
  }

  process.on('SIGINT', () => {
    void closeAll(0);
  });
  process.on('SIGTERM', () => {
    void closeAll(0);
  });
}

const executedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : null;

if (executedPath === import.meta.url) {
  await main();
}
