const THEME_STORAGE_KEY = 'inti-theme';
const DEFAULT_THEME = 'dark';
const THEMES = ['light', 'dark'];
const THEME_LABELS = {
  light: 'Light',
  dark: 'Dark',
};
const SELECT_ENHANCED_ATTR = 'data-inti-dropdown-enhanced';
const SELECT_DROPDOWN_ATTR = 'data-inti-dropdown';

function isKnownTheme(theme) {
  return THEMES.includes(theme);
}

function normalizeTheme(theme) {
  return isKnownTheme(theme) ? theme : DEFAULT_THEME;
}

function nextTheme(theme) {
  return theme === 'light' ? 'dark' : 'light';
}

function readStoredTheme(win) {
  try {
    const theme = win.localStorage.getItem(THEME_STORAGE_KEY);
    return isKnownTheme(theme) ? theme : '';
  } catch {
    return '';
  }
}

function createDropdownOption(option, select, closeMenu, doc) {
  const EventCtor = doc.defaultView.Event;
  const item = doc.createElement('li');
  const button = doc.createElement('button');

  button.type = 'button';
  button.className = option.value === select.value ? 'menu-active' : '';
  button.disabled = option.disabled;
  button.dataset.value = option.value;
  button.textContent = option.textContent || option.label || option.value;

  button.addEventListener('click', () => {
    if (option.disabled) return;

    if (select.value !== option.value) {
      select.value = option.value;
      select.dispatchEvent(new EventCtor('change', { bubbles: true }));
      select.dispatchEvent(new EventCtor('input', { bubbles: true }));
    } else {
      select.dispatchEvent(new EventCtor('change', { bubbles: true }));
    }

    select.__intiDropdownSync?.();
    closeMenu();
  });

  item.append(button);
  return item;
}

function enhanceSelect(select, doc) {
  const MutationObserverCtor = doc.defaultView.MutationObserver;
  if (!(select instanceof doc.defaultView.HTMLSelectElement)) return;
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

  const trigger = doc.createElement('button');
  trigger.type = 'button';
  trigger.className = 'btn justify-between w-full';
  trigger.setAttribute('aria-haspopup', 'menu');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.innerHTML = '<span class="truncate"></span><svg class="size-4 opacity-70" aria-hidden="true" viewBox="0 0 20 20" fill="none"><path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const menu = doc.createElement('ul');
  menu.className = 'dropdown-content menu bg-base-100 rounded-box z-1 w-full p-2 shadow-sm';
  menu.hidden = true;
  menu.setAttribute('role', 'menu');
  menu.tabIndex = 0;

  const dropdown = doc.createElement('div');
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
    buttons[index]?.focus();
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
      menu.append(createDropdownOption(option, select, closeMenu, doc));
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
    const currentIndex = buttons.indexOf(doc.activeElement);

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

  doc.addEventListener('click', (event) => {
    if (!dropdown.contains(event.target)) {
      closeMenu();
    }
  });

  select.addEventListener('change', sync);
  select.addEventListener('input', sync);

  const observer = new MutationObserverCtor(sync);
  observer.observe(select, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['disabled', 'label', 'value', 'selected'],
  });
}

function initDropdownSelects(doc) {
  doc.querySelectorAll(`select[${SELECT_DROPDOWN_ATTR}]`).forEach((select) => enhanceSelect(select, doc));
}

/**
 * @param {{
 *   apiURL: (path: string) => string;
 *   win?: Window & typeof globalThis;
 *   doc?: Document;
 *   fetchImpl?: typeof fetch;
 *   loadServerThemeOnInit?: boolean;
 * }} options
 */
