<script>
  export let label = '';
  export let sub = '';
  export let options = [];
  export let value = null;
  export let placeholder = 'Buscar…';
  /** Quando true, acumula seleções como Set e exibe chips removíveis. */
  export let multiple = false;
  /**
   * Conjunto de opções disponíveis no recorte atual (facetamento N-1).
   * `null` → sem restrição: todas as opções aparecem (comportamento padrão).
   * Opções fora do conjunto somem da lista e não podem ser adicionadas.
   */
  export let available = null;
  export let onChange = null;
  export let onSelect = null;

  let query = '';
  let open = false;
  let inputEl;

  // Estado interno do modo múltiplo — inicializa a partir de `value` se for Set.
  let selectedSet = (multiple && value instanceof Set) ? new Set(value) : new Set();

  $: filtered = (() => {
    const pool = multiple
      ? options.filter(o => !selectedSet.has(o))
      : options;
    // Facetamento N-1: só opções ainda com bubble no recorte atual (D3).
    const availablePool = available === null ? pool : pool.filter(o => available.has(o));
    return query.length === 0
      ? availablePool
      : availablePool.filter(o => o.toLowerCase().includes(query.toLowerCase()));
  })();

  // ─── Modo múltiplo ────────────────────────────────────────────────────────

  /** Adiciona uma opção ao Set e mantém o dropdown aberto. */
  function addToSet(option) {
    selectedSet.add(option);
    selectedSet = new Set(selectedSet);
    query = '';
    onChange?.(selectedSet);
  }

  /** Remove um chip do Set. */
  function removeChip(option) {
    selectedSet.delete(option);
    selectedSet = new Set(selectedSet);
    onChange?.(selectedSet);
  }

  /** Limpa todo o Set. */
  function clearAll() {
    selectedSet = new Set();
    query = '';
    open = false;
    onChange?.(selectedSet);
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
    onSelect?.(option);
  }

  /** Limpa o valor selecionado e despacha `select` com `null`. */
  function clear() {
    value = null;
    query = '';
    open = false;
    onSelect?.(null);
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
    <div>
      <span class="section-title">{label}</span>
      <br>
      <span class="section-subtitle">{sub}</span>
    </div>
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
      placeholder={placeholder}
      value={!multiple && value ? value : query}
      on:input={onInput}
      on:focus={onFocus}
      autocomplete="off"
      spellcheck="false"
    />
    <span class="autocomplete__icon" aria-hidden="true">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="4.8" cy="4.8" r="3.3" stroke="currentColor" stroke-width="1.2"/>
        <line x1="7.5" y1="7.5" x2="10.5" y2="10.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
      </svg>
    </span>

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
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-semibold);
    letter-spacing: var(--letter-spacing-tight);
    color: var(--txt-l);
  }
  .section-subtitle {
    font-size: var(--font-size-2xs);
    font-weight: var(--font-weight-md);
    letter-spacing: var(--letter-spacing-tight);
    color: var(--txt-hl);
  }

  .clear-btn {
    all: unset;
    font-size: var(--font-size-2xs);
    color: var(--txt-hl);
    cursor: pointer;
    line-height: var(--line-height-none);

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
    padding: 0.45rem 2rem 0.45rem 0.6rem;
    border: 1px solid var(--bg-hl);
    border-radius: 0.25rem;
    font-family: var(--font-family-base);
    font-size: var(--font-size-md);
    letter-spacing: var(--letter-spacing-wide);
    text-transform: uppercase;
    color: var(--neutral-40);
    background: var(--bg-m);
    cursor: text;

    &::placeholder {
      color: var(--txt-hl);
      text-transform: uppercase;
    }

    &:focus {
      border-color: var(--txt-l);
      outline: none;
    }
  }

  .autocomplete__icon {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--txt-hl);
    pointer-events: none;
    display: flex;
    align-items: center;
    line-height: 0;
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
    z-index: 200;
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
    font-size: var(--font-size-xs);
    letter-spacing: var(--letter-spacing-wide);
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
    font-size: var(--font-size-xs);
    font-family: var(--font-family-base);
    letter-spacing: var(--letter-spacing-wide);
    text-transform: uppercase;
    line-height: var(--line-height-normal);
  }

  .chip__remove {
    all: unset;
    font-size: var(--font-size-2xs);
    cursor: pointer;
    opacity: 0.7;
    line-height: var(--line-height-none);

    &:hover {
      opacity: 1;
    }
  }
</style>
