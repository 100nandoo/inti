import {
  apiURL as buildAuthenticatedAPIURL,
  buildPageLink as buildAuthenticatedPageLink,
  currentAPIKey as readCurrentAPIKey,
  setCurrentAPIKey as updateCurrentAPIKey,
} from './page-auth.js';

export function createProtectedPage({
  navItems = [],
  win = window,
  fetchImpl = fetch,
} = {}) {
  function apiURL(path) {
    return buildAuthenticatedAPIURL(path, win.location);
  }

  function buildPageLink(path) {
    return buildAuthenticatedPageLink(path, win.location);
  }

  function navLinks() {
    return navItems.map(({ path, ...link }) => ({
      ...link,
      href: buildPageLink(path),
    }));
  }

  function fetchWithAuth(path, init) {
    return fetchImpl(apiURL(path), init);
  }

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
