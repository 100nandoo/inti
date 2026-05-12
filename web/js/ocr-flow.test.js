import test from 'node:test';
import assert from 'node:assert/strict';

import {
  appendStagedFiles,
  filterAllowedImageFiles,
  formatStagedCount,
  removeStagedFile,
  reorderStagedFiles,
} from '../../web-src/src/lib/ocr-file-staging.js';
import {
  buildOCRCompletionMeta,
  createOCRTextResult,
} from '../../web-src/src/lib/ocr-result.js';

test('OCR staging helpers keep accepted files and count rejected image types', () => {
  const files = [
    { name: 'receipt.png', type: 'image/png' },
    { name: 'notes.txt', type: 'text/plain' },
    { name: 'diagram.svg', type: 'image/svg+xml' },
  ];

  const { allowedFiles, rejectedCount } = filterAllowedImageFiles(files);

  assert.deepEqual(allowedFiles, [{ name: 'receipt.png', type: 'image/png' }]);
  assert.equal(rejectedCount, 1);
  assert.equal(formatStagedCount(1), '1 file');
  assert.equal(formatStagedCount(2), '2 files');
});

test('OCR staging helpers append, reorder, and remove files non-destructively', () => {
  const first = { name: '1.png', type: 'image/png' };
  const second = { name: '2.png', type: 'image/png' };
  const third = { name: '3.png', type: 'image/png' };

  const appended = appendStagedFiles([first], [second, third]);
  assert.deepEqual(appended, [first, second, third]);

  const reordered = reorderStagedFiles(appended, 2, 0);
  assert.deepEqual(reordered, [third, first, second]);

  const removed = removeStagedFile(reordered, 1);
  assert.deepEqual(removed, [third, second]);
});

test('OCR result helpers publish a plain text result surface payload', () => {
  const result = createOCRTextResult('Line one\nLine two');

  assert.deepEqual(result, {
    kind: 'ocr',
    title: 'OCR Result',
    format: 'plain',
    rawText: 'Line one\nLine two',
    plainText: 'Line one\nLine two',
  });
  assert.equal(buildOCRCompletionMeta('Line one\nLine two'), '4 words extracted');
  assert.equal(buildOCRCompletionMeta(''), '0 words extracted');
});
