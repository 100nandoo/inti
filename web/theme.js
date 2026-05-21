(() => {
  const THEME_STORAGE_KEY = 'inti-theme';
  const DEFAULT_THEME = 'dark';
  const THEMES = ['light', 'dark'];
  const THEME_LABELS = {
    light: 'Light',
    dark: 'Dark',
  };
  const root = document.documentElement;
  const SELECT_ENHANCED_ATTR = 'data-inti-dropdown-enhanced';
  const SELECT_DROPDOWN_ATTR = 'data-inti-dropdown';

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
    select.__intiDropdownSync?.();
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

  function createDropdownOption(option, select, closeMenu) {
    const item = document.createElement('li');
    const button = document.createElement('button');

    button.type = 'button';
    button.className = option.value === select.value ? 'menu-active' : '';
    button.disabled = option.disabled;
    button.dataset.value = option.value;
    button.textContent = option.textContent || option.label || option.value;

    button.addEventListener('click', () => {
      if (option.disabled) return;
      if (select.value !== option.value) {
        select.value = option.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        select.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }

      select.__intiDropdownSync?.();
      closeMenu();
    });

    item.append(button);
    return item;
  }

  function enhanceSelect(select) {
    if (!(select instanceof HTMLSelectElement)) return;
    if (select.multiple || select.hasAttribute(SELECT_ENHANCED_ATTR)) return;
    if (!select.hasAttribute(SELECT_DROPDOWN_ATTR)) return;

    select.setAttribute(SELECT_ENHANCED_ATTR, 'true');
    Object.assign(select.style, {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: '0',
    });
    select.tabIndex = -1;

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'btn justify-between w-full';
    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.innerHTML = '<span class="truncate"></span><svg class="size-4 opacity-70" aria-hidden="true" viewBox="0 0 20 20" fill="none"><path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    const menu = document.createElement('ul');
    menu.className = 'dropdown-content menu bg-base-100 rounded-box z-1 w-full p-2 shadow-sm';
    menu.hidden = true;
    menu.setAttribute('role', 'menu');
    menu.tabIndex = 0;

    const dropdown = document.createElement('div');
    dropdown.className = 'dropdown dropdown-bottom w-full';
    dropdown.append(trigger, menu);

    select.insertAdjacentElement('afterend', dropdown);

    const labelNode = trigger.querySelector('span');
    const getButtons = () => [...menu.querySelectorAll('button:not(:disabled)')];

    function closeMenu() {
      dropdown.classList.remove('dropdown-open');
      menu.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
    }

    function openMenu() {
      if (trigger.disabled) return;
      dropdown.classList.add('dropdown-open');
      menu.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
    }

    function toggleMenu() {
      if (menu.hidden) {
        openMenu();
        return;
      }
      closeMenu();
    }

    function focusMenuButton(index) {
      const buttons = getButtons();
      const button = buttons[index];
      button?.focus();
    }

    function focusSelectedButton() {
      const selectedIndex = getButtons().findIndex((button) => button.dataset.value === select.value);
      focusMenuButton(selectedIndex >= 0 ? selectedIndex : 0);
    }

    function sync() {
      const selectedOption =
        select.options[select.selectedIndex] ||
        select.querySelector('option:checked') ||
        select.querySelector('option:not([disabled])');

      if (labelNode) {
        labelNode.textContent = selectedOption?.textContent || selectedOption?.label || 'Select';
      }

      trigger.disabled = select.disabled;
      trigger.setAttribute('aria-label', select.title || labelNode?.textContent || 'Select');
      if (select.disabled) closeMenu();
      menu.innerHTML = '';

      Array.from(select.options).forEach((option) => {
        menu.append(createDropdownOption(option, select, closeMenu));
      });
    }

    select.__intiDropdownSync = sync;
    sync();

    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleMenu();
    });

    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeMenu();
        return;
      }

      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
        event.preventDefault();
        openMenu();
        focusSelectedButton();
      }
    });

    menu.addEventListener('keydown', (event) => {
      const buttons = getButtons();
      const currentIndex = buttons.indexOf(document.activeElement);

      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
        trigger.focus();
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        focusMenuButton(Math.min(currentIndex + 1, buttons.length - 1));
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        focusMenuButton(Math.max(currentIndex - 1, 0));
      }
    });

    document.addEventListener('click', (event) => {
      if (!dropdown.contains(event.target)) {
        closeMenu();
      }
    });

    select.addEventListener('change', sync);
    select.addEventListener('input', sync);

    const observer = new MutationObserver(sync);
    observer.observe(select, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['disabled', 'label', 'value', 'selected'],
    });
  }

  function initDropdownSelects() {
    document
      .querySelectorAll(`select[${SELECT_DROPDOWN_ATTR}]`)
      .forEach((select) => enhanceSelect(select));
  }

  function initToggle() {
    const toggle = document.getElementById('theme-toggle');
    initDropdownSelects();
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
