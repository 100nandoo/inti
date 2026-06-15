const filenameDateFormatter = new Intl.DateTimeFormat('sv-SE', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function formatFilenameDate(date) {
  return filenameDateFormatter.format(date);
}

function cleanupFilenameSource(text) {
  return text
    .replace(/^[-*]\s+/, '')
    .replace(/^\d+\.\s+/, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`~>#]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
    .trim();
}

function limitFilenameTitleWords(text, maxWords = 3) {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, maxWords)
    .join(' ');
}

function extractTopicForFilename(text) {
  if (!text) return '';

  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return '';

  const heading = lines.find((line) => /^#{1,6}\s+/.test(line));
  if (heading) {
    return limitFilenameTitleWords(cleanupFilenameSource(heading.replace(/^#{1,6}\s+/, '')));
  }

  for (const line of lines) {
    const cleaned = limitFilenameTitleWords(cleanupFilenameSource(line));
    if (cleaned) return cleaned;
  }

  return '';
}

function sanitizeFilename(text) {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[_\s-]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function buildExportFilename(sourceText, ext) {
  const date = formatFilenameDate(new Date());
  const title = sanitizeFilename(extractTopicForFilename(sourceText));

  if (title) {
    return `Inti_${date}_${title}.${ext}`;
  }

  return `Inti_${date}.${ext}`;
}

export function downloadExportBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadTextExport(content, format) {
  if (!content.trim()) return false;

  const mimeType = format === 'md' ? 'text/markdown' : 'text/plain';
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  downloadExportBlob(blob, buildExportFilename(content, format));
  return true;
}

export function downloadAudioExport(blob, sourceText) {
  if (!blob) return false;
  downloadExportBlob(blob, buildExportFilename(sourceText, 'opus'));
  return true;
}
