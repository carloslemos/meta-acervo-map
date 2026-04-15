<script>
  import { createEventDispatcher } from 'svelte';

  export let activeTypes = new Set(['birth', 'death']);

  const dispatch = createEventDispatcher();

  const FILTERS = [
    { type: 'birth',     label: 'Nascimento', color: '#2563eb', disabled: false },
    { type: 'death',     label: 'Morte',      color: '#dc2626', disabled: false },
    { type: 'education', label: 'Estudo',     color: '#16a34a', disabled: true  },
  ];

  function toggle(type) {
    const next = new Set(activeTypes);
    if (next.has(type)) {
      next.delete(type);
    } else {
      next.add(type);
    }
    dispatch('change', next);
  }
</script>

<div class="filter-controls" role="group" aria-label="Filtrar por tipo">
  {#each FILTERS as filter}
    <label
      class="pill"
      class:pill--disabled={filter.disabled}
      class:pill--active={activeTypes.has(filter.type)}
      style="--accent: {filter.color}"
      title={filter.disabled ? 'Dados de estudo não disponíveis ainda' : ''}
    >
      <input
        type="checkbox"
        checked={activeTypes.has(filter.type)}
        disabled={filter.disabled}
        on:change={() => toggle(filter.type)}
      />
      <span class="pill__dot"></span>
      {filter.label}
    </label>
  {/each}
</div>

<style lang="scss">
  .filter-controls {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: nowrap;
  }

  .pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0.3rem 0.75rem;
    border-radius: 0.3rem;
    border: 1px solid var(--bg-l, #ddd);
    color: var(--bg-l, #ddd);
    font-size: 0.72rem;
    letter-spacing: 0.06em;
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
    transition: background 0.12s, color 0.12s, border-color 0.12s;

    input[type='checkbox'] {
      display: none;
    }

    &:hover {
      border-color: var(--bg, #fff);
      color: var(--bg, #fff);
    }
  }

  .pill--active {
    background-color: var(--accent);
    border-color: var(--accent);
    color: #fff;

    .pill__dot {
      background: #fff;
    }
  }

  .pill--disabled {
    cursor: not-allowed;
    opacity: 0.35;
  }

  .pill__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--accent);
    flex-shrink: 0;
    transition: background 0.12s;
  }
</style>

