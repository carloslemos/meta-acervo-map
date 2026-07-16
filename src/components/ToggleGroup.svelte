<script>

  /**
   * Lista de itens a exibir como pills alternáveis.
   * @type {Array<{ value: string, label: string }>}
   */
  export let items = [];

  /** Conjunto de valores ativos. */
  export let active = new Set();

  /**
   * Conjunto de valores disponíveis no recorte atual (facetamento N-1).
   * `null` → sem restrição: todas as opções ficam habilitadas (comportamento padrão).
   */
  export let available = null;

  /**
   * Layout das pills:
   * - 'wrap'  → flex-wrap horizontal (padrão)
   * - 'list'  → coluna vertical com overflow-y e pills de largura total
   */
  export let layout = 'wrap';
  export let onChange = null;

  /** Valor sem bubble no recorte atual (esmaecido). */
  function isUnavailable(value) {
    return available !== null && !available.has(value);
  }

  /**
   * Clique bloqueado apenas quando o valor está indisponível E não selecionado.
   * Um valor já selecionado permanece clicável para desmarcar (D6/Opção A).
   */
  function isDisabled(value) {
    return isUnavailable(value) && !active.has(value);
  }

  /** Alterna a presença de um valor no conjunto ativo e emite o novo Set. */
  function toggle(value) {
    if (isDisabled(value)) return;
    const next = new Set(active);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange?.(next);
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
      class:pill--dim={isUnavailable(item.value)}
      aria-pressed={active.has(item.value)}
      disabled={isDisabled(item.value)}
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
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    border: 1.5px solid var(--pill-bg);
    color: var(--pill-bg);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    letter-spacing: var(--letter-spacing-tighter);
    cursor: pointer;
    box-sizing: border-box;
    transition: background 0.1s, color 0.1s, border-color 0.1s;

    &:hover {
      border-color: var(--pill-bgh);
      color: var(--pill-bgh);
    }
  }

  .pill--dim {
    opacity: 0.32;
  }

  .pill:disabled {
    cursor: not-allowed;

    &:hover {
      border-color: var(--pill-bg);
      color: var(--pill-bg);
    }
  }

  .toggle-group--list .pill {
    width: 100%;
    text-align: left;
  }

  .pill--active {
    background: var(--pill-bg);
    border-color: var(--pill-bg);
    color: var(--pill-txt);

    &:hover {
      background: var(--pill-bgh);
      border-color: var(--pill-bgh);
      color: var(--pill-txt);
    }
  }
</style>
