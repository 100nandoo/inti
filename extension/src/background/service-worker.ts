/// <reference lib="webworker" />

import type { Message, ArticleData, SummaryData, Settings, SummaryResponse } from '../shared/types.js';
import { getStorage, setStorage } from '../shared/storage.js';
import { getSidePanelApi, ignoreAsyncResult, runtimeSendMessage, tabsQuery, tabsSendMessage } from '../shared/webext.js';
import {
  STORAGE_KEY_LAST_SUMMARY,
  STORAGE_KEY_SETTINGS,
  STORAGE_KEY_UI_STATE,
  BADGE_LOADING,
  BADGE_SUCCESS,
  BADGE_ERROR,
} from '../shared/constants.js';

type ToolbarActionApi = {
  onClicked?: {
    addListener: (callback: (tab: chrome.tabs.Tab) => void) => void;
  };
  setBadgeText?: (details: { text: string }) => Promise<void> | void;
  setBadgeBackgroundColor?: (details: { color: string }) => Promise<void> | void;
};

type SidebarActionApi = {
  open?: () => Promise<void> | void;
};

function getToolbarAction(): ToolbarActionApi | undefined {
  return (chrome.action ?? chrome.browserAction) as ToolbarActionApi | undefined;
}

function getSidebarAction(): SidebarActionApi | undefined {
  return (chrome as typeof chrome & { sidebarAction?: SidebarActionApi }).sidebarAction;
}

function isExtensionOrBrowserPage(url?: string): boolean {
  if (!url) {
    return false;
  }

  return url.startsWith('moz-extension://')
    || url.startsWith('chrome-extension://')
    || url.startsWith('about:');
}

async function resolveTargetTabId(explicitTabId?: number): Promise<number | undefined> {
  if (explicitTabId) {
    return explicitTabId;
  }

  const tabs = await tabsQuery({ currentWindow: true });
  const activeTab = tabs.find((tab) => tab.active);
  if (activeTab?.id && !isExtensionOrBrowserPage(activeTab.url)) {
    return activeTab.id;
  }

  const fallbackTab = tabs
    .filter((tab) => tab.id && !isExtensionOrBrowserPage(tab.url))
    .sort((a, b) => (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0))[0];

  return fallbackTab?.id;
}

async function restoreLastSummaryOrIdle(): Promise<void> {
  const lastSummary = await getStorage<SummaryData>(STORAGE_KEY_LAST_SUMMARY);
  if (lastSummary) {
    await setStorage(STORAGE_KEY_UI_STATE, 'done');
    ignoreAsyncResult(runtimeSendMessage({
      action: 'SUMMARY_READY',
      payload: lastSummary,
    } satisfies Message));
    return;
  }

  await setStorage(STORAGE_KEY_UI_STATE, 'idle');
}

export function initBackground(): void {
  console.log('Inti background script loading...');

  const isAndroid = navigator.userAgent.includes('Android');
  const toolbarAction = getToolbarAction();

  // Create context menu on install
  chrome.runtime.onInstalled.addListener(() => {
    if (chrome.contextMenus) {
      chrome.contextMenus.create({
        id: 'summarize-page',
        title: 'Summarize Page with Inti',
        contexts: ['page', 'link']
      });
    }
  });

  // Handle context menu clicks
  if (chrome.contextMenus) {
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      if (info.menuItemId === 'summarize-page' && tab?.id) {
        triggerFlow(tab, isAndroid);
      }
    });
  }

  chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
    if (message.action === 'TRIGGER_SUMMARY') {
      handleTriggerSummary(isAndroid).catch((err: unknown) => {
        broadcastError(String(err));
      });
      sendResponse({ ok: true });
      return false;
    }
    return false;
  });

  // Toolbar icon click → trigger summary directly (no popup)
  toolbarAction?.onClicked?.addListener((tab) => {
    console.log('Action clicked', tab.id);
    triggerFlow(tab, isAndroid);
  });
}

async function triggerFlow(tab: chrome.tabs.Tab, isAndroid: boolean) {
  if (!tab.id) {
    console.error('No tab ID in triggerFlow');
    return;
  }
  const tabId = tab.id;

  if (isAndroid) {
    // Android: overlay shows full result inline
    console.log('Android flow started for tab', tabId);
    handleTriggerSummary(isAndroid, tabId).catch((err: unknown) => {
      console.error('Android flow error', err);
      broadcastError(String(err));
    });
    return;
  }

  if (!getSidePanelApi()) {
    const sidebarAction = getSidebarAction();
    try {
      await Promise.resolve(sidebarAction?.open?.());
    } catch (error) {
      console.warn('Could not open Firefox sidebar from user action', error);
    }

    try {
      const hasSummary = await handleTriggerSummary(isAndroid, tabId);
      if (hasSummary) {
        ignoreAsyncResult(tabsSendMessage(tabId, { action: 'HIDE_OVERLAY' } satisfies Message));
      }
    } catch (err: unknown) {
      broadcastError(String(err));
    }
    return;
  }

  try {
    const hasSummary = await handleTriggerSummary(isAndroid, tabId);
    if (!hasSummary) {
      return;
    }

    const sidebarOpened = await openDesktopSidebar(tabId);
    if (sidebarOpened) {
      ignoreAsyncResult(tabsSendMessage(tabId, { action: 'HIDE_OVERLAY' } satisfies Message));
    }
  } catch (err: unknown) {
    broadcastError(String(err));
  }
}

