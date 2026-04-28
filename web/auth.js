function currentAPIKey() {
  return new URLSearchParams(window.location.search).get('key') || '';
}

function apiURL(path) {
  const url = new URL(path, window.location.origin);
  const key = currentAPIKey();
  if (key) url.searchParams.set('key', key);
  return url.toString();
}

function preserveKeyLinks() {
  const key = currentAPIKey();
  document.querySelectorAll('a.header-settings-link').forEach((link) => {
    const url = new URL(link.getAttribute('href'), window.location.origin);
    if (key) {
      url.searchParams.set('key', key);
    } else {
      url.searchParams.delete('key');
    }
    link.href = url.pathname + url.search;
  });
}

function setCurrentAPIKey(key) {
  const url = new URL(window.location.href);
  if (key) {
    url.searchParams.set('key', key);
  } else {
    url.searchParams.delete('key');
  }
  window.history.replaceState({}, '', url.pathname + url.search);
  preserveKeyLinks();
}
