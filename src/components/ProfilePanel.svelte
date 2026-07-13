<script>
  import { onMount } from 'svelte';
  import { profileStats } from '../lib/profileStats.js';
  import { LS_PROFILE_PANEL_KEY, FILTER_LABELS, PROFILE_PANEL_LABELS } from '../lib/constants.js';

  /** Locale ativo: 'pt' | 'en'. */
  export let locale = 'pt';

  /** Bubbles filtradas passadas pelo App.svelte (excluir acervos internamente). */
  export let bubbles = [];
  /** Faixa de layout: 'mobile' | 'tablet' | 'desktop'. */
  export let breakpoint = 'desktop';

  // ─── Estado colapsado — persiste em localStorage ───────────────────────────
  let collapsed = (() => {
    try {
      const saved = localStorage.getItem(LS_PROFILE_PANEL_KEY);
      if (saved !== null) return saved === 'true';
    } catch { /* silencioso */ }
    // Padrão: colapsado em mobile, aberto em tablet/desktop
    return breakpoint === 'mobile';
  })();

  function toggleCollapsed() {
    collapsed = !collapsed;
    try { localStorage.setItem(LS_PROFILE_PANEL_KEY, String(collapsed)); } catch { /* silencioso */ }
  }

  // ─── Métricas derivadas reativamente ──────────────────────────────────────
  $: stats = profileStats(bubbles.filter(b => b.type !== 'acervo'), locale);
  $: empty = !stats.genderTop && !stats.formationTop && stats.birthByRegion.length === 0;

  // ─── Geometria do donut SVG ────────────────────────────────────────────────
  const DONUT_R = 26;
  const DONUT_SW = 5;
  const DONUT_SIZE = (DONUT_R + DONUT_SW) * 2 + 2;
  const CIRCUMFERENCE = 2 * Math.PI * DONUT_R;

  function arcDash(pct) {
    const filled = (pct / 100) * CIRCUMFERENCE;
    return `${filled} ${CIRCUMFERENCE}`;
  }
</script>

