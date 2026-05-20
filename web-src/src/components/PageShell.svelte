<script lang="ts">
  import type { PageShellNavLink } from '../lib/page-shell-contracts';

  export let navLinks: PageShellNavLink[] = [];
</script>

<div class="app inti-shell">
  <header class="header navbar inti-shell-header">
    <div class="logo">
      <div class="logo-icon" aria-hidden="true">
        <img class="logo-icon-dark" src="/icons/inti-logo.svg" alt="" />
        <img class="logo-icon-light" src="/icons/inti-light.svg" alt="" />
      </div>
      <span class="logo-name">Inti</span>
    </div>
    <div class="header-nav">
      {#each navLinks as link}
        <a href={link.href} class="header-settings-link inti-nav-link" title={link.title}>
          <span class={`icon ${link.iconClass}`} aria-hidden="true"></span>
          {link.label}
        </a>
      {/each}
      <button id="theme-toggle" class="theme-toggle inti-theme-toggle" type="button" title="Switch theme" aria-label="Switch theme">
        <span class="theme-icon theme-icon-light icon icon-sun" aria-hidden="true"></span>
        <span class="theme-icon theme-icon-dark icon icon-moon" aria-hidden="true"></span>
        <span id="theme-toggle-label">Theme</span>
      </button>
    </div>
  </header>

  <main class="inti-shell-main">
    <slot />
  </main>
</div>
