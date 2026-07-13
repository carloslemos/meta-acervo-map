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

  /** Locale ativo: 'pt' | 'en'. */
  export let locale = 'pt';
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
  $: artworksByMuseum = artworks.reduce((acc, a) => {
    const key = a.museum || '';
    if (!acc.has(key)) acc.set(key, []);
    acc.get(key).push(a);
    return acc;
  }, new Map());

  function confidenceLabel(value) {
    if (!value) return '';
    return CONFIDENCE_LABEL[locale]?.[value] ?? '';
  }
</script>

{#if artist}
  <div class="artist-card" role="dialog" aria-label="Detalhes do artista">
    <header class="artist-card__header">
      <h2 class="artist-card__name">{creatorName}</h2>
      <button class="artist-card__close" on:click={close} aria-label="Fechar">×</button>
    </header>

    <div class="artist-card__body">

      <!-- Obras e Acervos (primeiro) -->
      {#if artworks.length > 0}
        <section class="section">
          <h3 class="section__label">Obras e Acervos</h3>
          <ul class="artwork-list">
            {#each [...artworksByMuseum.entries()] as [museum, works]}
              <li class="artwork">
                {#each works as a, i}
                  {#if a.url}<a href={a.url} target="_blank" rel="noopener noreferrer">{a.title || '(sem título)'}{#if a.year && a.year !== UNDATED_YEAR} ({a.year}){/if}</a>{:else}<span class="artwork__title">{a.title || '(sem título)'}{#if a.year && a.year !== UNDATED_YEAR} ({a.year}){/if}</span>{/if}{#if i < works.length - 1}{', '}{/if}
                {/each}
                {#if museum}<span class="artwork__museum"> — {museum}</span>{/if}
              </li>
            {/each}
          </ul>
        </section>
      {/if}

      <!-- Nascimento -->
      {#if birth}
        <section class="section">
          <div class="section__row">
            <div class="section__left">
              <span class="section__dot" style="color: var(--birth-color)">●</span>
              <div>
                <h3 class="section__label">Nascimento</h3>
                <p class="section__text">{birth.place || '—'}</p>
              </div>
            </div>
            {#if birth.confidence}
              <div class="section__right">
                <span class="badge">{confidenceLabel(birth.confidence)}</span>
                <button class="info-btn" aria-label="Informações sobre confiança">
                  <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.098 20.196C4.52087 20.196 0 15.6751 0 10.098C0 4.52087 4.52087 0 10.098 0C15.6751 0 20.196 4.52087 20.196 10.098C20.196 15.6751 15.6751 20.196 10.098 20.196ZM9.0882 9.0882V15.147H11.1078V9.0882H9.0882ZM9.0882 5.049V7.0686H11.1078V5.049H9.0882Z" fill="#BBBBBB"/>
                  </svg>
                </button>
              </div>
            {/if}
          </div>
        </section>
      {/if}

      <!-- Local de Estudo -->
      {#if educations.length > 0}
        {#each educations as e (e.id)}
          <section class="section">
            <div class="section__row">
              <div class="section__left">
                <span class="section__dot" style="color: var(--edu-color)">●</span>
                <div>
                  <h3 class="section__label">Local de Estudo</h3>
                  <p class="section__text">{e.schoolName || e.place || '—'}</p>
                </div>
              </div>
              {#if e.confidence}
                <div class="section__right">
                  <span class="badge">{confidenceLabel(e.confidence)}</span>
                  <button class="info-btn" aria-label="Informações sobre confiança">
                    <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10.098 20.196C4.52087 20.196 0 15.6751 0 10.098C0 4.52087 4.52087 0 10.098 0C15.6751 0 20.196 4.52087 20.196 10.098C20.196 15.6751 15.6751 20.196 10.098 20.196ZM9.0882 9.0882V15.147H11.1078V9.0882H9.0882ZM9.0882 5.049V7.0686H11.1078V5.049H9.0882Z" fill="#BBBBBB"/>
                    </svg>
                  </button>
                </div>
              {/if}
            </div>
          </section>
        {/each}
      {/if}

      <!-- Morte -->
      {#if death}
        <section class="section">
          <div class="section__row">
            <div class="section__left">
              <span class="section__dot" style="color: var(--death-color)">●</span>
              <div>
                <h3 class="section__label">Morte</h3>
                <p class="section__text">{death.place || '—'}</p>
              </div>
            </div>
            {#if death.confidence}
              <div class="section__right">
                <span class="badge">{confidenceLabel(death.confidence)}</span>
                <button class="info-btn" aria-label="Informações sobre confiança">
                  <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.098 20.196C4.52087 20.196 0 15.6751 0 10.098C0 4.52087 4.52087 0 10.098 0C15.6751 0 20.196 4.52087 20.196 10.098C20.196 15.6751 15.6751 20.196 10.098 20.196ZM9.0882 9.0882V15.147H11.1078V9.0882H9.0882ZM9.0882 5.049V7.0686H11.1078V5.049H9.0882Z" fill="#BBBBBB"/>
                  </svg>
                </button>
              </div>
            {/if}
          </div>
        </section>
      {/if}

    </div>
  </div>
{/if}

<style lang="scss">
  .artist-card {
    position: absolute;
    bottom: calc(var(--artwork-strip-inset, 0px) + 16px);
    right: 16px;
    z-index: 20;
    width: 360px;
    max-width: calc(100vw - 32px);
    max-height: calc(100vh - var(--menu-height) - var(--artwork-strip-inset, 0px) - 32px);
    display: flex;
    flex-direction: column;
    background: var(--bg-c);
    color: var(--txt);
    border: 1px solid var(--bg-hl);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(10px); 
    border-radius: 4px;
    overflow: hidden;
  }

  .artist-card__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
    padding: 14px 14px 10px;
    flex-shrink: 0;
  }

  .artist-card__name {
    margin: 0;
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    letter-spacing: var(--letter-spacing-tight);
    line-height: var(--line-height-tight);
  }

  .artist-card__close {
    all: unset;
    color: var(--txt-hl);
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-none);
    cursor: pointer;
    flex-shrink: 0;
    margin-top: 1px;

    &:hover { color: var(--txt); }
  }

  .artist-card__body {
    padding: 0 14px 14px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--bg-hl) transparent;
  }

  /* ─── Seções ──────────────────────────────────────────────────────── */

  .section {
    padding: 10px 0;
  }

  .section__label {
    margin: 0 0 5px;
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-bold);
    letter-spacing: var(--letter-spacing-tight);
    text-transform: uppercase;
    color: var(--txt-hl);
  }

  /* linha com dot + info à esquerda, badge à direita */
  .section__row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }

  .section__left {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    min-width: 0;
  }

  .section__dot {
    flex-shrink: 0;
    font-size: var(--font-size-xs);
    margin-top: 3px;
    line-height: var(--line-height-none);
  }

  .section__text {
    margin: 0;
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-regular);
    letter-spacing: var(--letter-spacing-tight);
    color: var(--txt);
    line-height: var(--line-height-normal);
  }

  .section__right {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
    padding-top: 14px; /* alinha com o texto */
  }

  /* ─── Badge de confiança ────────────────────────────────────────────── */

  .badge {
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-regular);
    letter-spacing: var(--letter-spacing-tight);
    text-transform: uppercase;
    padding: 2px 6px;
    border-radius: 2px;
    border: 1px solid var(--bg-hl);
    color: var(--txt-l);
    white-space: nowrap;
    line-height: var(--line-height-normal);
  }

  .info-btn {
    all: unset;
    font-size: var(--font-size-md);
    color: var(--txt-hl);
    cursor: pointer;
    line-height: var(--line-height-none);

    &:hover { color: var(--txt); }
  }

  /* ─── Obras ─────────────────────────────────────────────────────────── */

  .artwork-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .artwork {
    margin-bottom: 5px;
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-regular);
    letter-spacing: var(--letter-spacing-tight);
    line-height: var(--line-height-normal);
    color: var(--txt-l);

    a {
      color: var(--txt-l);
      text-decoration: underline;
      text-underline-offset: 2px;

      &:hover { color: var(--txt); }
    }
  }

  .artwork__title {
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .artwork__museum {
    color: var(--txt-hl);
  }
</style>
