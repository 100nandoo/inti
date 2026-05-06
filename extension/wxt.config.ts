import { defineConfig } from 'wxt';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const icons = {
  16: 'icon16.png',
  48: 'icon48.png',
  128: 'icon128.png',
};

export default defineConfig({
  srcDir: 'src',
  entrypointsDir: 'entrypoints',
  publicDir: 'icons',
  outDir: 'dist',
  outDirTemplate: '{{browser}}-mv{{manifestVersion}}',
  hooks: {
    'build:manifestGenerated': (wxt, manifest) => {
      if (wxt.config.browser !== 'firefox') {
        return;
      }
    },
  },
  vite: () => ({
    optimizeDeps: {
      exclude: ['virtual:wxt-plugins', 'virtual:wxt-html-plugins'],
    },
    plugins: [
      svelte(),
      {
        name: 'inti:wxt-plugin-loader-shim',
        enforce: 'pre',
        resolveId(id) {
          if (id === 'virtual:wxt-plugins' || id === 'virtual:wxt-html-plugins') {
            return `\0${id}`;
          }
          return null;
        },
        load(id) {
          if (id === '\0virtual:wxt-plugins') {
            return 'export function initPlugins() {}';
          }
          if (id === '\0virtual:wxt-html-plugins') {
            return 'export {}';
          }
          return null;
        },
      },
      {
        name: 'inti:disable-problematic-wxt-plugins',
        configResolved(config) {
          config.plugins = config.plugins.filter(
            (plugin) => !['wxt:download', 'wxt:plugin-loader'].includes(plugin.name),
          );
        },
      },
    ],
    server: {
      host: '127.0.0.1',
    },
    preview: {
      host: '127.0.0.1',
    },
  }),
  manifest: ({ browser }) => ({
    name: 'Inti',
    version: '1.0.0',
    description: 'Summarize any article with AI',
    icons,
    permissions: [
      'activeTab',
      'scripting',
      'storage',
      'contextMenus',
      ...(browser === 'chrome' ? ['sidePanel'] : []),
    ],
    host_permissions: ['<all_urls>'],
    action: {
      default_title: 'Inti — Summarize this page',
      default_icon: icons,
    },
    commands: browser === 'firefox'
      ? {
          _execute_action: {
            suggested_key: {
              default: 'Alt+Shift+S',
              mac: 'Command+Shift+S',
            },
          },
          _execute_sidebar_action: {
            suggested_key: {
              default: 'Ctrl+Shift+Y',
              mac: 'Command+Shift+Y',
            },
            description: 'Toggle the Inti sidebar',
          },
        }
      : {
          _execute_action: {
            suggested_key: {
              default: 'Alt+Shift+S',
              mac: 'Command+Shift+S',
            },
          },
        },
    browser_specific_settings: browser === 'firefox'
      ? {
          gecko: {
            id: '{7a9be4df-7dda-4820-a84e-7dfaae456204}',
            data_collection_permissions: {
              required: ['websiteContent'],
            },
            strict_min_version: '140.0',
          },
          gecko_android: {
            strict_min_version: '142.0',
          },
        }
      : undefined,
    sidebar_action: browser === 'firefox'
      ? {
          default_panel: 'sidebar.html',
          default_title: 'Inti',
        }
      : undefined,
    side_panel: browser === 'chrome'
      ? {
          default_path: 'sidepanel.html',
        }
      : undefined,
  }),
});
