<script>
  import { createEventDispatcher } from 'svelte';
  import AcervoFilter from './AcervoFilter.svelte';
  import AutocompleteSelect from './AutocompleteSelect.svelte';

  export let acervos = [];
  export let activeAcervos = new Set();
  export let allSchools = [];
  export let selectedSchool = null;
  export let allNationalities = [];
  export let selectedNationality = null;
  export let isOpen = false;
  export let onClose = null;

  const dispatch = createEventDispatcher();

  function handleClose() {
    if (onClose) onClose();
  }
</script>

<aside class="sidebar" class:sidebar--open={isOpen}>
  <div class="sidebar__header">
    <button class="sidebar__close" on:click={handleClose} aria-label="Fechar menu">
      ×
    </button>
  </div>

  <div class="sidebar__content">
    <AutocompleteSelect
      label="Escola"
      options={allSchools}
      value={selectedSchool}
      on:select={e => dispatch('schoolselect', e.detail)}
    />

    <AutocompleteSelect
      label="Nacionalidade"
      options={allNationalities}
      value={selectedNationality}
      on:select={e => dispatch('nationalityselect', e.detail)}
    />

    <AcervoFilter
      {acervos}
      {activeAcervos}
      on:change={e => dispatch('acervochange', e.detail)}
    />
  </div>
</aside>

<style lang="scss">
  .sidebar {
    width: 220px;
    flex-shrink: 0;
    border-right: 1px solid var(--bg-hl);
    background: var(--bg);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--bg-hl) transparent;

    /* ─── Mobile drawer styling ────────────────────────────────────────── */
    /* Em <1024px, torna-se um drawer overlay fixo */
    @media (max-width: 1023px) {
      position: fixed;
      inset: var(--menu-height) 0 0 0;
      width: 280px;
      z-index: 100;
      transform: translateX(-100%);
      transition: transform 200ms ease-out;
      border-right: 1px solid var(--bg-hl);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    &.sidebar--open {
      @media (max-width: 1023px) {
        transform: translateX(0);
      }
    }
  }

  .sidebar__header {
    display: none;
    position: sticky;
    top: 0;
    background: var(--bg);
    border-bottom: 1px solid var(--bg-hl);
    z-index: 10;
    padding: 0.5rem;

    @media (max-width: 1023px) {
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

    &:hover {
      opacity: 0.7;
    }
  }

  .sidebar__content {
    display: flex;
    flex-direction: column;
    flex: 1;
  }
</style>
