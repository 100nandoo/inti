(() => {
  const THEME_STORAGE_KEY = 'inti-theme';
  const root = document.documentElement;

  function readStoredTheme() {
    try {
      const theme = localStorage.getItem(THEME_STORAGE_KEY);
      return theme === 'light' || theme === 'dark' ? theme : '';
    } catch {
      return '';
    }
  }

  function getActiveTheme() {
    const explicitTheme = root.dataset.theme;
    if (explicitTheme === 'light' || explicitTheme === 'dark') return explicitTheme;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    root.dataset.theme = theme;
    updateToggle(theme);
    updateThemeSelect(theme);
  }

  function persistTheme(theme) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {}
  }

  function apiPath(path) {
    if (typeof apiURL === 'function') return apiURL(path);
    const url = new URL(path, window.location.origin);
    const key = new URLSearchParams(window.location.search).get('key') || '';
    if (key) url.searchParams.set('key', key);
    return url.toString();
  }

  function updateThemeSelect(theme = getActiveTheme()) {
    const select = document.getElementById('appearance-theme-select');
    if (!select || select.value === '') return;
    select.value = theme === 'dark' ? 'dark' : 'light';
  }

  function updateToggle(theme = getActiveTheme()) {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    const labelNode = document.getElementById('theme-toggle-label');
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    const label = nextTheme === 'dark' ? 'Dark' : 'Light';

    if (labelNode) labelNode.textContent = label;
    toggle.setAttribute('aria-label', `Switch to ${label.toLowerCase()} theme`);
    toggle.title = `Switch to ${label.toLowerCase()} theme`;
  }

  function initToggle() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    updateToggle();
    toggle.addEventListener('click', () => {
      const nextTheme = getActiveTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
      persistTheme(nextTheme);
    });
  }

  async function loadServerTheme() {
    try {
      const res = await fetch(apiPath('/api/theme-config'));
      if (!res.ok) return;
      const config = await res.json();
      if (config.theme === 'light' || config.theme === 'dark') {
        applyTheme(config.theme);
        persistTheme(config.theme);
      }
      window.IntiTheme.serverTheme = config.theme || '';
      document.dispatchEvent(new CustomEvent('inti:theme-config', {
        detail: { theme: window.IntiTheme.serverTheme },
      }));
    } catch {}
  }

  const storedTheme = readStoredTheme();
  if (storedTheme) {
    root.dataset.theme = storedTheme;
  }

  window.IntiTheme = {
    apply: applyTheme,
    persist: persistTheme,
    active: getActiveTheme,
    serverTheme: '',
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initToggle, { once: true });
  } else {
    initToggle();
  }
  loadServerTheme();
})();
