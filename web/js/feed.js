import { formatFeedTime } from './date.js';
import { escHtml } from './text.js';

const DESKTOP_ACTIVITY_QUERY = '(min-width: 1181px)';

let desktopFeedQuery = null;
let feedListenersBound = false;
let feedSyncQueued = false;

function getFeed() {
  return document.getElementById('feed');
}

function getFeedEmpty() {
  return document.getElementById('feed-empty');
}

function getPlayingBar() {
  return document.getElementById('playing-bar');
}

function getStatusText() {
  return document.getElementById('status-text');
}

function isDesktopActivityLayout() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  desktopFeedQuery ??= window.matchMedia(DESKTOP_ACTIVITY_QUERY);
  return desktopFeedQuery.matches;
}

function getFeedItems() {
  return Array.from(getFeed()?.querySelectorAll('.feed-item') ?? []);
}

function queueFeedVisibilitySync() {
  if (!getFeed() || feedSyncQueued) {
    return;
  }

  feedSyncQueued = true;
  window.requestAnimationFrame(() => {
    feedSyncQueued = false;
    syncFeedVisibility();
  });
}

function syncFeedVisibility() {
  const feed = getFeed();
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
  if (feedListenersBound || !getFeed() || typeof window === 'undefined') {
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
  const feed = getFeed();
  if (!feed) {
    return null;
  }

  ensureFeedListeners();
  getFeedEmpty()?.remove();

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
  if (!item) {
    return;
  }

  item.className = `feed-item ${kind}`;
  item.querySelector('.feed-label').textContent = label;
  item.querySelector('.feed-meta').textContent = meta;
  queueFeedVisibilitySync();
}

export function setStatus(message, kind = '') {
  const statusText = getStatusText();
  if (!statusText) {
    return;
  }

  statusText.textContent = message;
  statusText.className = `status-text${kind ? ` ${kind}` : ''}`;
}

export function setPlaying(value) {
  const playingBar = getPlayingBar();
  if (!playingBar) {
    return;
  }

  playingBar.classList.toggle('active', value);
}
