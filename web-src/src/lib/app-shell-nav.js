/** @typedef {import('./page-shell-contracts').PageShellNavItem} PageShellNavItem */
/** @typedef {import('./page-shell-contracts').PageShellNavLink} PageShellNavLink */

/** @type {PageShellNavItem[]} */
export const defaultAppShellNavItems = [
  {
    path: '/api-keys.html',
    label: 'API Keys',
    title: 'Manage API keys',
    iconClass: 'icon-key',
  },
  {
    path: '/settings.html',
    label: 'Settings',
    title: 'Summarizer settings',
    iconClass: 'icon-settings',
  },
];

/**
 * @param {{
 *   navItems?: PageShellNavItem[];
 *   buildPageLink?: (path: string) => string;
 * }} [options]
 * @returns {PageShellNavLink[]}
 */
export function buildAppShellNavLinks({
  navItems = defaultAppShellNavItems,
  buildPageLink = (path) => path,
} = {}) {
  return navItems.map(({ path, ...link }) => ({
    ...link,
    href: buildPageLink(path),
  }));
}
