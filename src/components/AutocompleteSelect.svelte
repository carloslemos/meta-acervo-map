<script>
  import { createEventDispatcher } from 'svelte';

  export let label = '';
  export let options = [];
  export let value = null;
  /** Quando true, acumula seleções como Set e exibe chips removíveis. */
  export let multiple = false;

  const dispatch = createEventDispatcher();

  let query = '';
  let open = false;
  let inputEl;

  // Estado interno do modo múltiplo — inicializa a partir de `value` se for Set.
  let selectedSet = (multiple && value instanceof Set) ? new Set(value) : new Set();

  $: filtered = (() => {
    const pool = multiple
      ? options.filter(o => !selectedSet.has(o))
      : options;
    return query.length === 0
      ? pool
      : pool.filter(o => o.toLowerCase().includes(query.toLowerCase()));
  })();

  // ─── Modo múltiplo ────────────────────────────────────────────────────────

  /** Adiciona uma opção ao Set e mantém o dropdown aberto. */
  function addToSet(option) {
    selectedSet.add(option);
    selectedSet = new Set(selectedSet);
    query = '';
    dispatch('change', selectedSet);
  }

  /** Remove um chip do Set. */
  function removeChip(option) {
    selectedSet.delete(option);
    selectedSet = new Set(selectedSet);
    dispatch('change', selectedSet);
  }

  /** Limpa todo o Set. */
  function clearAll() {
    selectedSet = new Set();
    query = '';
    open = false;
    dispatch('change', selectedSet);
  }

  // ─── Modo simples (comportamento original inalterado) ─────────────────────

  /** Atualiza a query de busca; entrada vazia limpa o filtro. */
  function onInput(e) {
    query = e.target.value;
    open = true;
    if (!multiple && query === '') clear();
  }

  /** Seleciona uma opção e despacha o evento `select`. */
  function select(option) {
    value = option;
    query = '';
    open = false;
    dispatch('select', option);
  }

  /** Limpa o valor selecionado e despacha `select` com `null`. */
  function clear() {
    value = null;
    query = '';
    open = false;
    dispatch('select', null);
  }

  /** Abre a lista ao focar no input. */
  function onFocus() {
    open = true;
  }

  /** Fecha a lista quando o clique acontece fora do componente. */
  function onWindowClick(e) {
    if (inputEl && !inputEl.closest('.autocomplete')?.contains(e.target)) {
      open = false;
      query = '';
    }
  }
</script>

<svelte:window on:click={onWindowClick} />

<div class="autocomplete-section">
  <div class="section-header">
    <span class="section-title">{label}</span>
    {#if multiple && selectedSet.size > 0}
      <button class="clear-btn" on:click={clearAll} aria-label="Limpar todos">✕</button>
    {:else if !multiple && value}
      <button class="clear-btn" on:click={clear} aria-label="Limpar filtro">✕</button>
    {/if}
  </div>

  {#if multiple && selectedSet.size > 0}
    <div class="chips">
      {#each [...selectedSet] as chip (chip)}
        <span class="chip">
          {chip}
          <button class="chip__remove" on:click={() => removeChip(chip)} aria-label="Remover {chip}">✕</button>
        </span>
      {/each}
    </div>
  {/if}

  <div class="autocomplete" bind:this={inputEl}>
    <input
      class="autocomplete__input"
      class:autocomplete__input--active={!multiple && !!value}
      type="text"
      placeholder="Buscar…"
      value={!multiple && value ? value : query}
      on:input={onInput}
      on:focus={onFocus}
      autocomplete="off"
      spellcheck="false"
    />

    {#if open && filtered.length > 0}
      <ul class="autocomplete__dropdown" role="listbox">
        {#each filtered.slice(0, 50) as option (option)}
          <li>
            <button
              class="autocomplete__option"
              class:autocomplete__option--selected={!multiple && option === value}
              role="option"
              aria-selected={!multiple && option === value}
              on:click={() => multiple ? addToSet(option) : select(option)}
            >
              {option}
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>

<style lang="scss">
  .autocomplete-section {
    border-top: 1px solid var(--bg-hl);
    padding: 0.75rem 1rem;
    flex-shrink: 0;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 0.5rem;
  }

  .section-title {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: var(--txt);
  }

  .clear-btn {
    all: unset;
    font-size: 0.65rem;
    color: var(--txt-hl);
    cursor: pointer;
    line-height: 1;

    &:hover {
      color: var(--txt);
    }
  }

  .autocomplete {
    position: relative;
  }

  .autocomplete__input {
    all: unset;
    display: block;
    width: 100%;
    box-sizing: border-box;
    padding: 0.3rem 0.6rem;
    border: 1px solid var(--bg-hl);
    border-radius: 0.25rem;
    font-family: 'Roboto Mono', monospace;
    font-size: 0.7rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--txt-l);
    background: var(--bg);
    cursor: text;

    &::placeholder {
      color: var(--bg-hl);
      text-transform: uppercase;
    }

    &:focus {
      border-color: var(--txt-l);
      outline: none;
    }
  }

  .autocomplete__input--active {
    background: var(--txt);
    color: var(--bg);
    border-color: var(--txt);
  }

  .autocomplete__dropdown {
    position: absolute;
    top: calc(100% + 2px);
    left: 0;
    right: 0;
    z-index: 50;
    background: var(--bg);
    border: 1px solid var(--txt-l);
    border-radius: 0.25rem;
    list-style: none;
    max-height: 180px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--bg-hl) transparent;
  }

  .autocomplete__option {
    all: unset;
    display: block;
    width: 100%;
    box-sizing: border-box;
    padding: 0.35rem 0.6rem;
    font-size: 0.68rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--txt-l);
    cursor: pointer;

    &:hover {
      background: var(--bg-l);
      color: var(--txt);
    }
  }

  .autocomplete__option--selected {
    background: var(--txt);
    color: var(--bg);

    &:hover {
      background: var(--txt-l);
    }
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    margin-bottom: 0.4rem;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.15rem 0.4rem;
    background: var(--txt);
    color: var(--bg);
    border-radius: 0.2rem;
    font-size: 0.62rem;
    font-family: 'Roboto Mono', monospace;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    line-height: 1.4;
  }

  .chip__remove {
    all: unset;
    font-size: 0.55rem;
    cursor: pointer;
    opacity: 0.7;
    line-height: 1;

    &:hover {
      opacity: 1;
    }
  }
</style>
