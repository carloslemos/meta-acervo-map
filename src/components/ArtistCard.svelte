<script>
  /**
   * Card persistente do artista. Substitui o tooltip efêmero.
   *
   * Aberto enquanto `artist` (bubble clicada) não for nulo. O fechamento é
   * controlado por `App.svelte` via evento `close`. Enquanto aberto, o mapa
   * é bloqueado (responsabilidade de `App.svelte`).
   */
  import { createEventDispatcher } from 'svelte';
  import { CONFIDENCE_LABEL, UNDATED_YEAR, ARTIST_CARD_WIDTH } from '../lib/constants.js';

  /** Bubble clicada — usada apenas para obter o nome do criador. */
  export let artist = null;
  /** Todas as bubbles do dataset (já carregadas, sem filtros aplicados). */
  export let allBubbles = [];
  /** Map<creator, obras[]> de `loadData()`. */
  export let artworksByCreator = new Map();

  const dispatch = createEventDispatcher();

  function close() {
    dispatch('close');
  }

  // Bubbles do mesmo criador.
  $: creatorName = artist?.creator ?? '';
  $: creatorBubbles = creatorName
    ? allBubbles.filter(b => b.creator === creatorName)
    : [];
  $: birth = creatorBubbles.find(b => b.type === 'birth') ?? null;
  $: death = creatorBubbles.find(b => b.type === 'death') ?? null;
  $: educations = creatorBubbles.filter(b => b.type === 'education');

  // Obras agrupadas por acervo (museum).
  $: artworks = (creatorName && artworksByCreator.get(creatorName)) || [];
  $: artworksByMuseum = groupByMuseum(artworks);

  function groupByMuseum(list) {
    /** @type {Map<string, object[]>} */
    const map = new Map();
    for (const a of list) {
      const key = a.museum || 'Sem acervo';
      const bucket = map.get(key);
      if (bucket) bucket.push(a);
      else map.set(key, [a]);
    }
    return [...map.entries()].map(([museum, items]) => ({ museum, items }));
  }

  function confidenceLabel(value) {
    if (!value) return '';
    return CONFIDENCE_LABEL[value] ?? '';
  }
</script>

{#if artist}
  <aside class="artist-card" role="dialog" aria-label="Detalhes do artista">
    <header class="artist-card__header">
      <h2 class="artist-card__name">{creatorName}</h2>
      <button class="artist-card__close" on:click={close} aria-label="Fechar">×</button>
    </header>

    <div class="artist-card__body">
      {#if birth}
        <section class="section">
          <h3 class="section__title">Nascimento</h3>
          <p class="section__line">
            {birth.place || '—'}
            {#if confidenceLabel(birth.confidence)}
              <span class="confidence">qualidade: {confidenceLabel(birth.confidence)}</span>
            {/if}
          </p>
        </section>
      {/if}

      {#if educations.length > 0}
        <section class="section">
          <h3 class="section__title">Estudos</h3>
          {#each educations as e (e.id)}
            <p class="section__line">
              {e.schoolName || e.place || '—'}
              {#if e.dates}
                <span class="dates"> · {e.dates}</span>
              {/if}
              {#if confidenceLabel(e.confidence)}
                <span class="confidence">qualidade: {confidenceLabel(e.confidence)}</span>
              {/if}
            </p>
          {/each}
        </section>
      {/if}

      {#if death}
        <section class="section">
          <h3 class="section__title">Morte</h3>
          <p class="section__line">
            {death.place || '—'}
            {#if confidenceLabel(death.confidence)}
              <span class="confidence">qualidade: {confidenceLabel(death.confidence)}</span>
            {/if}
          </p>
        </section>
      {/if}

      {#if artworks.length > 0}
        <section class="section">
          <h3 class="section__title">Obras ({artworks.length})</h3>
          {#each artworksByMuseum as group (group.museum)}
            <div class="museum-group">
              <h4 class="museum-group__title">{group.museum}</h4>
              <ul class="artwork-list">
                {#each group.items as a (a.id)}
                  <li class="artwork">
                    {#if a.url}
                      <a href={a.url} target="_blank" rel="noopener noreferrer">{a.title || '(sem título)'}</a>
                    {:else}
                      <span>{a.title || '(sem título)'}</span>
                    {/if}
                    {#if a.year && a.year !== UNDATED_YEAR}
                      <span class="artwork__year">({a.year})</span>
                    {/if}
                  </li>
                {/each}
              </ul>
            </div>
          {/each}
        </section>
      {/if}
    </div>
  </aside>
{/if}

<style lang="scss">
  .artist-card {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 20;
    /* width: ARTIST_CARD_WIDTH (360px) */
    width: 360px;
    max-width: calc(100vw - 32px);
    max-height: calc(100vh - var(--menu-height, 60px) - 32px);
    display: flex;
    flex-direction: column;
    background: var(--bg);
    color: var(--txt);
    border: 1px solid var(--bg-hl, #333);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    border-radius: 4px;
    overflow: hidden;
  }

  .artist-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    background: var(--bg-l, #1a1a1a);
    border-bottom: 1px solid var(--bg-hl, #333);
  }

  .artist-card__name {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.2;
  }

  .artist-card__close {
    background: transparent;
    color: inherit;
    border: none;
    font-size: 1.5rem;
    line-height: 1;
    cursor: pointer;
    padding: 0 4px;
  }

  .artist-card__body {
    padding: 12px 14px;
    overflow-y: auto;
    font-size: 0.85rem;
    line-height: 1.4;
  }

  .section {
    margin-bottom: 14px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .section__title {
    margin: 0 0 4px;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    opacity: 0.7;
  }

  .section__line {
    margin: 0 0 4px;
  }

  .confidence {
    display: inline-block;
    margin-left: 8px;
    font-size: 0.7rem;
    opacity: 0.6;
    font-style: italic;
  }

  .dates {
    opacity: 0.7;
  }

  .museum-group {
    margin-top: 8px;
  }

  .museum-group__title {
    margin: 0 0 4px;
    font-size: 0.78rem;
    font-weight: 600;
    opacity: 0.85;
  }

  .artwork-list {
    list-style: none;
    margin: 0;
    padding: 0 0 0 8px;
  }

  .artwork {
    margin-bottom: 2px;

    a {
      color: var(--accent, #4af);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  .artwork__year {
    opacity: 0.6;
    margin-left: 4px;
  }
</style>
