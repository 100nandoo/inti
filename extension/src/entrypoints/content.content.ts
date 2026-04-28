import { defineContentScript } from 'wxt/sandbox';
import { initContentScript } from '../content/content-script.js';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  main() {
    initContentScript();
  },
});
