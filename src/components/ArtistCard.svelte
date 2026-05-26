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
  $: artworksByMuseum = artworks.reduce((acc, a) => {
    const key = a.museum || '';
    if (!acc.has(key)) acc.set(key, []);
    acc.get(key).push(a);
    return acc;
  }, new Map());

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

      <!-- Obras e Acervos (primeiro) -->
      {#if artworks.length > 0}
        <section class="section">
          <h3 class="section__label">Obras e Acervos</h3>
          <ul class="artwork-list">
            {#each [...artworksByMuseum.entries()] as [museum, works]}
              <li class="artwork">
                {#each works as a, i}
                  {#if a.url}<a href={a.url} target="_blank" rel="noopener noreferrer">{a.title || '(sem título)'}{#if a.year && a.year !== UNDATED_YEAR} ({a.year}){/if}</a>{:else}<span class="artwork__title">{a.title || '(sem título)'}{#if a.year && a.year !== UNDATED_YEAR} ({a.year}){/if}</span>{/if}{#if i < works.length - 1}, {/if}
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
                <button class="info-btn" aria-label="Informações sobre confiança">ⓘ</button>
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
                  <button class="info-btn" aria-label="Informações sobre confiança">ⓘ</button>
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
                <button class="info-btn" aria-label="Informações sobre confiança">ⓘ</button>
              </div>
            {/if}
          </div>
        </section>
      {/if}

    </div>
  </aside>
{/if}

<style lang="scss">
  .artist-card {
    position: absolute;
    bottom: calc(var(--artwork-strip-inset, 0px) + 16px);
    right: 16px;
    z-index: 20;
    width: 360px;
    max-width: calc(100vw - 32px);
    max-height: calc(100vh - var(--menu-height) - 32px);
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
    font-size: 17px;
    font-weight: 700;
    letter-spacing: -0.01em;
    line-height: 1.2;
  }

  .artist-card__close {
    all: unset;
    color: var(--txt-hl);
    font-size: 1.4rem;
    line-height: 1;
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
    font-size: 14px;
    font-weight: 700;
    letter-spacing: -0.01em;
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
    font-size: 0.75rem;
    margin-top: 3px;
    line-height: 1;
  }

  .section__text {
    margin: 0;
    font-size: 14px;
    font-weight: 400;
    letter-spacing: -0.01em;
    color: var(--txt);
    line-height: 1.35;
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
    font-size: 14px;
    font-weight: 400;
    letter-spacing: -0.01em;
    text-transform: uppercase;
    padding: 2px 6px;
    border-radius: 2px;
    border: 1px solid var(--bg-hl);
    color: var(--txt-l);
    white-space: nowrap;
    line-height: 1.4;
  }

  .info-btn {
    all: unset;
    font-size: 14px;
    color: var(--txt-hl);
    cursor: pointer;
    line-height: 1;

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
    font-size: 14px;
    font-weight: 400;
    letter-spacing: -0.01em;
    line-height: 1.35;
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
