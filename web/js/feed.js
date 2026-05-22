import { feed, feedEmpty, playingBar, statusText } from './dom.js';
import { formatFeedTime } from './date.js';
import { escHtml } from './text.js';

const DESKTOP_ACTIVITY_QUERY = '(min-width: 1181px)';

let desktopFeedQuery = null;
let feedListenersBound = false;
let feedSyncQueued = false;

function isDesktopActivityLayout() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  desktopFeedQuery ??= window.matchMedia(DESKTOP_ACTIVITY_QUERY);
  return desktopFeedQuery.matches;
}

function getFeedItems() {
  return Array.from(feed?.querySelectorAll('.feed-item') ?? []);
}

function queueFeedVisibilitySync() {
  if (!feed || feedSyncQueued) {
    return;
  }

  feedSyncQueued = true;
  window.requestAnimationFrame(() => {
    feedSyncQueued = false;
    syncFeedVisibility();
  });
}

function syncFeedVisibility() {
  if (!feed) {
    return;
  }

  const items = getFeedItems();
  for (const item of items) {
    item.hidden = false;
  }

  if (!isDesktopActivityLayout()) {
    return;
  }

  const visibleBudget = feed.clientHeight;
  if (visibleBudget <= 0) {
    return;
  }

  let consumedHeight = 0;
  let hasVisibleItem = false;
  for (const item of items) {
    const nextHeight = item.offsetHeight;
    if (!hasVisibleItem || consumedHeight + nextHeight <= visibleBudget) {
      consumedHeight += nextHeight;
      hasVisibleItem = true;
      continue;
    }

    item.hidden = true;
  }
}

function ensureFeedListeners() {
  if (feedListenersBound || !feed || typeof window === 'undefined') {
    return;
  }

  feedListenersBound = true;
  desktopFeedQuery ??= typeof window.matchMedia === 'function'
    ? window.matchMedia(DESKTOP_ACTIVITY_QUERY)
    : null;

  const sync = () => queueFeedVisibilitySync();
  window.addEventListener('resize', sync);
  desktopFeedQuery?.addEventListener?.('change', sync);
  desktopFeedQuery?.addListener?.(sync);
}

export function initFeed() {
  ensureFeedListeners();
  queueFeedVisibilitySync();
}

export function addFeed(kind, label, meta) {
  ensureFeedListeners();
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
  queueFeedVisibilitySync();
  return item;
}

export function updateFeedItem(item, kind, label, meta) {
  item.className = `feed-item ${kind}`;
  item.querySelector('.feed-label').textContent = label;
  item.querySelector('.feed-meta').textContent = meta;
  queueFeedVisibilitySync();
}

export function setStatus(message, kind = '') {
  statusText.textContent = message;
  statusText.className = `status-text${kind ? ` ${kind}` : ''}`;
}

export function setPlaying(value) {
  playingBar.classList.toggle('active', value);
}
