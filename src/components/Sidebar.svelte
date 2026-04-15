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

  const dispatch = createEventDispatcher();
</script>

<aside class="sidebar">
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
  }
</style>
