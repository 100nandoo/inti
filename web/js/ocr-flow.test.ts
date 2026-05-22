import test from 'node:test';
import assert from 'node:assert/strict';

import {
  appendStagedFiles,
  filterAllowedImageFiles,
  formatStagedCount,
  getImageFilesFromClipboard,
  removeStagedFile,
  reorderStagedFiles,
} from '../../web-src/src/lib/ocr-file-staging.js';
import {
  buildOCRCompletionMeta,
  createOCRTextResult,
} from '../../web-src/src/lib/ocr-result.js';
import {
  buildOCRRejectedFilesMessage,
  executeMainWorkspaceOCR,
} from '../../web-src/src/lib/main-workspace-ocr.js';

test('OCR staging helpers keep accepted files and count rejected image types', () => {
  const files = [
    new File(['receipt'], 'receipt.png', { type: 'image/png' }),
    new File(['notes'], 'notes.txt', { type: 'text/plain' }),
    new File(['diagram'], 'diagram.svg', { type: 'image/svg+xml' }),
  ];

  const { allowedFiles, rejectedCount } = filterAllowedImageFiles(files);

  assert.equal(allowedFiles.length, 1);
  assert.equal(allowedFiles[0]?.name, 'receipt.png');
  assert.equal(allowedFiles[0]?.type, 'image/png');
  assert.equal(rejectedCount, 1);
  assert.equal(formatStagedCount(1), '1 file');
  assert.equal(formatStagedCount(2), '2 files');
});

test('OCR staging helpers append, reorder, and remove files non-destructively', () => {
  const first = new File(['1'], '1.png', { type: 'image/png' });
  const second = new File(['2'], '2.png', { type: 'image/png' });
  const third = new File(['3'], '3.png', { type: 'image/png' });

  const appended = appendStagedFiles([first], [second, third]);
  assert.deepEqual(appended, [first, second, third]);

  const reordered = reorderStagedFiles(appended, 2, 0);
  assert.deepEqual(reordered, [third, first, second]);

  const removed = removeStagedFile(reordered, 1);
  assert.deepEqual(removed, [third, second]);
});

test('OCR clipboard helpers create stable names for pasted image items and reject unsupported fallback files', () => {
  const pastedFile = new File(['pixels'], '', { type: 'image/png' });
  const unsupportedSvg = new File(['vector'], 'diagram.svg', { type: 'image/svg+xml' });
  const plainText = new File(['notes'], 'notes.txt', { type: 'text/plain' });

  const pastedImages = getImageFilesFromClipboard(
    {
      items: [
        {
          kind: 'file',
          type: 'image/png',
          getAsFile: () => pastedFile,
        },
      ] as unknown as DataTransferItemList,
    } as unknown as DataTransfer,
    { now: () => 1234 },
  );

  assert.equal(pastedImages.rejectedCount, 0);
  assert.equal(pastedImages.files.length, 1);
  assert.equal(pastedImages.files[0]?.name, 'clipboard-image-1234-0.png');
  assert.equal(pastedImages.files[0]?.type, 'image/png');

  const fallbackImages = getImageFilesFromClipboard({
    items: [] as unknown as DataTransferItemList,
    files: [unsupportedSvg, plainText] as unknown as FileList,
  } as unknown as DataTransfer);

  assert.deepEqual(fallbackImages.files, []);
  assert.equal(fallbackImages.rejectedCount, 1);
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

test('OCR workspace helpers keep rejection messaging explicit', () => {
  assert.equal(buildOCRRejectedFilesMessage(0), null);
  assert.equal(buildOCRRejectedFilesMessage(1), 'Rejected 1 unsupported image file. SVG uploads are not allowed.');
  assert.equal(buildOCRRejectedFilesMessage(2), 'Rejected 2 unsupported image files. SVG uploads are not allowed.');
});

test('OCR request helper preserves result creation without auto-promoting into working text', async () => {
  const file = new File(['pixels'], 'scan.png', { type: 'image/png' });

  const resultFromEmptyDraft = await executeMainWorkspaceOCR({
    apiURL: (path: string) => path,
    files: [file],
    workingText: '   ',
    fetchImpl: async (url, options = {}) => {
      assert.equal(String(url), '/api/ocr');
      const body = options.body as FormData;
      assert.deepEqual(body.getAll('files').map((entry) => (entry as File).name), ['scan.png']);
      return Response.json({ text: 'Scanned text from OCR' });
    },
  });

  assert.equal(resultFromEmptyDraft.ocrResult.kind, 'ocr');
  assert.equal(resultFromEmptyDraft.ocrResult.rawText, 'Scanned text from OCR');
  assert.equal(resultFromEmptyDraft.feedMeta, '4 words extracted');

  const reviewOnly = await executeMainWorkspaceOCR({
    apiURL: (path: string) => path,
    files: [file],
    workingText: 'Existing working text',
    fetchImpl: async () => Response.json({ text: 'Scanned text from OCR' }),
  });

  assert.equal(reviewOnly.ocrResult.plainText, 'Scanned text from OCR');
});
