<script>
  import { createEventDispatcher } from 'svelte';

  /**
   * Lista de obras já filtrada e ordenada por `App.svelte`.
   * Cada obra: { id, creator, museum, title, year, image, url }.
   */
  export let artworks = [];

  /**
   * Estado do collapse — controlado (bindable). Pai pode `bind:collapsed`
   * para calcular `bottomInset` do WorldMap e evitar oclusão do globo.
   */
  export let collapsed = false;

  const dispatch = createEventDispatcher();

  /** Distância (em px) até o fim do scroll vertical — controla o fade. */
  let scrollEl;
  let atBottom = false;

  /** Atualiza `atBottom` quando o usuário rola a grid de obras. */
  function handleScroll() {
    if (!scrollEl) return;
    const { scrollTop, clientHeight, scrollHeight } = scrollEl;
    atBottom = scrollTop + clientHeight >= scrollHeight - 1;
  }

  /** Quando a lista de obras muda, reavalia o fade (pode ter encolhido). */
  $: if (artworks && scrollEl) {
    /* defer p/ próximo tick para garantir DOM atualizado */
    queueMicrotask(handleScroll);
  }

  /** Click numa obra → emite o nome do criador para abrir o ArtistCard. */
  function selectArtwork(artwork) {
    if (artwork?.creator) dispatch('artistselect', artwork.creator);
  }

  /** Decide se o ano deve ser exibido no `title=` (oculta 9999/null). */
  function showYear(year) {
    return typeof year === 'number' && year !== 9999;
  }

  function toggleCollapsed() {
    collapsed = !collapsed;
  }
</script>

{#if artworks.length > 0}
  <section
    class="artwork-strip"
    class:artwork-strip--collapsed={collapsed}
    aria-label="Obras dos artistas selecionados"
  >
    <button
      type="button"
      class="artwork-strip__header"
      aria-expanded={!collapsed}
      on:click={toggleCollapsed}
    >
      <span class="artwork-strip__chevron" aria-hidden="true">
        {collapsed ? '▸' : '▾'}
      </span>
      <span class="artwork-strip__label">
        Obras dos artistas nos acervos selecionados
      </span>
    </button>

    {#if !collapsed}
      <div
        class="artwork-strip__scroll"
        class:artwork-strip__scroll--at-bottom={atBottom}
        bind:this={scrollEl}
        on:scroll={handleScroll}
      >
        <ul class="artwork-strip__grid">
          {#each artworks as art (art.id)}
            <li class="artwork">
              <button
                type="button"
                class="artwork__btn"
                on:click={() => selectArtwork(art)}
                title="{art.title || 'Sem título'}{showYear(art.year) ? ` (${art.year})` : ''} — {art.creator}"
              >
                {#if art.image}
                  <img
                    class="artwork__img"
                    src={art.image}
                    alt={art.title || 'Obra'}
                    loading="lazy"
                    draggable="false"
                  />
                {:else}
                  <div class="artwork__img artwork__img--placeholder">—</div>
                {/if}
              </button>
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  </section>
{/if}

<style lang="scss">
  .artwork-strip {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--bg);
    color: var(--txt);
    pointer-events: auto;
    height: 280px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-sizing: border-box;
    z-index: 5;
  }

  .artwork-strip--collapsed {
    height: 36px;
  }

  /* ── Header clicável (chevron + label) ─────────────────────────────── */
  .artwork-strip__header {
    all: unset;
    display: flex;
    align-items: center;
    gap: 10px;
    height: 36px;
    padding: 0 20px;
    cursor: pointer;
    color: var(--txt-l);
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    flex-shrink: 0;
    box-sizing: border-box;

    &:hover {
      color: var(--txt);
    }

    &:focus-visible {
      outline: 2px solid var(--txt);
      outline-offset: -2px;
    }
  }

  .artwork-strip__chevron {
    display: inline-block;
    width: 12px;
    text-align: center;
    color: var(--txt);
  }

  .artwork-strip__label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ── Container scrollável da grid ──────────────────────────────────── */
  .artwork-strip__scroll {
    position: relative;
    flex: 1 1 auto;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: thin;
    scrollbar-color: var(--bg-hl) transparent;

    /* Gradiente sutil sobre a última fileira indicando mais conteúdo abaixo.
       Some quando o scroll chega ao fim. Nunca clicável. */
    &::after {
      content: '';
      position: sticky;
      bottom: 0;
      left: 0;
      right: 0;
      display: block;
      height: 50px;
      margin-top: -50px;
      background: linear-gradient(180deg, rgba(0, 0, 0, 0) 38.46%, #000000 100%);
      pointer-events: none;
      opacity: 1;
      transition: opacity 120ms linear;
    }

    &--at-bottom::after {
      opacity: 0;
    }
  }

  /* ── Grid vertical de thumbnails quadrados ─────────────────────────── */
  .artwork-strip__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 8px;
    padding: 8px 20px 16px;
    margin: 0;
    list-style: none;
  }

  .artwork {
    aspect-ratio: 1 / 1;
  }

  .artwork__btn {
    all: unset;
    display: block;
    width: 100%;
    height: 100%;
    cursor: pointer;
    box-sizing: border-box;

    &:hover .artwork__img {
      outline: 2px solid var(--txt);
    }

    &:focus-visible {
      outline: 2px solid var(--txt);
      outline-offset: 2px;
    }
  }

  .artwork__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    background: var(--bg-l);
    display: block;
    transition: outline 0.1s;
  }

  .artwork__img--placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--txt-l);
    font-size: 0.7rem;
  }
</style>

