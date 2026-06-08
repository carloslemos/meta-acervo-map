<script>
  import { createEventDispatcher } from 'svelte';
  import SidebarFilters from './SidebarFilters.svelte';

  export let acervos = [];
  export let activeAcervos = new Set();
  export let allGenders = [];
  export let activeGenders = new Set();
  export let allCreators = [];
  export let selectedCreators = new Set();
  export let allSchools = [];
  export let selectedSchools = new Set();
  export let allNationalities = [];
  export let selectedNationalities = new Set();
  export let isOpen = false;
  export let onClose = null;
  export let onToggle = null;

  const dispatch = createEventDispatcher();

  /** Aciona o callback de fechamento da sidebar (mobile). */
  function handleClose() {
    if (onClose) onClose();
  }
</script>

<aside class="sidebar" class:sidebar--open={isOpen}>

  <div class="sidebar__inner">

  <!-- Marca: logo + título + SOBRE + PT|EN (desktop) -->
  <div class="sidebar__brand">
    <img
      class="sidebar__logo"
      src="{import.meta.env.BASE_URL}logo_acervos-digitais_pt.svg"
      alt="Atlas dos Acervos Digitais"
    />
    <div class="sidebar__brand-text">
      <span class="sidebar__brand-title">Atlas Geopolítico</span>
      <span class="sidebar__brand-subtitle">dos Acervos Digitais</span>
    </div>
    <div class="sidebar__brand-actions">
      <button class="sidebar__action-btn">Sobre</button>
      <div class="sidebar__lang">
        <button class="sidebar__lang-btn sidebar__lang-btn--active">PT</button>
        <button class="sidebar__lang-btn">EN</button>
      </div>
    </div>
  </div>

  <!-- Cabeçalho mobile: botão fechar (×) -->
  <div class="sidebar__header">
    <button class="sidebar__close" on:click={handleClose} aria-label="Fechar menu">
      ×
    </button>
  </div>

  <!-- Intro desktop: descrição + ⓘ -->
  <div class="sidebar__intro">
    <p class="sidebar__description">
      Explore os filtros e navegue pelas trajetórias de artistas dos acervos
    </p>
    <button class="sidebar__info-btn" aria-label="Sobre os filtros">ⓘ</button>
  </div>

  <div class="sidebar__content">
    <SidebarFilters
      {acervos}
      {activeAcervos}
      {allGenders}
      {activeGenders}
      {allCreators}
      {selectedCreators}
      {allSchools}
      {selectedSchools}
      {allNationalities}
      {selectedNationalities}
      on:acervochange={e => dispatch('acervochange', e.detail)}
      on:genderchange={e => dispatch('genderchange', e.detail)}
      on:creatorschange={e => dispatch('creatorschange', e.detail)}
      on:schoolschange={e => dispatch('schoolschange', e.detail)}
      on:nationalitieschange={e => dispatch('nationalitieschange', e.detail)}
    />
  </div>

  </div>

  <!-- Botão colapso/expansão: absoluto, fora do inner, segue borda direita da sidebar -->
  <button
    class="sidebar__collapse-btn"
    on:click={() => onToggle && onToggle()}
    aria-label={isOpen ? 'Recolher painel' : 'Abrir painel'}
  >{isOpen ? '«' : '›'}</button>

</aside>

