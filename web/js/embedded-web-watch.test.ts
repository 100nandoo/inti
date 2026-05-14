import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import {
  createUnauthorizedBuildConfig,
  createUnauthorizedPageWriter,
} from '../../scripts/lib/embedded-web-build.mjs';
import { formatWatchEvent } from '../../scripts/watch-web.mjs';

test('createUnauthorizedBuildConfig enables watch mode when requested', () => {
  const config = createUnauthorizedBuildConfig({
    outDir: '/tmp/inti-web-watch',
    watch: {} as never,
  });

  assert.equal(config.build.outDir, '/tmp/inti-web-watch');
  assert.deepEqual(config.build.watch, {});
  assert.equal(config.build.rollupOptions.input.endsWith('web-src/src/unauthorized/render.ts'), true);
});

test('createUnauthorizedPageWriter writes the rendered unauthorized page', async () => {
  const tempDir = await mkdtemp(resolve(tmpdir(), 'inti-watch-test-'));
  const rendererModulePath = resolve(tempDir, 'render.mjs');
  const outputDir = resolve(tempDir, 'web');
  const outputFile = resolve(outputDir, '401.html');

  await mkdir(outputDir, { recursive: true });
  await writeFile(
    rendererModulePath,
    'export function renderUnauthorizedPage() { return "<main>unauthorized</main>"; }\n',
  );

  const plugin = createUnauthorizedPageWriter({ rendererModulePath, outputFile });
  await plugin.writeBundle();

  assert.equal(await readFile(outputFile, 'utf8'), '<main>unauthorized</main>');
});

test('formatWatchEvent reports start, success, and failure states', () => {
  assert.equal(formatWatchEvent('embedded web', { code: 'START' }), 'embedded web build started');
  assert.equal(formatWatchEvent('embedded web', { code: 'END' }), 'embedded web build completed');
  assert.equal(formatWatchEvent('embedded web', { code: 'ERROR' }), 'embedded web build failed');
  assert.equal(formatWatchEvent('embedded web', { code: 'BUNDLE_END' }), null);
});
