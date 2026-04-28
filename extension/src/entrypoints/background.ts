import { defineBackground } from 'wxt/sandbox';
import { initBackground } from '../background/service-worker.js';

export default defineBackground(() => {
  initBackground();
});