export function initializeAppRuntime({
  apiURL,
  win = window,
  doc = document,
  fetchImpl = fetch,
  loadServerThemeOnInit = true,
}) {
  /** @type {typeof window.IntiTheme} */
  let runtime = win.IntiTheme;

  if (!runtime) {
    const CustomEventCtor = doc.defaultView.CustomEvent;
    const root = doc.documentElement;

    function getActiveTheme() {
      const explicitTheme = root.dataset.theme;
      return isKnownTheme(explicitTheme) ? explicitTheme : DEFAULT_THEME;
    }

    function updateThemeSelect(theme = getActiveTheme()) {
      const select = doc.getElementById('appearance-theme-select');
      if (!select) return;
      select.value = normalizeTheme(theme);
      select.__intiDropdownSync?.();
    }

    function updateToggle(theme = getActiveTheme()) {
      const toggle = doc.getElementById('theme-toggle');
      if (!toggle) return;

      const labelNode = doc.getElementById('theme-toggle-label');
      const upcomingTheme = nextTheme(theme);
      const label = THEME_LABELS[upcomingTheme] || 'Theme';

      toggle.dataset.upcomingTheme = upcomingTheme;
      if (labelNode) labelNode.textContent = label;
      toggle.setAttribute('aria-label', `Switch to ${label.toLowerCase()} theme`);
      toggle.title = `Switch to ${label.toLowerCase()} theme`;
    }

    function applyTheme(theme) {
      const nextThemeValue = normalizeTheme(theme);
      root.dataset.theme = nextThemeValue;
      root.style.colorScheme = nextThemeValue;
      updateToggle(nextThemeValue);
      updateThemeSelect(nextThemeValue);
    }

    function persistTheme(theme) {
      try {
        win.localStorage.setItem(THEME_STORAGE_KEY, normalizeTheme(theme));
      } catch {}
    }

    function dispatchAppearanceConfig() {
      doc.dispatchEvent(new CustomEventCtor('inti:theme-config', {
        detail: {
          theme: runtime.serverTheme,
          summaryDownloadFormat: runtime.summaryDownloadFormat,
          ocrPromotionBehavior: runtime.ocrPromotionBehavior,
          summaryPromotionBehavior: runtime.summaryPromotionBehavior,
        },
      }));
    }

    function syncAppearanceConfig(appearanceConfig = {}) {
      const nextThemeValue = normalizeTheme(appearanceConfig.theme);
      runtime.serverTheme = nextThemeValue;
      runtime.summaryDownloadFormat = appearanceConfig.summaryDownloadFormat === 'txt' ? 'txt' : 'md';
      runtime.ocrPromotionBehavior = 'replace';
      runtime.summaryPromotionBehavior = 'replace';
      applyTheme(nextThemeValue);
      persistTheme(nextThemeValue);
      dispatchAppearanceConfig();
    }

    async function persistServerTheme(theme = getActiveTheme()) {
      const response = await fetchImpl(apiURL('/api/theme-config'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: normalizeTheme(theme),
          summaryDownloadFormat: runtime.summaryDownloadFormat || 'md',
          ocrPromotionBehavior: 'replace',
          summaryPromotionBehavior: 'replace',
        }),
      }).catch(() => null);

      if (!response?.ok) return false;

      const appearanceConfig = await response.json().catch(() => ({
        theme,
        summaryDownloadFormat: runtime.summaryDownloadFormat || 'md',
      }));
      syncAppearanceConfig(appearanceConfig);
      return true;
    }

    async function loadServerTheme() {
      const response = await fetchImpl(apiURL('/api/theme-config')).catch(() => null);
      if (!response?.ok) return false;

      const appearanceConfig = await response.json().catch(() => ({}));
      syncAppearanceConfig(appearanceConfig);
      return true;
    }

    function bindThemeToggle() {
      const toggle = doc.getElementById('theme-toggle');
      if (!toggle || toggle.dataset.intiThemeBound === 'true') return;

      toggle.dataset.intiThemeBound = 'true';
      updateToggle();
      toggle.addEventListener('click', () => {
        const upcomingTheme = nextTheme(getActiveTheme());
        applyTheme(upcomingTheme);
        persistTheme(upcomingTheme);
        void persistServerTheme(upcomingTheme);
      });
    }

    runtime = {
      apply: applyTheme,
      persist: persistTheme,
      preview(theme) {
        applyTheme(theme);
        persistTheme(theme);
      },
      persistServer: persistServerTheme,
      active: getActiveTheme,
      syncAppearanceConfig,
      loadServerTheme,
      serverTheme: '',
      summaryDownloadFormat: 'md',
      ocrPromotionBehavior: 'replace',
      summaryPromotionBehavior: 'replace',
    };

    win.IntiTheme = runtime;
    applyTheme(readStoredTheme(win) || DEFAULT_THEME);
    initDropdownSelects(doc);
    bindThemeToggle();
  }

  win.apiURL = apiURL;
  if (loadServerThemeOnInit) {
    void runtime.loadServerTheme?.();
  }

  return runtime;
}