<!-- Botão de colapso / cabeçalho do painel -->
<div class="profile-panel" class:profile-panel--collapsed={collapsed}>
  <button
    type="button"
    class="profile-panel__header"
    on:click={toggleCollapsed}
    aria-expanded={!collapsed}
    aria-controls="profile-panel-content"
  >
    <span class="profile-panel__title">{PROFILE_PANEL_LABELS[locale].title}</span>
    <span class="profile-panel__chevron" aria-hidden="true">{collapsed ? '«' : '»'}</span>
  </button>

  {#if !collapsed}
    <div class="profile-panel__content" id="profile-panel-content">
      {#if empty}
        <p class="profile-panel__empty">{PROFILE_PANEL_LABELS[locale].emptyMessage}</p>
      {:else}
        <!-- Donuts: gênero + local de formação predominante -->
        <div class="profile-panel__donuts">
          <!-- Donut: gênero -->
          <div class="profile-panel__donut-item">
            <svg
              width={DONUT_SIZE}
              height={DONUT_SIZE}
              viewBox="0 0 {DONUT_SIZE} {DONUT_SIZE}"
              aria-hidden="true"
            >
              <!-- Trilho cinza -->
              <circle
                cx={DONUT_SIZE / 2}
                cy={DONUT_SIZE / 2}
                r={DONUT_R}
                fill="none"
                stroke="var(--neutral-70)"
                stroke-width={DONUT_SW}
              />
              <!-- Arco preenchido -->
              {#if stats.genderTop}
                {#if stats.genderTop.pct === 100}
                  <!-- A 100%, desenha círculo sólido completo -->
                  <circle
                    cx={DONUT_SIZE / 2}
                    cy={DONUT_SIZE / 2}
                    r={DONUT_R}
                    fill="none"
                    stroke="var(--neutral-30)"
                    stroke-width={DONUT_SW}
                    stroke-linecap="round"
                  />
                {:else}
                  <!-- Parcial: arco proporcional -->
                  <circle
                    cx={DONUT_SIZE / 2}
                    cy={DONUT_SIZE / 2}
                    r={DONUT_R}
                    fill="none"
                    stroke="var(--neutral-30)"
                    stroke-width={DONUT_SW}
                    stroke-linecap="round"
                    stroke-dasharray={arcDash(stats.genderTop.pct)}
                    transform="rotate(-90 {DONUT_SIZE / 2} {DONUT_SIZE / 2})"
                  />
                {/if}
              {/if}
              <!-- % centralizado -->
              <text
                x={DONUT_SIZE / 2}
                y={DONUT_SIZE / 2}
                text-anchor="middle"
                dominant-baseline="central"
                class="donut-pct"
                fill="var(--txt)"
              >{stats.genderTop?.pct ?? 0}%</text>
            </svg>
            <p class="profile-panel__donut-label">{FILTER_LABELS[locale].gender}</p>
            <p class="profile-panel__donut-value">{stats.genderTop?.label ?? '—'}</p>
          </div>

          <!-- Donut: local de formação -->
          <div class="profile-panel__donut-item">
            <svg
              width={DONUT_SIZE}
              height={DONUT_SIZE}
              viewBox="0 0 {DONUT_SIZE} {DONUT_SIZE}"
              aria-hidden="true"
            >
              <circle
                cx={DONUT_SIZE / 2}
                cy={DONUT_SIZE / 2}
                r={DONUT_R}
                fill="none"
                stroke="var(--neutral-70)"
                stroke-width={DONUT_SW}
              />
              {#if stats.formationTop}
                {#if stats.formationTop.pct === 100}
                  <!-- A 100%, desenha círculo sólido completo -->
                  <circle
                    cx={DONUT_SIZE / 2}
                    cy={DONUT_SIZE / 2}
                    r={DONUT_R}
                    fill="none"
                    stroke="var(--neutral-30)"
                    stroke-width={DONUT_SW}
                    stroke-linecap="round"
                  />
                {:else}
                  <!-- Parcial: arco proporcional -->
                  <circle
                    cx={DONUT_SIZE / 2}
                    cy={DONUT_SIZE / 2}
                    r={DONUT_R}
                    fill="none"
                    stroke="var(--neutral-30)"
                    stroke-width={DONUT_SW}
                    stroke-linecap="round"
                    stroke-dasharray={arcDash(stats.formationTop.pct)}
                    transform="rotate(-90 {DONUT_SIZE / 2} {DONUT_SIZE / 2})"
                  />
                {/if}
              {/if}
              <text
                x={DONUT_SIZE / 2}
                y={DONUT_SIZE / 2}
                text-anchor="middle"
                dominant-baseline="central"
                class="donut-pct"
                fill="var(--txt)"
              >{stats.formationTop?.pct ?? 0}%</text>
            </svg>
            <p class="profile-panel__donut-label">{PROFILE_PANEL_LABELS[locale].formationLabel}</p>
            <p class="profile-panel__donut-value">{stats.formationTop?.label ?? '—'}</p>
          </div>
        </div>

        <!-- Barras: nascimento por região -->
        {#if stats.birthByRegion.length > 0}
          <section class="profile-panel__bars-section">
            <h3 class="profile-panel__bars-title">{PROFILE_PANEL_LABELS[locale].birthLabel}</h3>
            {#each stats.birthByRegion as row}
              <div class="profile-panel__bar-row">
                <span class="profile-panel__bar-label">{row.label}</span>
                <div class="profile-panel__bar-track">
                  <div class="profile-panel__bar-fill" style="width: {row.pct}%"></div>
                </div>
                <span class="profile-panel__bar-pct">{row.pct}%</span>
              </div>
            {/each}
          </section>
        {/if}

        <!-- Barras: formação por região -->
        {#if stats.formationByRegion.length > 0}
          <section class="profile-panel__bars-section">
            <h3 class="profile-panel__bars-title">{PROFILE_PANEL_LABELS[locale].formationLabel}</h3>
            {#each stats.formationByRegion as row}
              <div class="profile-panel__bar-row">
                <span class="profile-panel__bar-label">{row.label}</span>
                <div class="profile-panel__bar-track">
                  <div class="profile-panel__bar-fill" style="width: {row.pct}%"></div>
                </div>
                <span class="profile-panel__bar-pct">{row.pct}%</span>
              </div>
            {/each}
          </section>
        {/if}
      {/if}
    </div>
  {/if}
</div>

<style lang="scss">
  .profile-panel {
    position: absolute;
    top: 0;
    right: 0;
    width: 220px;
    background: var(--bg-c); /* rgba(18,18,18,0.8) */
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-left: 1px solid var(--bg-hl);
    border-bottom: 1px solid var(--bg-hl);
    border-bottom-left-radius: 8px;
    z-index: 10;
    font-family: inherit;
    pointer-events: auto;
  }

  .profile-panel--collapsed {
    width: auto;
    border: none;
    background: transparent;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }

  .profile-panel__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 8px 12px;
    background: var(--bg-c);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: none;
    border-bottom: 1px solid var(--bg-hl);
    border-bottom-left-radius: 8px;
    color: var(--txt);
    font-family: inherit;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    white-space: nowrap;
    gap: 8px;

    .profile-panel--collapsed & {
      border: 1px solid var(--bg-hl);
      border-radius: 4px;
    }

    &:hover {
      background: var(--bg-l);
    }
  }

  .profile-panel__chevron {
    font-size: 12px;
    color: var(--txt-l);
    flex-shrink: 0;
  }

  .profile-panel__content {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .profile-panel__empty {
    font-size: 11px;
    color: var(--txt-hl);
    text-align: center;
    padding: 12px 0;
  }

  /* ─── Donuts ──────────────────────────────────────────────────────────── */
  .profile-panel__donuts {
    display: flex;
    gap: 12px;
    justify-content: space-around;
  }

  .profile-panel__donut-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    flex: 1;
  }

  :global(.donut-pct) {
    font-size: 13px;
    font-weight: 700;
    font-family: inherit;
  }

  .profile-panel__donut-label {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--txt-hl);
    margin: 0;
  }

  .profile-panel__donut-value {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--txt);
    margin: 0;
    text-align: center;
    max-width: 80px;
    word-break: break-word;
    hyphens: auto;
  }

  /* ─── Barras horizontais ──────────────────────────────────────────────── */
  .profile-panel__bars-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .profile-panel__bars-title {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--txt-l);
    margin: 0 0 4px;
  }

  .profile-panel__bar-row {
    display: grid;
    grid-template-columns: 1fr auto auto;
    align-items: center;
    gap: 6px;
  }

  .profile-panel__bar-label {
    font-size: 9px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--txt);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .profile-panel__bar-track {
    width: 60px;
    height: 3px;
    background: var(--neutral-70);
    border-radius: 2px;
    overflow: hidden;
  }

  .profile-panel__bar-fill {
    height: 100%;
    background: var(--neutral-30);
    border-radius: 2px;
    transition: width 0.3s ease-out;
  }

  .profile-panel__bar-pct {
    font-size: 9px;
    color: var(--txt-l);
    min-width: 26px;
    text-align: right;
  }
</style>
