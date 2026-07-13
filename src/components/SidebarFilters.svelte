<script>
  import { createEventDispatcher } from 'svelte';
  import { FILTER_LABELS, AUTOCOMPLETE_PLACEHOLDERS } from '../lib/constants.js';
  import AcervoFilter from './AcervoFilter.svelte';
  import AutocompleteSelect from './AutocompleteSelect.svelte';
  import GenderFilter from './GenderFilter.svelte';

  /** Locale ativo: 'pt' | 'en'. */
  export let locale = 'pt';

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

  const dispatch = createEventDispatcher();
</script>

<!--
  Bloco de filtros de "Acervos e Artistas" — reutilizado pelo Sidebar (desktop/tablet)
  e pelo FilterAccordion nível 1 (mobile). Mantém uma única fonte de verdade do markup.
-->
<div class="sidebar-filters">
  <AcervoFilter
    {acervos}
    {activeAcervos}
    on:change={e => dispatch('acervochange', e.detail)}
  />

  <AutocompleteSelect
    label={FILTER_LABELS[locale].artista}
    placeholder={AUTOCOMPLETE_PLACEHOLDERS[locale].artista}
    options={allCreators}
    value={selectedCreators}
    multiple={true}
    on:change={e => dispatch('creatorschange', e.detail)}
  />

  <AutocompleteSelect
    label={FILTER_LABELS[locale].education}
    placeholder={AUTOCOMPLETE_PLACEHOLDERS[locale].education}
    options={allSchools}
    value={selectedSchools}
    multiple={true}
    on:change={e => dispatch('schoolschange', e.detail)}
  />

  <AutocompleteSelect
    label={FILTER_LABELS[locale].nacionalidade}
    placeholder={AUTOCOMPLETE_PLACEHOLDERS[locale].nacionalidade}
    options={allNationalities}
    value={selectedNationalities}
    multiple={true}
    on:change={e => dispatch('nationalitieschange', e.detail)}
  />

  <GenderFilter
    genders={allGenders}
    {activeGenders}
    on:change={e => dispatch('genderchange', e.detail)}
  />
</div>

<style lang="scss">
  .sidebar-filters {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--bg-hl) transparent;
  }
</style>