async function handleTriggerSummary(isAndroid: boolean, tabId?: number): Promise<boolean> {
  // 1. Show loading badge and broadcast loading state
  await setBadge(BADGE_LOADING);
  await setStorage(STORAGE_KEY_UI_STATE, 'loading');
  ignoreAsyncResult(runtimeSendMessage({ action: 'SHOW_LOADING' } satisfies Message));

  // 2. Read API URL from settings
  const settings = await getStorage<Settings>(STORAGE_KEY_SETTINGS);
  const baseUrl = settings?.apiUrl?.trim();
  if (!baseUrl) {
    await setBadge(BADGE_ERROR);
    broadcastError('API URL not configured. Open Inti settings to set it up.');
    return false;
  }
  const apiUrl = baseUrl.replace(/\/$/, '') + '/api/summarize';

  // 3. Resolve the target tab. When Inti is opened as an extension page on
  // Android, the active tab is the extension itself, so we fall back to the
  // most recently accessed real page in the window.
  const targetTabId = await resolveTargetTabId(tabId);

  if (!targetTabId) {
    await restoreLastSummaryOrIdle();
    return false;
  }

  // 4. Extract article content via content script
  let articleData: ArticleData;
  try {
    console.log('Sending EXTRACT message to tab', targetTabId);
    const response = await tabsSendMessage<ArticleData | { error: string }>(targetTabId, {
      action: 'EXTRACT',
    } satisfies Message);

    if ('error' in response) {
      throw new Error(response.error);
    }
    articleData = response;
  } catch (e) {
    console.error('Extraction failed', e);
    await setBadge(BADGE_ERROR);
    broadcastError('Could not extract content from this page. Make sure the page is fully loaded.');
    return false;
  }

  // 5. Call summarization API
  let summary: string;
  try {
    console.log('Calling API', apiUrl);
    const requestBody: { text: string; instruction?: string } = {
      text: articleData.textContent,
    };
    if (settings?.instruction?.trim()) {
      requestBody.instruction = settings.instruction.trim();
    }
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (settings?.apiKey?.trim()) {
      headers['X-API-Key'] = settings.apiKey.trim();
    }

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      throw new Error(`API responded with status ${res.status}`);
    }

    const json = await res.json() as SummaryResponse;
    summary = json.summary;
    const provider = json.provider;
    const model = json.model;

    // 6. Persist result
    const summaryData: SummaryData = {
      summary,
      articleTitle: articleData.title,
      timestamp: Date.now(),
      provider,
      model,
    };
    await setStorage(STORAGE_KEY_LAST_SUMMARY, summaryData);

    await setStorage(STORAGE_KEY_UI_STATE, 'done');

    // 7. Success badge
    await setBadge(BADGE_SUCCESS);

    // 8. Route to UI surfaces
    ignoreAsyncResult(runtimeSendMessage({
      action: 'SUMMARY_READY',
      payload: summaryData,
    } satisfies Message));

    ignoreAsyncResult(tabsSendMessage(targetTabId, {
      action: 'SHOW_OVERLAY',
      payload: summaryData,
    } satisfies Message));

    return true;
  } catch (e) {
    console.error('API call failed', e);
    await setBadge(BADGE_ERROR);
    await setStorage(STORAGE_KEY_UI_STATE, 'error');
    broadcastError(String(e));
    return false;
  }
}

async function openDesktopSidebar(tabId: number): Promise<boolean> {
  const sidePanelApi = getSidePanelApi();
  if (sidePanelApi?.open) {
    try {
      await sidePanelApi.open({ tabId });
      return true;
    } catch (error) {
      console.warn('Could not open Chrome side panel after summary completed', error);
    }
  }

  const sidebarAction = getSidebarAction();
  if (!sidebarAction?.open) {
    return false;
  }

  try {
    await Promise.resolve(sidebarAction.open());
    return true;
  } catch (error) {
    console.warn('Could not open Firefox sidebar after summary completed', error);
    return false;
  }
}

async function setBadge(badge: { text: string; color: string }): Promise<void> {
  const toolbarAction = getToolbarAction();
  if (!toolbarAction?.setBadgeText || !toolbarAction?.setBadgeBackgroundColor) {
    return;
  }

  await Promise.all([
    Promise.resolve(toolbarAction.setBadgeText({ text: badge.text })),
    Promise.resolve(toolbarAction.setBadgeBackgroundColor({ color: badge.color })),
  ]);
}

function broadcastError(message: string): void {
  ignoreAsyncResult(runtimeSendMessage({
    action: 'ERROR',
    payload: message,
  } satisfies Message));
}
