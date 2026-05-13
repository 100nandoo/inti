export function currentAPIKey(search = window.location.search) {
  return new URLSearchParams(search).get('key') || '';
}

export function apiURL(path, context = window.location) {
  const url = new URL(path, context.origin);
  const key = currentAPIKey(context.search);
  if (key) {
    url.searchParams.set('key', key);
  } else {
    url.searchParams.delete('key');
  }
  return url.toString();
}

export function buildPageLink(path, context = window.location) {
  const url = new URL(path, context.origin);
  const key = currentAPIKey(context.search);
  if (key) {
    url.searchParams.set('key', key);
  } else {
    url.searchParams.delete('key');
  }
  return url.pathname + url.search;
}

export function setCurrentAPIKey(rawKey, win = window) {
  const url = new URL(win.location.href);
  if (rawKey) {
    url.searchParams.set('key', rawKey);
  } else {
    url.searchParams.delete('key');
  }
  win.history.replaceState({}, '', url.pathname + url.search);
  return url.search;
}
