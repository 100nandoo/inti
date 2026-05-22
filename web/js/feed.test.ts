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
  setItemHeight(oldest, 32);
  const middle = feedModule.addFeed('ok', 'Middle', '2');
  setItemHeight(middle, 32);
  const newest = feedModule.addFeed('ok', 'Newest', '3');
  setItemHeight(newest, 32);

  await flushAsyncWork();

  assert.equal(newest.hidden, false);
  assert.equal(middle.hidden, false);
  assert.equal(oldest.hidden, true);
});

test('narrow layouts keep older activity entries visible even when the feed would overflow', async () => {
  const oldest = feedModule.addFeed('ok', 'Oldest', '1');
  setItemHeight(oldest, 32);
  const middle = feedModule.addFeed('ok', 'Middle', '2');
  setItemHeight(middle, 32);
  const newest = feedModule.addFeed('ok', 'Newest', '3');
  setItemHeight(newest, 32);

  await flushAsyncWork();

  assert.equal(newest.hidden, false);
  assert.equal(middle.hidden, false);
  assert.equal(oldest.hidden, false);
});
