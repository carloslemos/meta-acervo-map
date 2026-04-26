<script>
  import { createEventDispatcher } from 'svelte';

  export let projectionType = '2d';

  const dispatch = createEventDispatcher();

  const OPTIONS = [
    { value: '2d', label: '2D' },
    { value: '3d', label: 'Globo' },
  ];

  function select(value) {
    if (value !== projectionType) {
      dispatch('change', value);
    }
  }
</script>

<div class="projection-toggle" role="group" aria-label="Tipo de projeção">
  {#each OPTIONS as opt}
    <button
      type="button"
      class="pill"
      class:pill--active={projectionType === opt.value}
      on:click={() => select(opt.value)}
    >
      {opt.label}
    </button>
  {/each}
</div>

<style lang="scss">
  .projection-toggle {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .pill {
    display: inline-flex;
    align-items: center;
    padding: 0.3rem 0.75rem;
    border-radius: 0.3rem;
    border: 1px solid var(--bg-l, #ddd);
    background: transparent;
    color: var(--bg-l, #ddd);
    font-size: 0.72rem;
    letter-spacing: 0.06em;
    font-family: inherit;
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
    transition: background 0.12s, color 0.12s, border-color 0.12s;

    &:not(.pill--active):hover {
      border-color: var(--bg, #fff);
      color: var(--bg, #fff);
    }
  }

  .pill--active {
    background-color: var(--bg, #fff);
    color: var(--txt, #202020);
    border-color: var(--bg, #fff);

    &:hover {
      background-color: var(--bg-l, #ddd);
      border-color: var(--bg-l, #ddd);
      color: var(--txt, #202020);
    }
  }
</style>
