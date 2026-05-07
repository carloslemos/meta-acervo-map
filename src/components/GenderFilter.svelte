<script>
  import { createEventDispatcher } from 'svelte';

  export let genders = [];
  export let activeGenders = new Set();

  const dispatch = createEventDispatcher();

  const GENDER_LABEL = {
    male:   'Masculino',
    female: 'Feminino',
    'non-binary': 'Não-binário',
    unknown: 'Desconhecido',
  };

  function labelFor(g) {
    return GENDER_LABEL[g] ?? (g.charAt(0).toUpperCase() + g.slice(1));
  }

  /** Alterna a presença de um gênero no conjunto ativo. */
  function toggle(g) {
    const next = new Set(activeGenders);
    if (next.has(g)) {
      next.delete(g);
    } else {
      next.add(g);
    }
    dispatch('change', next);
  }
</script>

<div class="gender-filter">
  <div class="section-header">
    <span class="section-title">Gênero</span>
  </div>
  <div class="pills" role="group" aria-label="Filtrar por gênero">
    {#each genders as g (g)}
      <label
        class="pill"
        class:pill--active={activeGenders.has(g)}
      >
        <input
          type="checkbox"
          checked={activeGenders.has(g)}
          on:change={() => toggle(g)}
        />
        {labelFor(g)}
      </label>
    {/each}
  </div>
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
    letter-spacing: 0.08em;
    color: var(--txt);
  }

  .pills {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
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

    input[type='checkbox'] {
      display: none;
    }

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
