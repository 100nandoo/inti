import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildResultSurfaceViewModel,
  copyLatestResultText,
} from '../../web-src/src/lib/result-surface.js';

test('buildResultSurfaceViewModel exposes result presentation, speakable text, and promotion labels', () => {
  const summaryView = buildResultSurfaceViewModel(
    {
      latestTextResult: {
        kind: 'summary',
        title: 'Summary Result',
        format: 'markdown',
        rawText: '# Heading\n\nCondensed text',
        plainText: 'Heading Condensed text',
      },
    },
  );

  assert.equal(summaryView.hasResult, true);
  assert.equal(summaryView.hasSpeakableText, true);
  assert.equal(summaryView.kindChip, 'Summary result');
  assert.equal(summaryView.title, 'Summary Result');
  assert.match(summaryView.contentHtml, /<h1>Heading<\/h1>/);
  assert.equal(summaryView.defaultPromotionLabel, 'Replace Working Text');

  const ocrView = buildResultSurfaceViewModel(
    {
      latestTextResult: {
        kind: 'ocr',
        title: '',
        format: 'plain',
        rawText: 'Line one\nLine two',
        plainText: 'Line one\nLine two',
      },
    },
  );

  assert.equal(ocrView.kindChip, 'OCR result');
  assert.equal(ocrView.title, 'Transform result');
  assert.match(ocrView.contentHtml, /<br>/);
  assert.equal(ocrView.defaultPromotionLabel, 'Replace Working Text');
});

test('copyLatestResultText reflects clipboard availability and write failures', async () => {
  const writes: string[] = [];
  const copied = await copyLatestResultText(
    {
      kind: 'summary',
      title: 'Summary Result',
      format: 'markdown',
      rawText: '# Heading',
      plainText: 'Heading',
    },
    {
      writeText: async (text: string) => {
        writes.push(text);
      },
    } as Clipboard,
  );

  assert.equal(copied, true);
  assert.deepEqual(writes, ['Heading']);

  const failedCopy = await copyLatestResultText(
    {
      kind: 'ocr',
      title: 'OCR Result',
      format: 'plain',
      rawText: 'Uncopyable text',
      plainText: 'Uncopyable text',
    },
    {
      writeText: async () => {
        throw new Error('blocked');
      },
    } as unknown as Clipboard,
  );

  const missingClipboard = await copyLatestResultText(
    {
      kind: 'ocr',
      title: 'OCR Result',
      format: 'plain',
      rawText: 'Text without clipboard',
      plainText: 'Text without clipboard',
    },
    null as unknown as Clipboard | undefined,
  );

  assert.equal(failedCopy, false);
  assert.equal(missingClipboard, false);
});
