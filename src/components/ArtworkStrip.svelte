<script>
  import { createEventDispatcher } from 'svelte';

  /**
   * Lista de obras já filtrada e ordenada por `App.svelte`.
   * Cada obra: { id, creator, museum, title, year, image, url }.
   */
  export let artworks = [];

  const dispatch = createEventDispatcher();

  /** Click numa obra → emite o nome do criador para abrir o ArtistCard. */
  function selectArtwork(artwork) {
    if (artwork?.creator) dispatch('artistselect', artwork.creator);
  }

  /** Decide se o ano deve ser exibido (oculta 9999/null/undefined). */
  function showYear(year) {
    return typeof year === 'number' && year !== 9999;
  }
</script>

<div class="artwork-strip" role="region" aria-label="Obras dos artistas visíveis">
  {#if artworks.length === 0}
    <div class="artwork-strip__empty">Sem obras a exibir</div>
  {:else}
    <ul class="artwork-strip__list">
      {#each artworks as art (art.id)}
        <li class="artwork">
          <button
            type="button"
            class="artwork__btn"
            on:click={() => selectArtwork(art)}
            title="{art.title}{showYear(art.year) ? ` (${art.year})` : ''} — {art.creator}"
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
            <div class="artwork__meta">
              <span class="artwork__title">{art.title || 'Sem título'}</span>
              {#if showYear(art.year)}
                <span class="artwork__year">{art.year}</span>
              {/if}
            </div>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style lang="scss">
  .artwork-strip {
    position: relative;
    background: var(--txt);
    color: var(--bg);
    border-top: 1px solid var(--bg-hl);
    /* Sempre interativo, mesmo com o mapa bloqueado. */
    pointer-events: auto;
    height: 132px;
    flex-shrink: 0;
    overflow: hidden;
  }

  .artwork-strip__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    font-size: 0.8rem;
    letter-spacing: 0.06em;
    color: var(--bg-l);
  }

  .artwork-strip__list {
    display: flex;
    align-items: stretch;
    gap: 10px;
    margin: 0;
    padding: 10px 14px;
    height: 100%;
    box-sizing: border-box;
    list-style: none;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: thin;
    scrollbar-color: var(--bg-hl) transparent;
  }

  .artwork {
    flex: 0 0 auto;
  }

  .artwork__btn {
    all: unset;
    display: flex;
    flex-direction: column;
    width: 96px;
    cursor: pointer;
    box-sizing: border-box;

    &:hover .artwork__img {
      outline: 2px solid var(--bg);
    }

    &:focus-visible {
      outline: 2px solid #fff;
      outline-offset: 2px;
    }
  }

  .artwork__img {
    width: 96px;
    height: 76px;
    object-fit: cover;
    background: var(--bg-hl);
    border-radius: 2px;
    display: block;
    transition: outline 0.1s;
  }

  .artwork__img--placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--bg-l);
    font-size: 0.7rem;
  }

  .artwork__meta {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 6px;
    margin-top: 4px;
    font-size: 0.62rem;
    line-height: 1.1;
    color: var(--bg-l);
  }

  .artwork__title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .artwork__year {
    font-weight: 600;
    color: var(--bg);
    flex-shrink: 0;
  }
</style>
