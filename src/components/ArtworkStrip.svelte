<script>
  import { createEventDispatcher, onDestroy } from 'svelte';

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

  /** Decide se o ano deve ser exibido (oculta 9999/null). */
  function showYear(year) {
    return typeof year === 'number' && year !== 9999;
  }

  function toggleCollapsed() {
    collapsed = !collapsed;
  }

  /* ── Tooltip rico ─────────────────────────────────────────────────── */
  /** Obra atualmente em hover (ou null). */
  let hoveredArt = null;
  /** Coordenadas do cursor para posicionar o tooltip. */
  let tipX = 0;
  let tipY = 0;
  /** Timer do delay de 300ms antes de exibir o tooltip. */
  let hoverTimer = null;

  function onArtworkPointerEnter(event, art) {
    tipX = event.clientX;
    tipY = event.clientY;
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => { hoveredArt = art; }, 300);
  }

  function onArtworkPointerMove(event) {
    tipX = event.clientX;
    tipY = event.clientY;
  }

  function onArtworkPointerLeave() {
    clearTimeout(hoverTimer);
    hoveredArt = null;
  }

  /* ── Lazy-load por IntersectionObserver (ativado com >50 obras) ─── */
  /** Ativo apenas quando a lista é grande o suficiente para justificar. */
  $: useObserver = artworks.length > 50;

  let observer = null;

  /** Inicializa ou destrói o observer conforme `useObserver`. */
  $: {
    if (useObserver) {
      if (!observer) {
        observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target;
              const lazy = img.dataset.lazySrc;
              if (lazy) {
                img.src = lazy;
                img.removeAttribute('data-lazy-src');
                img.classList.add('artwork__img--loaded');
                observer.unobserve(img);
              }
            }
          });
        }, { rootMargin: '80px' });
      }
    } else {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    }
  }

  onDestroy(() => {
    if (observer) observer.disconnect();
    clearTimeout(hoverTimer);
  });

  /**
   * Action do Svelte: conecta um <img> ao observer quando useObserver=true.
   * Substitui o src real por data-lazy-src e coloca placeholder.
   */
  function lazyImg(node, src) {
    if (!useObserver || !src) return {};
    node.dataset.lazySrc = src;
    node.src = '';
    if (observer) observer.observe(node);
    return {
      destroy() {
        if (observer) observer.unobserve(node);
      },
      update(newSrc) {
        node.dataset.lazySrc = newSrc;
      },
    };
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
      <span
        class="artwork-strip__chevron"
        class:artwork-strip__chevron--collapsed={collapsed}
        aria-hidden="true"
      >▾</span>
      <span class="artwork-strip__label">
        Obras dos artistas nos acervos selecionados
      </span>
    </button>

    <!-- Wrapper animado: sempre no DOM, altura 0 quando colapsado -->
    <div class="artwork-strip__body" class:artwork-strip__body--collapsed={collapsed}>
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
                on:pointerenter={(e) => onArtworkPointerEnter(e, art)}
                on:pointermove={onArtworkPointerMove}
                on:pointerleave={onArtworkPointerLeave}
              >
                {#if art.image}
                  {#if useObserver}
                    <img
                      class="artwork__img"
                      use:lazyImg={art.image}
                      alt={art.title || 'Obra'}
                      draggable="false"
                    />
                  {:else}
                    <img
                      class="artwork__img"
                      src={art.image}
                      alt={art.title || 'Obra'}
                      loading="lazy"
                      draggable="false"
                    />
                  {/if}
                {:else}
                  <div class="artwork__img artwork__img--placeholder">—</div>
                {/if}
              </button>
            </li>
          {/each}
        </ul>
      </div>
    </div>
  </section>
{/if}

<!-- Tooltip rico — renderizado fora do <section> para evitar clipping -->
{#if hoveredArt}
  <div
    class="artwork-tip"
    style="left: {tipX + 14}px; top: {tipY - 10}px;"
    role="tooltip"
    aria-live="polite"
  >
    <p class="artwork-tip__title">{hoveredArt.title || 'Sem título'}</p>
    {#if showYear(hoveredArt.year)}
      <p class="artwork-tip__year">{hoveredArt.year}</p>
    {/if}
    <p class="artwork-tip__creator">{hoveredArt.creator}</p>
    {#if hoveredArt.museum}
      <p class="artwork-tip__museum">{hoveredArt.museum}</p>
    {/if}
  </div>
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
    height: 220px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-sizing: border-box;
    z-index: 5;
    transition: height 200ms ease-out;
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
    transform: rotate(0deg);
    transition: transform 200ms ease-out;
  }

  .artwork-strip__chevron--collapsed {
    transform: rotate(-90deg);
  }

  .artwork-strip__label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ── Wrapper do body animado ──────────────────────────────────────── */
  .artwork-strip__body {
    flex: 1 1 auto;
    overflow: hidden;
    display: flex;
    flex-direction: column;
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
    transition: outline 0.1s, opacity 180ms;
  }

  .artwork__img--loaded {
    animation: artwork-fadein 180ms ease-out;
  }

  @keyframes artwork-fadein {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .artwork__img--placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--txt-l);
    font-size: 0.7rem;
  }

  /* ── Tooltip rico das obras ─────────────────────────────────────────── */
  :global(.artwork-tip) {
    position: fixed;
    z-index: 100;
    background: var(--bg-l);
    color: var(--txt);
    border: 1px solid var(--bg-hl);
    border-radius: 4px;
    padding: 8px 12px;
    max-width: 220px;
    pointer-events: none;
    font-size: 0.78rem;
    line-height: 1.4;

    p {
      margin: 0;
    }
  }

  :global(.artwork-tip__title) {
    font-weight: 600;
    margin-bottom: 2px !important;
  }

  :global(.artwork-tip__year) {
    color: var(--txt-l);
  }

  :global(.artwork-tip__creator) {
    margin-top: 4px !important;
    color: var(--txt-l);
    font-style: italic;
  }

  :global(.artwork-tip__museum) {
    margin-top: 2px !important;
    font-size: 0.7rem;
    color: var(--txt-hl);
  }
</style>

