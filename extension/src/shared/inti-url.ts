import type { Settings } from './types.js';
import { tabsCreate, tabsQuery, tabsUpdate, windowsUpdate } from './webext.js';

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === '/') {
    return '/';
  }

  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

export function getIntiAppBaseUrl(settings: Settings | null | undefined): URL | null {
  const rawUrl = settings?.apiUrl?.trim();
  if (!rawUrl) {
    return null;
  }

  try {
    return new URL(rawUrl);
  } catch {
    return null;
  }
}

export function buildIntiAppUrl(settings: Settings | null | undefined): string | null {
  const url = getIntiAppBaseUrl(settings);
  if (!url) {
    return null;
  }

  const apiKey = settings?.apiKey?.trim();
  if (apiKey) {
    url.searchParams.set('key', apiKey);
  }

  return url.toString();
}

export function isMatchingIntiAppUrl(
  candidateUrl: string | undefined,
  settings: Settings | null | undefined,
): boolean {
  if (!candidateUrl) {
    return false;
  }

  const baseUrl = getIntiAppBaseUrl(settings);
  if (!baseUrl) {
    return false;
  }

  let candidate: URL;
  try {
    candidate = new URL(candidateUrl);
  } catch {
    return false;
  }

  return candidate.origin === baseUrl.origin
    && normalizePathname(candidate.pathname) === normalizePathname(baseUrl.pathname);
}

export async function openOrFocusIntiPage(settings: Settings | null | undefined): Promise<void> {
  const url = buildIntiAppUrl(settings);
  if (!url) {
    return;
  }

  const existingTab = (await tabsQuery({})).find((tab) => isMatchingIntiAppUrl(tab.url, settings));
  if (existingTab?.id) {
    await tabsUpdate(existingTab.id, { active: true, url });
    if (typeof existingTab.windowId === 'number') {
      await windowsUpdate(existingTab.windowId, { focused: true });
    }
    return;
  }

  await tabsCreate({ url });
}
