import { marked } from 'marked';

const allowedTags = new Set([
  'A',
  'BLOCKQUOTE',
  'BR',
  'CODE',
  'EM',
  'H1',
  'H2',
  'H3',
  'H4',
  'HR',
  'LI',
  'OL',
  'P',
  'PRE',
  'STRONG',
  'UL',
]);

const passthroughTags = new Set(['BODY', 'HTML']);
const droppedTags = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META']);

function sanitizeUrl(href: string): string | null {
  try {
    const url = new URL(href, 'https://example.invalid');
    if (url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'mailto:') {
      return href;
    }
  } catch {
    return null;
  }

  return null;
}

function appendSanitizedNode(node: Node, target: Node, doc: Document): void {
  if (node.nodeType === Node.TEXT_NODE) {
    target.appendChild(doc.createTextNode(node.textContent ?? ''));
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  const element = node as Element;
  const tagName = element.tagName.toUpperCase();

  if (droppedTags.has(tagName)) {
    return;
  }

  if (passthroughTags.has(tagName)) {
    for (const child of Array.from(element.childNodes)) {
      appendSanitizedNode(child, target, doc);
    }
    return;
  }

  if (!allowedTags.has(tagName)) {
    for (const child of Array.from(element.childNodes)) {
      appendSanitizedNode(child, target, doc);
    }
    return;
  }

  const cleanEl = doc.createElement(tagName.toLowerCase());

  if (tagName === 'A') {
    const href = element.getAttribute('href');
    if (href) {
      const safeHref = sanitizeUrl(href);
      if (safeHref) {
        cleanEl.setAttribute('href', safeHref);
        cleanEl.setAttribute('target', '_blank');
        cleanEl.setAttribute('rel', 'noopener noreferrer');
      }
    }
  }

  for (const child of Array.from(element.childNodes)) {
    appendSanitizedNode(child, cleanEl, doc);
  }

  target.appendChild(cleanEl);
}

export function renderMarkdownFragment(markdown: string, doc: Document = document): DocumentFragment {
  const html = marked.parse(markdown, { async: false, breaks: true }) as string;
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const fragment = doc.createDocumentFragment();

  for (const child of Array.from(parsed.body.childNodes)) {
    appendSanitizedNode(child, fragment, doc);
  }

  return fragment;
}
