import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildExportFilename,
  downloadAudioExport,
  downloadTextExport,
} from '../../web-src/src/lib/export-service.js';
import { installDom, teardownPage } from './svelte-page-test-helpers.ts';

test('buildExportFilename derives a stable title from markdown content', () => {
  const filename = buildExportFilename('# Launch Notes\n\n- Item one', 'md');
  assert.match(filename, /^Inti_\d{4}-\d{2}-\d{2}_Launch_Notes\.md$/);
});

test('downloadTextExport writes a markdown blob through the shared export boundary', () => {
  const dom = installDom('http://localhost:8282/');
  const calls: Array<{ href: string; download: string; clicked: boolean }> = [];
  const createObjectURL = URL.createObjectURL;
  const revokeObjectURL = URL.revokeObjectURL;
  const originalCreateElement = document.createElement.bind(document);

  URL.createObjectURL = () => 'blob:summary';
  URL.revokeObjectURL = (url) => {
    assert.equal(url, 'blob:summary');
  };
  document.createElement = ((tagName: string) => {
    if (tagName !== 'a') {
      return originalCreateElement(tagName);
    }

    const link = {
      href: '',
      download: '',
      click() {
        calls.push({ href: this.href, download: this.download, clicked: true });
      },
    };

    return link as unknown as HTMLAnchorElement;
  }) as typeof document.createElement;

  try {
    assert.equal(downloadTextExport('# Launch Notes', 'md'), true);
  } finally {
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    document.createElement = originalCreateElement;
    teardownPage(dom);
  }

  assert.deepEqual(calls, [{
    href: 'blob:summary',
    download: calls[0].download,
    clicked: true,
  }]);
  assert.match(calls[0].download, /^Inti_\d{4}-\d{2}-\d{2}_Launch_Notes\.md$/);
});

test('downloadAudioExport returns false without an audio blob', () => {
  assert.equal(downloadAudioExport(null, 'audio'), false);
});
