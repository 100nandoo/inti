import {
  apiURL as buildAuthenticatedAPIURL,
  buildPageLink as buildAuthenticatedPageLink,
  currentAPIKey as readCurrentAPIKey,
  setCurrentAPIKey as updateCurrentAPIKey,
} from './page-auth.js';

/** @typedef {import('./page-shell-contracts').PageShellNavItem} PageShellNavItem */
/** @typedef {import('./page-shell-contracts').PageShellNavLink} PageShellNavLink */

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
    return navItems.map(({ path, ...link }) => ({
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
