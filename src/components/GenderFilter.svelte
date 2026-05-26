<script>
  import { createEventDispatcher } from 'svelte';
  import ToggleGroup from './ToggleGroup.svelte';

  export let genders = [];
  export let activeGenders = new Set();

  const dispatch = createEventDispatcher();

  const GENDER_LABEL = {
    male:        'Masculino',
    female:      'Feminino',
    'non-binary': 'Não-binário',
    unknown:     'Desconhecido',
  };

  function labelFor(g) {
    return GENDER_LABEL[g] ?? (g.charAt(0).toUpperCase() + g.slice(1));
  }

  $: items = genders.map(g => ({ value: g, label: labelFor(g) }));
</script>

<div class="gender-filter">
  <div class="section-header">
    <span class="section-title">Gênero</span>
  </div>
  <ToggleGroup
    {items}
    active={activeGenders}
    on:change={e => dispatch('change', e.detail)}
  />
</div>

<style lang="scss">
  .gender-filter {
    border-top: 1px solid var(--bg-hl);
    padding: 0.75rem 1rem;
    flex-shrink: 0;
  }

  .section-header {
    margin-bottom: 0.5rem;
  }

  .section-title {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--txt-hl);
  }


</style>
