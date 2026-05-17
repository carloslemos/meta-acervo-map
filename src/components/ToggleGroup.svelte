<script>
  import { createEventDispatcher } from 'svelte';

  /**
   * Lista de itens a exibir como pills alternáveis.
   * @type {Array<{ value: string, label: string }>}
   */
  export let items = [];

  /** Conjunto de valores ativos. */
  export let active = new Set();

  /**
   * Layout das pills:
   * - 'wrap'  → flex-wrap horizontal (padrão)
   * - 'list'  → coluna vertical com overflow-y e pills de largura total
   */
  export let layout = 'wrap';

  const dispatch = createEventDispatcher();

  /** Alterna a presença de um valor no conjunto ativo e emite o novo Set. */
  function toggle(value) {
    const next = new Set(active);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    dispatch('change', next);
  }
</script>

<div
  class="toggle-group"
  class:toggle-group--list={layout === 'list'}
  role="group"
>
  {#each items as item (item.value)}
    <button
      class="pill"
      class:pill--active={active.has(item.value)}
      aria-pressed={active.has(item.value)}
      on:click={() => toggle(item.value)}
    >
      {item.label}
    </button>
  {/each}
</div>

<style lang="scss">
  .toggle-group {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .toggle-group--list {
    flex-wrap: nowrap;
    flex-direction: column;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--bg-hl) transparent;
    padding: 0.75rem 1rem;
  }

  .pill {
    all: unset;
    display: inline-block;
    padding: 0.3rem 0.6rem;
    border-radius: 0.25rem;
    border: 1px solid var(--bg-hl);
    color: var(--txt-hl);
    font-size: 0.7rem;
    letter-spacing: 0.05em;
    cursor: pointer;
    box-sizing: border-box;
    transition: background 0.1s, color 0.1s, border-color 0.1s;

    &:hover {
      border-color: var(--txt-l);
      color: var(--txt);
    }
  }

  .toggle-group--list .pill {
    width: 100%;
    text-align: left;
  }

  .pill--active {
    background: var(--txt);
    border-color: var(--txt);
    color: var(--bg);

    &:hover {
      background: var(--txt-l);
      border-color: var(--txt-l);
    }
  }
</style>
