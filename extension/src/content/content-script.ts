import { mount, unmount } from 'svelte';
import { Readability } from '@mozilla/readability';
import type { Message, ArticleData, SummaryData, UIState } from '../shared/types.js';
import Overlay from './overlay/Overlay.svelte';

// Module-level refs — only one overlay instance allowed
let shadowHost: HTMLElement | null = null;
let shadowRoot: ShadowRoot | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let overlayInstance: any = null;

export function initContentScript(): void {
  chrome.runtime.onMessage.addListener(
    (message: Message, _sender, sendResponse) => {
      switch (message.action) {
        case 'EXTRACT':
          handleExtract(sendResponse);
          return true; // keep channel open for async sendResponse

        case 'SHOW_LOADING':
          handleShowLoading();
          sendResponse({ ok: true });
          return false;

        case 'SHOW_OVERLAY':
          handleShowOverlay(message.payload as SummaryData);
          sendResponse({ ok: true });
          return false;

        case 'HIDE_OVERLAY':
          destroyOverlay();
          sendResponse({ ok: true });
          return false;

        case 'ERROR':
          handleShowError(message.payload as string);
          sendResponse({ ok: true });
          return false;

        default:
          return false;
      }
    }
  );
}

function handleExtract(
  sendResponse: (response: ArticleData | { error: string }) => void
): void {
  try {
    const doc = document.cloneNode(true) as Document;
    const reader = new Readability(doc);
    const article = reader.parse();

    if (!article) {
      sendResponse({ error: 'Readability could not parse this page.' });
      return;
    }

    sendResponse({
      title: article.title,
      textContent: article.textContent,
      excerpt: article.excerpt,
      byline: article.byline ?? null,
      length: article.length,
    });
  } catch (e) {
    sendResponse({ error: String(e) });
  }
}

function handleShowLoading(): void {
  if (shadowHost) {
    destroyOverlay();
  }

  shadowHost = document.createElement('div');
  shadowHost.id = 'inti-root';
  Object.assign(shadowHost.style, {
    position: 'fixed',
    top: '0',
    right: '0',
    width: '0',
    height: '0',
    zIndex: '2147483647',
    pointerEvents: 'none',
    border: 'none',
    padding: '0',
    margin: '0',
  });

  document.body.appendChild(shadowHost);
  shadowRoot = shadowHost.attachShadow({ mode: 'closed' });

  overlayInstance = mount(Overlay, {
    target: shadowRoot as unknown as Document,
    props: {
      summary: null,
      state: 'loading' as UIState,
      onClose: destroyOverlay,
    },
  });
}

function handleShowOverlay(summaryData: SummaryData): void {
  if (shadowHost) {
    // Already mounted — tear down and re-mount with new data
    destroyOverlay();
  }

  // Create the shadow host element
  shadowHost = document.createElement('div');
  shadowHost.id = 'inti-root';
  Object.assign(shadowHost.style, {
    position: 'fixed',
    top: '0',
    right: '0',
    width: '0',
    height: '0',
    zIndex: '2147483647',
    pointerEvents: 'none',
    border: 'none',
    padding: '0',
    margin: '0',
  });

  document.body.appendChild(shadowHost);

  // Closed shadow root — inaccessible from outside this module
  shadowRoot = shadowHost.attachShadow({ mode: 'closed' });

  // Mount Overlay.svelte into the shadow root
  overlayInstance = mount(Overlay, {
    target: shadowRoot as unknown as Document,
    props: {
      summary: summaryData,
      state: 'done' as UIState,
      onClose: destroyOverlay,
    },
  });
}

function destroyOverlay(): void {
  if (overlayInstance) {
    unmount(overlayInstance);
    overlayInstance = null;
  }
  shadowHost?.remove();
  shadowHost = null;
  shadowRoot = null;
}

function handleShowError(error: string): void {
  if (shadowHost) {
    destroyOverlay();
  }

  shadowHost = document.createElement('div');
  shadowHost.id = 'inti-root';
  Object.assign(shadowHost.style, {
    position: 'fixed',
    top: '0',
    right: '0',
    width: '0',
    height: '0',
    zIndex: '2147483647',
    pointerEvents: 'none',
    border: 'none',
    padding: '0',
    margin: '0',
  });

  document.body.appendChild(shadowHost);
  shadowRoot = shadowHost.attachShadow({ mode: 'closed' });

  overlayInstance = mount(Overlay, {
    target: shadowRoot as unknown as Document,
    props: {
      summary: null,
      errorMessage: error,
      state: 'error' as UIState,
      onClose: destroyOverlay,
    },
  });
}
