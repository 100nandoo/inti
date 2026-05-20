import {
  apiURL as buildAuthenticatedAPIURL,
  buildPageLink as buildAuthenticatedPageLink,
  currentAPIKey as readCurrentAPIKey,
  setCurrentAPIKey as updateCurrentAPIKey,
} from './page-auth.js';

/** @typedef {import('./page-shell-contracts').PageShellNavItem} PageShellNavItem */
/** @typedef {import('./page-shell-contracts').PageShellNavLink} PageShellNavLink */

/** @type {PageShellNavItem[]} */
const defaultNavItems = [
  {
    path: '/api-keys.html',
    label: 'API Keys',
    title: 'Manage API keys',
    iconClass: 'icon-key',
  },
  {
    path: '/settings.html',
    label: 'Settings',
    title: 'Summarizer settings',
    iconClass: 'icon-settings',
  },
];

/**
 * @param {{
 *   navItems?: PageShellNavItem[];
 *   win?: Window & typeof globalThis;
 *   fetchImpl?: typeof fetch;
 * }} [options]
 */
export function createProtectedPage({
  navItems = [],
  win = window,
  fetchImpl = fetch,
} = {}) {
  const mergedNavItems = [...defaultNavItems];

  for (const navItem of navItems) {
    if (mergedNavItems.some((item) => item.path === navItem.path)) continue;
    mergedNavItems.push(navItem);
  }

  /** @param {string} path */
  function apiURL(path) {
    return buildAuthenticatedAPIURL(path, win.location);
  }

  /** @param {string} path */
  function buildPageLink(path) {
    return buildAuthenticatedPageLink(path, win.location);
  }

  /** @returns {PageShellNavLink[]} */
  function navLinks() {
    return mergedNavItems.map(({ path, ...link }) => ({
      ...link,
      href: buildPageLink(path),
    }));
  }

  /**
   * @param {string} path
   * @param {RequestInit} [init]
   */
  function fetchWithAuth(path, init) {
    return fetchImpl(apiURL(path), init);
  }

  /** @param {string} rawKey */
  function setCurrentAPIKey(rawKey) {
    updateCurrentAPIKey(rawKey, win);
    return navLinks();
  }

  return {
    apiURL,
    buildPageLink,
    currentAPIKey: () => readCurrentAPIKey(win.location.search),
    fetch: fetchWithAuth,
    navLinks,
    setCurrentAPIKey,
  };
}
