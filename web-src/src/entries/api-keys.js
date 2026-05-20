import { mount } from 'svelte';
import '../app.css';
import APIKeysPage from '../pages/APIKeysPage.svelte';

mount(APIKeysPage, {
  target: document.getElementById('app'),
});
