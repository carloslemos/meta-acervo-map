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
</script>

<div class="header-bar" role="group" aria-label="Controles do mapa">

  <!-- Seção 1: Tipos de bubble -->
  <div class="header-section">
    <span class="header-section__label">Visualização por trajetórias dos artistas</span>
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
  </div>

  <!-- Seção 2: Filtro de localidade -->
  <div class="header-section header-section--locality">
    <span class="header-section__label">Filtrar por localidade</span>
    <div class="header-bar__locality">
      <AutocompleteSelect
        label=""
        placeholder="Selecionar país ou continente"
        options={localidades}
        value={selectedLocalidade || null}
        multiple={false}
        on:select={handleLocalidadeSelect}
      />
    </div>
  </div>

  <!-- Seção 3: Toggle de trajetórias (radio style) -->
  <div class="header-section">
    <span class="header-section__label">Linhas do percurso</span>
    <div class="trajectory-group" role="group" aria-label="Visibilidade das trajetórias">
      <button
        type="button"
        class="trajectory-option"
        class:trajectory-option--active={showTrajectories}
        aria-pressed={showTrajectories}
        on:click={() => !showTrajectories && dispatch('trajectorieschange', true)}
      >
        <span class="trajectory-dot"></span>
        Visíveis
      </button>
      <button
        type="button"
        class="trajectory-option"
        class:trajectory-option--active={!showTrajectories}
        aria-pressed={!showTrajectories}
        on:click={() => showTrajectories && dispatch('trajectorieschange', false)}
      >
        <span class="trajectory-dot"></span>
        Ocultas
      </button>
    </div>
  </div>

</div>

<style lang="scss">
  .header-bar {
    display: flex;
    align-items: flex-start;
    gap: 30px;
    flex: 1;
    flex-wrap: nowrap;
    min-width: 0;
  }

  /* ── Seções com label + controle ──────────────────────────────────────── */
  .header-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex-shrink: 0;
  }

  .header-section--locality {
    flex: 0 1 345px;
    min-width: 150px;
    flex-shrink: 1;
  }

  .header-section__label {
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.4;
    letter-spacing: -0.01em;
    color: var(--txt-l);
    white-space: nowrap;
  }

  /* ── Pills de tipo (cores por TYPE_COLOR) ─────────────────────────────── */
  .header-bar__pills {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .pill {
    all: unset;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0.25rem 0.6rem;
    border-radius: 0.25rem;
    border: 1px solid var(--bg-hl);
    font-family: 'JetBrains Mono', monospace;
    font-weight: 500;
    font-size: 0.875rem;
    line-height: 1.4;
    letter-spacing: -0.01em;
    color: var(--txt-l);
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
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent);
    flex-shrink: 0;
    transition: background 0.12s;
  }

  /* ── Localidade (AutocompleteSelect inline) ──────────────────────────── */
  .header-bar__locality {
    /* O AutocompleteSelect traz padding/border-top próprios pensados para
       a sidebar. Neutralizamos aqui para a barra horizontal. */
    :global(.autocomplete-section) {
      border-top: none;
      padding: 0;
    }
    :global(.section-header) {
      display: none;
    }
    :global(.autocomplete__input) {
      font-size: 0.875rem;
      padding: 0.35rem 0.75rem;
    }
  }

  /* ── Toggle de trajetórias (radio style) ─────────────────────────────── */
  .trajectory-group {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .trajectory-option {
    all: unset;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 500;
    font-size: 0.875rem;
    line-height: 1.4;
    letter-spacing: -0.01em;
    text-transform: uppercase;
    color: var(--txt-l);
    cursor: pointer;
    white-space: nowrap;

    &:hover {
      color: var(--txt);
    }
  }

  .trajectory-option--active {
    color: var(--txt);
  }

  .trajectory-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: 1px solid currentColor;
    flex-shrink: 0;

    .trajectory-option--active & {
      background: currentColor;
    }
  }
</style>
