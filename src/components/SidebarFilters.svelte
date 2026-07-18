<script>
  import { FILTER_LABELS, AUTOCOMPLETE_PLACEHOLDERS, NATIONALITIES_FILTER_ENABLED } from '../lib/constants.js';
  import AcervoFilter from './AcervoFilter.svelte';
  import AutocompleteSelect from './AutocompleteSelect.svelte';
  import GenderFilter from './GenderFilter.svelte';

  /** Locale ativo: 'pt' | 'en'. */
  export let locale = 'pt';

  export let acervos = [];
  export let activeAcervos = new Set();
  export let availableAcervos = null;
  export let allGenders = [];
  export let activeGenders = new Set();
  export let availableGenders = null;
  export let allCreators = [];
  export let selectedCreators = new Set();
  export let availableCreators = null;
  export let allSchools = [];
  export let selectedSchools = new Set();
  export let availableSchools = null;
  export let allNationalities = [];
  export let selectedNationalities = new Set();
  export let availableNationalities = null;
  export let onAcervoChange = null;
  export let onCreatorsChange = null;
  export let onSchoolsChange = null;
  export let onNationalitiesChange = null;
  export let onGenderChange = null;
</script>

<!--
  Bloco de filtros de "Acervos e Artistas" — reutilizado pelo Sidebar (desktop/tablet)
  e pelo FilterAccordion nível 1 (mobile). Mantém uma única fonte de verdade do markup.
-->
<div class="sidebar-filters">
  <AcervoFilter
    {acervos}
    {activeAcervos}
    available={availableAcervos}
    {locale}
    onChange={onAcervoChange}
  />

  <AutocompleteSelect
    label={FILTER_LABELS[locale].artista}
    sub={FILTER_LABELS[locale].artista_sub}
    placeholder={AUTOCOMPLETE_PLACEHOLDERS[locale].artista}
    options={allCreators}
    value={selectedCreators}
    available={availableCreators}
    multiple={true}
    onChange={onCreatorsChange}
  />

  <AutocompleteSelect
    label={FILTER_LABELS[locale].education}
    sub={FILTER_LABELS[locale].education_sub}
    placeholder={AUTOCOMPLETE_PLACEHOLDERS[locale].education}
    options={allSchools}
    value={selectedSchools}
    available={availableSchools}
    multiple={true}
    onChange={onSchoolsChange}
  />

  {#if NATIONALITIES_FILTER_ENABLED}
    <AutocompleteSelect
      label={FILTER_LABELS[locale].nacionalidade}
      placeholder={AUTOCOMPLETE_PLACEHOLDERS[locale].nacionalidade}
      options={allNationalities}
      value={selectedNationalities}
      available={availableNationalities}
      multiple={true}
      onChange={onNationalitiesChange}
    />
  {/if}

  <GenderFilter
    genders={allGenders}
    {activeGenders}
    available={availableGenders}
    {locale}
    onChange={onGenderChange}
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
