import { escHtml } from './text.js';

export function inlineMarkdown(text) {
  return escHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

export function renderMarkdown(markdown) {
  const lines = markdown.split('\n');
  let html = '';
  let inList = false;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    const heading = line.match(/^(#{1,3})\s+(.+)/);
    if (heading) {
      if (inList) {
        html += '</ul>';
        inList = false;
      }

      const level = heading[1].length;
      html += `<h${level}>${inlineMarkdown(heading[2])}</h${level}>`;
      continue;
    }

    const listItem = line.match(/^[-*]\s+(.+)/);
    if (listItem) {
      if (!inList) {
        html += '<ul>';
        inList = true;
      }

      html += `<li>${inlineMarkdown(listItem[1])}</li>`;
      continue;
    }

    if (inList) {
      html += '</ul>';
      inList = false;
    }

    if (line === '') continue;
    html += `<p>${inlineMarkdown(line)}</p>`;
  }

  if (inList) {
    html += '</ul>';
  }

  return html;
}
