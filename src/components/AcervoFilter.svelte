<script>
  import { createEventDispatcher } from 'svelte';
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
    <span class="acervo-filter__title">Acervo</span>
    <div class="acervo-filter__shortcuts">
      <button class="shortcut" on:click={selectAll}>todos</button>
      <span class="shortcut-sep">/</span>
      <button class="shortcut" on:click={selectNone}>nenhum</button>
    </div>
  </div>

  <ToggleGroup
    {items}
    active={activeAcervos}
    layout="wrap"
    on:change={e => dispatch('change', e.detail)}
  />
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
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding: 1rem 1rem 0.5rem;
    border-bottom: 1px solid var(--bg-hl);
    flex-shrink: 0;
  }

  .acervo-filter__title {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: var(--txt);
  }

  .acervo-filter__shortcuts {
    display: flex;
    align-items: center;
    gap: 3px;
  }

  .shortcut {
    all: unset;
    font-size: 0.65rem;
    letter-spacing: 0.04em;
    color: var(--txt-hl);
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;

    &:hover {
      color: var(--txt);
    }
  }

  .shortcut-sep {
    font-size: 0.65rem;
    color: var(--bg-hl);
  }


</style>
