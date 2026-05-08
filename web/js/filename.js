import { formatFilenameDate } from './date.js';

export function cleanupFilenameSource(text) {
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

export function extractTopicForFilename(text) {
  if (!text) return '';

  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return '';

  const heading = lines.find((line) => /^#{1,6}\s+/.test(line));
  if (heading) {
    return cleanupFilenameSource(heading.replace(/^#{1,6}\s+/, ''));
  }

  for (const line of lines) {
    const cleaned = cleanupFilenameSource(line);
    if (cleaned) return cleaned;
  }

  return '';
}

export function sanitizeFilename(text) {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[_\s-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function buildDownloadFilename(sourceText, ext, fallbackBase) {
  const base = sanitizeFilename(extractTopicForFilename(sourceText));
  if (base) {
    return `${base}.${ext}`;
  }

  return `${fallbackBase}-${formatFilenameDate(new Date())}.${ext}`;
}
