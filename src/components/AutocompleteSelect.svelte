<script>
  import { createEventDispatcher, onDestroy } from 'svelte';

  export let label = '';
  export let options = [];
  export let value = null;

  const dispatch = createEventDispatcher();

  let query = '';
  let open = false;
  let inputEl;

  $: displayValue = value ?? '';
  $: filtered = query.length === 0
    ? options
    : options.filter(o => o.toLowerCase().includes(query.toLowerCase()));

  /** Atualiza a query de busca; entrada vazia limpa o filtro. */
  function onInput(e) {
    query = e.target.value;
    open = true;
    if (query === '') clear();
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
    {#if value}
      <button class="clear-btn" on:click={clear} aria-label="Limpar filtro">✕</button>
    {/if}
  </div>

  <div class="autocomplete" bind:this={inputEl}>
    <input
      class="autocomplete__input"
      class:autocomplete__input--active={!!value}
      type="text"
      placeholder="Buscar…"
      value={value ? value : query}
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
              class:autocomplete__option--selected={option === value}
              role="option"
              aria-selected={option === value}
              on:click={() => select(option)}
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
</style>
