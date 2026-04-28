export function ignoreAsyncResult<T>(result: Promise<T> | void | undefined): void {
  if (result && typeof (result as Promise<T>).catch === 'function') {
    (result as Promise<T>).catch(() => {});
  }
}

type ExtBrowser = typeof chrome;

function getBrowserApi(): ExtBrowser {
  return ((globalThis as { browser?: ExtBrowser }).browser ?? chrome) as ExtBrowser;
}

export async function runtimeSendMessage<T>(message: unknown): Promise<T | undefined> {
  const api = getBrowserApi();
  return api.runtime.sendMessage(message) as Promise<T | undefined>;
}

export async function tabsSendMessage<T>(tabId: number, message: unknown): Promise<T> {
  const api = getBrowserApi();
  return api.tabs.sendMessage(tabId, message) as Promise<T>;
}

export async function tabsQuery(queryInfo: chrome.tabs.QueryInfo): Promise<chrome.tabs.Tab[]> {
  const api = getBrowserApi();
  return api.tabs.query(queryInfo) as Promise<chrome.tabs.Tab[]>;
}

export async function storageLocalGet<T>(key: string): Promise<T | null> {
  const api = getBrowserApi();
  const result = await api.storage.local.get(key);
  return (result[key] as T) ?? null;
}

export async function storageLocalSet<T>(key: string, value: T): Promise<void> {
  const api = getBrowserApi();
  await api.storage.local.set({ [key]: value });
}

export async function storageLocalRemove(key: string): Promise<void> {
  const api = getBrowserApi();
  await api.storage.local.remove(key);
}
