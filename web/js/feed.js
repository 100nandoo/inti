import { feed, feedEmpty, playingBar, statusText } from './dom.js';
import { formatFeedTime } from './date.js';
import { escHtml } from './text.js';

export function initFeed() {}

export function addFeed(kind, label, meta) {
  feedEmpty?.remove();

  const item = document.createElement('div');
  item.className = `feed-item ${kind}`;
  item.dataset.time = formatFeedTime(new Date());
  item.innerHTML = `
    <div class="feed-dot"></div>
    <div class="feed-content">
      <div class="feed-label">${escHtml(label)}</div>
      <div class="feed-meta">${escHtml(meta)}</div>
    </div>`;

  feed.prepend(item);
  return item;
}

export function updateFeedItem(item, kind, label, meta) {
  item.className = `feed-item ${kind}`;
  item.querySelector('.feed-label').textContent = label;
  item.querySelector('.feed-meta').textContent = meta;
}

export function setStatus(message, kind = '') {
  statusText.textContent = message;
  statusText.className = `status-text${kind ? ` ${kind}` : ''}`;
}

export function setPlaying(value) {
  playingBar.classList.toggle('active', value);
}
