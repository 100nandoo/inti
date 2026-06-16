import test, { after, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { renderMainWorkspaceFixture } from './main-workspace-fixture.ts';
import {
  flushAsyncWork,
  installDomWithHTML,
  requiredElement,
  teardownPage,
} from './svelte-page-test-helpers.ts';

type FeedModule = typeof import('./feed.js');

type MatchMediaController = {
  setMatches(value: boolean): void;
};

let dom: ReturnType<typeof installDomWithHTML> | null = null;
let feedModule: FeedModule;
let desktopQuery: MatchMediaController;

function installDesktopMatchMedia() {
  const listeners = new Set<EventListenerOrEventListenerObject>();
  let matches = false;
  type LegacyMediaQueryListener = ((this: MediaQueryList, ev: MediaQueryListEvent) => unknown) | null;

  function notify(listener: EventListenerOrEventListenerObject, event: MediaQueryListEvent) {
    if (typeof listener === 'function') {
      listener.call(null, event);
      return;
    }

    listener.handleEvent(event);
  }

  window.matchMedia = () => ({
    get matches() {
      return matches;
    },
    media: '(min-width: 1181px)',
    onchange: null,
    addEventListener(_type: string, listener: EventListenerOrEventListenerObject | null) {
      if (!listener) {
        return;
      }
      listeners.add(listener);
    },
    removeEventListener(_type: string, listener: EventListenerOrEventListenerObject | null) {
      if (!listener) {
        return;
      }
      listeners.delete(listener);
    },
    addListener(listener: LegacyMediaQueryListener) {
      if (!listener) {
        return;
      }
      listeners.add(listener as EventListener);
    },
    removeListener(listener: LegacyMediaQueryListener) {
      if (!listener) {
        return;
      }
      listeners.delete(listener as EventListener);
    },
    dispatchEvent() {
      return true;
    },
  });

  return {
    setMatches(value: boolean) {
      matches = value;
      const event = { matches, media: '(min-width: 1181px)' } as MediaQueryListEvent;
      for (const listener of listeners) {
        notify(listener, event);
      }
    },
  };
}

function resetFeedMarkup() {
  requiredElement<HTMLElement>('feed').innerHTML =
    '<p class="feed-empty" id="feed-empty">No activity yet.</p>';
}

function setFeedHeight(height: number) {
  Object.defineProperty(requiredElement<HTMLElement>('feed'), 'clientHeight', {
    configurable: true,
    get: () => height,
  });
}

function setItemHeight(element: HTMLElement, height: number) {
  Object.defineProperty(element, 'offsetHeight', {
    configurable: true,
    get: () => height,
  });
}

before(async () => {
  dom = installDomWithHTML('http://localhost:8282/', renderMainWorkspaceFixture());
  desktopQuery = installDesktopMatchMedia();
  feedModule = await import('./feed.js');
  feedModule.initFeed();
});

after(() => {
  teardownPage(dom);
});

beforeEach(() => {
  resetFeedMarkup();
  setFeedHeight(88);
  desktopQuery.setMatches(false);
});

test('desktop activity feed hides the oldest items once the visible budget is exhausted', async () => {
  desktopQuery.setMatches(true);

  const oldest = feedModule.addFeed('ok', 'Oldest', '1');
  assert.ok(oldest);
  setItemHeight(oldest, 32);
  const middle = feedModule.addFeed('ok', 'Middle', '2');
  assert.ok(middle);
  setItemHeight(middle, 32);
  const newest = feedModule.addFeed('ok', 'Newest', '3');
  assert.ok(newest);
  setItemHeight(newest, 32);

  await flushAsyncWork();

  assert.equal(newest.hidden, false);
  assert.equal(middle.hidden, false);
  assert.equal(oldest.hidden, true);
});

test('narrow layouts keep older activity entries visible even when the feed would overflow', async () => {
  const oldest = feedModule.addFeed('ok', 'Oldest', '1');
  assert.ok(oldest);
  setItemHeight(oldest, 32);
  const middle = feedModule.addFeed('ok', 'Middle', '2');
  assert.ok(middle);
  setItemHeight(middle, 32);
  const newest = feedModule.addFeed('ok', 'Newest', '3');
  assert.ok(newest);
  setItemHeight(newest, 32);

  await flushAsyncWork();

  assert.equal(newest.hidden, false);
  assert.equal(middle.hidden, false);
  assert.equal(oldest.hidden, false);
});

test('feed helpers still work when the DOM nodes appear after the module is imported', async () => {
  const lateDom = installDomWithHTML('http://localhost:8282/', '<!doctype html><html><body><div id="app"></div></body></html>');
  try {
    feedModule.setStatus('booting', 'info');
    assert.equal(feedModule.addFeed('info', 'Late mount', 'pending'), null);

    document.body.insertAdjacentHTML(
      'beforeend',
      `
        <div id="playing-bar"></div>
        <span id="status-text"></span>
        <div id="feed"><p class="feed-empty" id="feed-empty">No activity yet.</p></div>
      `,
    );

    const item = feedModule.addFeed('ok', 'Mounted', 'ready');
    assert.ok(item instanceof HTMLElement);
    feedModule.updateFeedItem(item, 'ok', 'Mounted', 'done');
    feedModule.setStatus('ready', 'success');
    feedModule.setPlaying(true);

    assert.equal(requiredElement<HTMLElement>('status-text').textContent, 'ready');
    assert.equal(requiredElement<HTMLElement>('feed').firstElementChild, item);
    assert.equal(requiredElement<HTMLElement>('playing-bar').classList.contains('active'), true);
  } finally {
    teardownPage(lateDom);
    dom = installDomWithHTML('http://localhost:8282/', renderMainWorkspaceFixture());
    desktopQuery = installDesktopMatchMedia();
    feedModule.initFeed();
  }
});
