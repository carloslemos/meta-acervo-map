<script>
  import { createEventDispatcher } from 'svelte';

  export let acervos = [];
  export let activeAcervos = new Set();

  const dispatch = createEventDispatcher();

  function toggle(acervo) {
    const next = new Set(activeAcervos);
    if (next.has(acervo)) {
      next.delete(acervo);
    } else {
      next.add(acervo);
    }
    dispatch('change', next);
  }

  function selectAll() {
    dispatch('change', new Set(acervos));
  }

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

  <ul class="acervo-filter__list">
    {#each acervos as acervo (acervo)}
      {@const active = activeAcervos.has(acervo)}
      <li>
        <button
          class="pill"
          class:pill--active={active}
          aria-pressed={active}
          on:click={() => toggle(acervo)}
        >
          {acervo}
        </button>
      </li>
    {/each}
  </ul>
</div>

<style lang="scss">
  .acervo-filter {
    background: var(--bg);
    display: flex;
    flex-direction: column;
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

  .acervo-filter__list {
    list-style: none;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--bg-hl) transparent;
    padding: 0.75rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .pill {
    all: unset;
    display: inline-block;
    width: 100%;
    padding: 0.3rem 0.6rem;
    border-radius: 0.25rem;
    border: 1px solid var(--bg-hl);
    color: var(--txt-hl);
    font-size: 0.7rem;
    letter-spacing: 0.05em;
    cursor: pointer;
    text-align: left;
    box-sizing: border-box;
    transition: background 0.1s, color 0.1s, border-color 0.1s;

    &:hover {
      border-color: var(--txt-l);
      color: var(--txt);
    }
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
