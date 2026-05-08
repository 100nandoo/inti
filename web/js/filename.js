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

function limitFilenameTitleWords(text, maxWords = 3) {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, maxWords)
    .join(' ');
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
    return limitFilenameTitleWords(cleanupFilenameSource(heading.replace(/^#{1,6}\s+/, '')));
  }

  for (const line of lines) {
    const cleaned = limitFilenameTitleWords(cleanupFilenameSource(line));
    if (cleaned) return cleaned;
  }

  return '';
}

export function sanitizeFilename(text) {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[_\s-]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function buildDownloadFilename(sourceText, ext) {
  const date = formatFilenameDate(new Date());
  const title = sanitizeFilename(extractTopicForFilename(sourceText));

  if (title) {
    return `Inti_${date}_${title}.${ext}`;
  }

  return `Inti_${date}.${ext}`;
}
