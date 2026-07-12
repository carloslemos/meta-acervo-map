<script>
  import { createEventDispatcher } from 'svelte';
  import { FILTER_LABELS, BUTTON_LABELS } from '../lib/constants.js';
  import ToggleGroup from './ToggleGroup.svelte';

  export let acervos = [];
  export let activeAcervos = new Set();

  const dispatch = createEventDispatcher();

  $: items = acervos.map(a => ({ value: a, label: a }));

  /** Seleciona todos os acervos. */
  function selectAll() {
    dispatch('change', new Set(acervos));
  }

  /** Limpa a seleção de acervos. */
  function selectNone() {
    dispatch('change', new Set());
  }
</script>

<div class="acervo-filter">
  <div class="acervo-filter__header">
    <span class="acervo-filter__title">{FILTER_LABELS.acervo}</span>
  </div>

  <ToggleGroup
    {items}
    active={activeAcervos}
    layout="wrap"
    on:change={e => dispatch('change', e.detail)}
  />

  <div class="acervo-filter__shortcuts">
    <button class="shortcut" on:click={selectAll}>{BUTTON_LABELS.selectAll}</button>
    <span class="shortcut-sep">/</span>
    <button class="shortcut" on:click={selectNone}>{BUTTON_LABELS.clearSelection}</button>
  </div>
</div>

<style lang="scss">
  .acervo-filter {
    display: flex;
    flex-direction: column;

    :global(.toggle-group) {
      padding: 0.75rem 1rem;
    }
  }

  .acervo-filter__header {
    padding: 1rem 1rem 0.5rem;
    flex-shrink: 0;
  }

  .acervo-filter__title {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    letter-spacing: var(--letter-spacing-tight);
    color: var(--txt-hl);
  }

  .acervo-filter__shortcuts {
    display: flex;
    align-items: center;
    gap: 3px;
    padding: 0.25rem 1rem 0.75rem;
  }

  .shortcut {
    all: unset;
    font-size: var(--font-size-2xs);
    letter-spacing: var(--letter-spacing-tight);
    color: var(--txt-hl);
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;

    &:hover {
      color: var(--txt);
    }
  }

  .shortcut-sep {
    font-size: var(--font-size-2xs);
    color: var(--bg-hl);
  }


</style>
