(() => {
  const THEME_STORAGE_KEY = 'inti-theme';
  const DEFAULT_THEME = 'dark';
  const root = document.documentElement;

  function readStoredTheme() {
    try {
      const theme = localStorage.getItem(THEME_STORAGE_KEY);
      return theme === 'light' || theme === 'dark' ? theme : '';
    } catch {
      return '';
    }
  }

  function applyTheme(theme) {
    const nextThemeValue = theme === 'light' || theme === 'dark' ? theme : DEFAULT_THEME;
    root.dataset.theme = nextThemeValue;
    root.style.colorScheme = nextThemeValue;
  }

  applyTheme(readStoredTheme() || DEFAULT_THEME);
})();
