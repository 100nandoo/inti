(() => {
  const THEME_STORAGE_KEY = 'inti-theme';
  const DEFAULT_THEME = 'dark';
  const THEMES = ['light', 'dark'];
  const THEME_LABELS = {
    light: 'Light',
    dark: 'Dark',
  };
  const root = document.documentElement;

  function isKnownTheme(theme) {
    return THEMES.includes(theme);
  }

  function nextTheme(theme) {
    return theme === 'light' ? 'dark' : 'light';
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
    return DEFAULT_THEME;
  }

  function applyTheme(theme) {
    const nextThemeValue = isKnownTheme(theme) ? theme : DEFAULT_THEME;
    root.dataset.theme = nextThemeValue;
    root.style.colorScheme = nextThemeValue;
    updateToggle(nextThemeValue);
    updateThemeSelect(nextThemeValue);
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
          ocrPromotionBehavior: 'replace',
          summaryPromotionBehavior: 'replace',
        }),
      });
      if (!res.ok) return false;

      window.IntiTheme.serverTheme = theme;
      document.dispatchEvent(new CustomEvent('inti:theme-config', {
        detail: {
          theme,
          summaryDownloadFormat: window.IntiTheme.summaryDownloadFormat || '',
          ocrPromotionBehavior: 'replace',
          summaryPromotionBehavior: 'replace',
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
    if (!select) return;
    select.value = isKnownTheme(theme) ? theme : DEFAULT_THEME;
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
      const serverTheme = isKnownTheme(config.theme) ? config.theme : DEFAULT_THEME;
      applyTheme(serverTheme);
      persistTheme(serverTheme);
      window.IntiTheme.serverTheme = serverTheme;
      window.IntiTheme.summaryDownloadFormat = config.summaryDownloadFormat || '';
      window.IntiTheme.ocrPromotionBehavior = 'replace';
      window.IntiTheme.summaryPromotionBehavior = 'replace';
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
  applyTheme(storedTheme || DEFAULT_THEME);

  window.IntiTheme = {
    apply: applyTheme,
    persist: persistTheme,
    persistServer: persistServerTheme,
    active: getActiveTheme,
    serverTheme: '',
    summaryDownloadFormat: '',
    ocrPromotionBehavior: 'replace',
    summaryPromotionBehavior: 'replace',
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initToggle, { once: true });
  } else {
    initToggle();
  }
  loadServerTheme();
})();
