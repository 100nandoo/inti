import { mount } from 'svelte';
import '../app.css';
import SettingsPage from '../pages/SettingsPage.svelte';

mount(SettingsPage, {
  target: document.getElementById('app'),
});