<style lang="scss">
  .sidebar {
    width: var(--sidebar-width, 365px);
    flex-shrink: 0;
    border-right: 1px solid var(--bg-hl);
    background: linear-gradient(180deg, #121212 13.94%, #686868 100%);
    display: flex;
    flex-direction: column;
    position: relative;

    /* ─── Tablet + Desktop: colapso via width (≥ 760px) ──────────────── */
    @media (min-width: 760px) {
      transition: width 200ms ease-out, border-color 200ms;
      overflow: visible; /* permite que collapse-btn fique fora */

      &:not(.sidebar--open) {
        width: 0;
        border-right-color: transparent;
      }
    }

    /* ─── Sidebar como drawer no mobile (< 760px) ────────────────────── */
    @media (max-width: 759px) {
      position: fixed;
      inset: 0;
      width: 280px;
      z-index: 100;
      transform: translateX(-100%);
      transition: transform 200ms ease-out;
      border-right: 1px solid var(--bg-hl);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

      &.sidebar--open {
        transform: translateX(0);
      }
    }
  }

  /* Inner: clipa o conteúdo durante o colapso */
  .sidebar__inner {
    flex: 1;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  /* ─── Marca no topo da sidebar ─────────────────────────────────────── */
  .sidebar__brand {
    display: flex;
    align-items: center;
    gap: 12px;
    height: var(--menu-height);
    padding: 0 0 0 16px;
    border-bottom: 1px solid var(--bg-hl);
    flex-shrink: 0;
  }

  .sidebar__logo {
    height: 44px;
    width: auto;
    display: block;
    flex-shrink: 0;
  }

  .sidebar__brand-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  .sidebar__brand-title,
  .sidebar__brand-subtitle {
    font-size: 0.9375rem;
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: -0.01em;
    color: #D2D2D2;
    white-space: nowrap;
  }

  .sidebar__brand-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    flex-shrink: 0;
    margin-right: 36px; /* espaço para o collapse-btn absoluto (28px) + gap */
  }

  .sidebar__action-btn {
    all: unset;
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1.4;
    letter-spacing: -0.01em;
    color: #BBBBBB;
    cursor: pointer;
    white-space: nowrap;

    &:hover { color: var(--txt); }
  }

  .sidebar__lang {
    display: flex;
    gap: 6px;
  }

  .sidebar__lang-btn {
    all: unset;
    font-size: 0.875rem;
    font-weight: 500;
    letter-spacing: -0.01em;
    color: var(--txt-hl);
    cursor: pointer;

    &:hover { color: var(--txt); }
  }

  .sidebar__lang-btn--active {
    color: var(--txt);
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  /* ─── Cabeçalho mobile (×) ─────────────────────────────────────────── */
  .sidebar__header {
    display: none;
    position: sticky;
    top: 0;
    background: var(--bg);
    border-bottom: 1px solid var(--bg-hl);
    z-index: 10;
    padding: 0.5rem;

    @media (max-width: 759px) {
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }
  }

  .sidebar__close {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: var(--txt);
    cursor: pointer;
    padding: 0.5rem 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover { opacity: 0.7; }
  }

  /* ─── Intro desktop: descrição + ⓘ | « ─────────────────────────────── */
  .sidebar__intro {
    display: none;
    align-items: center;
    gap: 0;
    border-bottom: 1px solid var(--bg-hl);
    flex-shrink: 0;

    @media (min-width: 760px) {
      display: flex;
    }
  }

  .sidebar__description {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.6875rem;
    font-weight: 400;
    line-height: 1.5;
    letter-spacing: -0.01em;
    color: var(--txt-hl);
    text-transform: uppercase;
    margin: 0;
    flex: 1;
    padding: 0.875rem 0 0.875rem 1rem;
  }

  .sidebar__info-btn {
    all: unset;
    font-size: 0.875rem;
    color: var(--txt-hl);
    cursor: pointer;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    flex-shrink: 0;
    padding: 0.875rem 0.25rem;

    &:hover { color: var(--txt); }
  }

  /* Botão colapso/expansão — absoluto, fora do inner, segue borda da sidebar */
  .sidebar__collapse-btn {
    position: absolute;
    right: -28px;
    top: 0;
    height: var(--menu-height);
    width: 28px;
    background: var(--bg);
    border: 1px solid var(--bg-hl);
    border-radius: 0;
    color: var(--txt-hl);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    z-index: 10;
    flex-shrink: 0;

    @media (max-width: 759px) {
      display: none;
    }

    &:hover {
      color: var(--txt);
      border-color: var(--txt-l);
    }
  }

  /* ─── Conteúdo ──────────────────────────────────────────────────────── */
  .sidebar__content {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--bg-hl) transparent;
  }
</style>
