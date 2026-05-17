<script>
  import { createEventDispatcher } from 'svelte';
  import { TYPE_COLOR, TYPE_LABEL } from '../lib/constants.js';
  import AutocompleteSelect from './AutocompleteSelect.svelte';

  /** Conjunto de tipos de bubble visíveis. */
  export let activeTypes = new Set(['birth', 'education']);

  /** Localidade selecionada (país OU continente). String vazia = sem filtro. */
  export let selectedLocalidade = '';

  /** Opções para o autocomplete de localidade (países + continentes). */
  export let localidades = [];

  /** Trajetórias visíveis ou ocultas. */
  export let showTrajectories = true;

  const dispatch = createEventDispatcher();

  const FILTERS = [
    { type: 'birth',     label: TYPE_LABEL.birth,     color: TYPE_COLOR.birth },
    { type: 'education', label: TYPE_LABEL.education, color: TYPE_COLOR.education },
    { type: 'death',     label: TYPE_LABEL.death,     color: TYPE_COLOR.death },
    { type: 'acervo',    label: TYPE_LABEL.acervo,    color: TYPE_COLOR.acervo },
  ];

  /** Alterna a presença de um tipo no conjunto e dispatcha `typeschange`. */
  function toggleType(type) {
    const next = new Set(activeTypes);
    if (next.has(type)) next.delete(type);
    else next.add(type);
    dispatch('typeschange', next);
  }

  /** Repassa seleção de localidade do AutocompleteSelect como string ou ''. */
  function handleLocalidadeSelect(event) {
    dispatch('localidadechange', event.detail ?? '');
  }

  /** Alterna visibilidade das trajetórias. */
  function toggleTrajectories() {
    dispatch('trajectorieschange', !showTrajectories);
  }
</script>

<div class="header-bar" role="group" aria-label="Controles do mapa">
  <div class="header-bar__pills">
    {#each FILTERS as filter}
      <button
        type="button"
        class="pill"
        class:pill--active={activeTypes.has(filter.type)}
        style="--accent: {filter.color}"
        aria-pressed={activeTypes.has(filter.type)}
        on:click={() => toggleType(filter.type)}
      >
        <span class="pill__dot"></span>
        {filter.label}
      </button>
    {/each}
  </div>

  <div class="header-bar__locality">
    <AutocompleteSelect
      label="Localidade"
      options={localidades}
      value={selectedLocalidade || null}
      multiple={false}
      on:select={handleLocalidadeSelect}
    />
  </div>

  <button
    type="button"
    class="trajectory-toggle"
    class:trajectory-toggle--on={showTrajectories}
    aria-pressed={showTrajectories}
    on:click={toggleTrajectories}
  >
    <span class="trajectory-toggle__label">Trajetórias</span>
    <span class="trajectory-toggle__state">
      {showTrajectories ? 'VISÍVEIS' : 'OCULTAS'}
    </span>
  </button>
</div>

<style lang="scss">
  .header-bar {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
    flex-wrap: nowrap;
    min-width: 0;
  }

  .header-bar__pills {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .header-bar__locality {
    flex: 0 1 260px;
    min-width: 160px;
    /* O AutocompleteSelect traz padding/border-top próprios pensados para
       a sidebar. Neutralizamos aqui para a barra horizontal. */
    :global(.autocomplete-section) {
      border-top: none;
      padding: 0;
    }
    :global(.section-header) {
      margin-bottom: 4px;
    }
    :global(.section-title) {
      color: var(--txt);
    }
  }

  /* ── Pills de tipo (cores por TYPE_COLOR) ─────────────────────────────── */
  .pill {
    all: unset;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0.3rem 0.75rem;
    border-radius: 0.3rem;
    border: 1px solid var(--bg-hl);
    color: var(--txt-l);
    font-size: 0.72rem;
    letter-spacing: 0.06em;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.12s, color 0.12s, border-color 0.12s;
    box-sizing: border-box;

    &:not(.pill--active):hover {
      border-color: var(--txt-l);
      color: var(--txt);
    }
  }

  .pill--active {
    background-color: var(--accent);
    border-color: var(--accent);
    color: var(--bg);

    .pill__dot {
      background: var(--bg);
    }
  }

  .pill__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--accent);
    flex-shrink: 0;
    transition: background 0.12s;
  }

  /* ── Toggle de trajetórias ───────────────────────────────────────────── */
  .trajectory-toggle {
    all: unset;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 0.3rem 0.75rem;
    border-radius: 0.3rem;
    border: 1px solid var(--bg-hl);
    color: var(--txt-l);
    font-size: 0.72rem;
    letter-spacing: 0.06em;
    cursor: pointer;
    white-space: nowrap;
    box-sizing: border-box;
    flex-shrink: 0;

    &:hover {
      border-color: var(--txt-l);
      color: var(--txt);
    }
  }

  .trajectory-toggle--on {
    background: var(--txt);
    color: var(--bg);
    border-color: var(--txt);

    &:hover {
      background: var(--txt-l);
      border-color: var(--txt-l);
    }
  }

  .trajectory-toggle__state {
    font-weight: 600;
    letter-spacing: 0.08em;
  }
</style>
