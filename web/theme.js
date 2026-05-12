(() => {
  const THEME_STORAGE_KEY = 'inti-theme';
  const THEMES = ['light', 'dark', 'minimal', 'minimal-dark'];
  const THEME_LABELS = {
    light: 'Light',
    dark: 'Dark',
    minimal: 'Minimal',
    'minimal-dark': 'Minimal Dark',
  };
  const root = document.documentElement;

  function isKnownTheme(theme) {
    return THEMES.includes(theme);
  }

  function nextTheme(theme) {
    const currentIndex = THEMES.indexOf(theme);
    if (currentIndex === -1) return THEMES[0];
    return THEMES[(currentIndex + 1) % THEMES.length];
  }

  function readStoredTheme() {
    try {
      const theme = localStorage.getItem(THEME_STORAGE_KEY);
      return isKnownTheme(theme) ? theme : '';
    } catch {
      return '';
    }
  }

  function getActiveTheme() {
    const explicitTheme = root.dataset.theme;
    if (isKnownTheme(explicitTheme)) return explicitTheme;
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

  async function persistServerTheme(theme) {
    try {
      const res = await fetch(apiPath('/api/theme-config'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme,
          summaryDownloadFormat: window.IntiTheme.summaryDownloadFormat || 'md',
          ocrPromotionBehavior: window.IntiTheme.ocrPromotionBehavior || 'append',
          summaryPromotionBehavior: window.IntiTheme.summaryPromotionBehavior || 'append',
        }),
      });
      if (!res.ok) return false;

      window.IntiTheme.serverTheme = theme;
      document.dispatchEvent(new CustomEvent('inti:theme-config', {
        detail: {
          theme,
          summaryDownloadFormat: window.IntiTheme.summaryDownloadFormat || '',
          ocrPromotionBehavior: window.IntiTheme.ocrPromotionBehavior || 'append',
          summaryPromotionBehavior: window.IntiTheme.summaryPromotionBehavior || 'append',
        },
      }));
      return true;
    } catch {
      return false;
    }
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
    select.value = isKnownTheme(theme) ? theme : '';
  }

  function updateToggle(theme = getActiveTheme()) {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    const labelNode = document.getElementById('theme-toggle-label');
    const upcomingTheme = nextTheme(theme);
    const label = THEME_LABELS[upcomingTheme] || 'Theme';

    toggle.dataset.upcomingTheme = upcomingTheme;
    if (labelNode) labelNode.textContent = label;
    toggle.setAttribute('aria-label', `Switch to ${label.toLowerCase()} theme`);
    toggle.title = `Switch to ${label.toLowerCase()} theme`;
  }

  function initToggle() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    updateToggle();
    toggle.addEventListener('click', () => {
      const upcomingTheme = nextTheme(getActiveTheme());
      applyTheme(upcomingTheme);
      persistTheme(upcomingTheme);
      persistServerTheme(upcomingTheme);
    });
  }

  async function loadServerTheme() {
    try {
      const res = await fetch(apiPath('/api/theme-config'));
      if (!res.ok) return;
      const config = await res.json();
      if (isKnownTheme(config.theme)) {
        applyTheme(config.theme);
        persistTheme(config.theme);
      }
      window.IntiTheme.serverTheme = config.theme || '';
      window.IntiTheme.summaryDownloadFormat = config.summaryDownloadFormat || '';
      window.IntiTheme.ocrPromotionBehavior = config.ocrPromotionBehavior || 'append';
      window.IntiTheme.summaryPromotionBehavior = config.summaryPromotionBehavior || 'append';
      document.dispatchEvent(new CustomEvent('inti:theme-config', {
        detail: {
          theme: window.IntiTheme.serverTheme,
          summaryDownloadFormat: window.IntiTheme.summaryDownloadFormat,
          ocrPromotionBehavior: window.IntiTheme.ocrPromotionBehavior,
          summaryPromotionBehavior: window.IntiTheme.summaryPromotionBehavior,
        },
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
    persistServer: persistServerTheme,
    active: getActiveTheme,
    serverTheme: '',
    summaryDownloadFormat: '',
    ocrPromotionBehavior: 'append',
    summaryPromotionBehavior: 'append',
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initToggle, { once: true });
  } else {
    initToggle();
  }
  loadServerTheme();
})();
