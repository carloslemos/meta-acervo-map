<script>
  import { createEventDispatcher } from 'svelte';
  import AcervoFilter from './AcervoFilter.svelte';
  import AutocompleteSelect from './AutocompleteSelect.svelte';
  import GenderFilter from './GenderFilter.svelte';

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

  const dispatch = createEventDispatcher();

  /** Aciona o callback de fechamento da sidebar (mobile). */
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
      label="Artista"
      options={allCreators}
      value={selectedCreators}
      multiple={true}
      on:change={e => dispatch('creatorschange', e.detail)}
    />

    <GenderFilter
      genders={allGenders}
      {activeGenders}
      on:change={e => dispatch('genderchange', e.detail)}
    />

    <AutocompleteSelect
      label="Escola"
      options={allSchools}
      value={selectedSchools}
      multiple={true}
      on:change={e => dispatch('schoolschange', e.detail)}
    />

    <AutocompleteSelect
      label="Nacionalidade"
      options={allNationalities}
      value={selectedNationalities}
      multiple={true}
      on:change={e => dispatch('nationalitieschange', e.detail)}
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

    /* ─── Sidebar como drawer no mobile ──────────────────────────────── */
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
