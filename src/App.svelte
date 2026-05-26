<script>
  import { onMount } from 'svelte';
  import WorldMap from './components/WorldMap.svelte';
  import Header from './components/Header.svelte';
  import ProjectionToggle from './components/ProjectionToggle.svelte';
  import Sidebar from './components/Sidebar.svelte';
  import ArtistCard from './components/ArtistCard.svelte';
  import ArtworkStrip from './components/ArtworkStrip.svelte';
  import MapStats from './components/MapStats.svelte';
  import { loadData } from './lib/dataUtils.js';
  import { applyFilters, applyTrajectoryFilter } from './lib/filterModel.js';
import {
  UNDATED_YEAR,
  ARTWORK_STRIP_HEIGHT_EXPANDED,
  ARTWORK_STRIP_HEIGHT_COLLAPSED,
  BREAKPOINT_MOBILE,
  SIDEBAR_BACKDROP_OPACITY,
  SIDEBAR_BACKDROP_COLOR,
} from './lib/constants.js';

  const LS_STRIP_KEY = 'meta-acervo:artwork-strip-collapsed';

  /** Lê estado collapsed do localStorage (fallback false). */
  function readCollapsed() {
    try { return localStorage.getItem(LS_STRIP_KEY) === 'true'; } catch { return false; }
  }

  /** Persiste estado collapsed sem lançar exceção (quota / modo privado). */
  function saveCollapsed(val) {
    try { localStorage.setItem(LS_STRIP_KEY, String(val)); } catch { /* silencioso */ }
  }

  let bubbles = [];
  let trajectories = [];
  let acervoBubbles = [];
  let artworksByCreator = new Map();
  let selectedArtist = null;
  let activeTypes = new Set(['birth', 'education']);
  let projectionType = '3d';
  let activeAcervos = new Set();
  let allAcervos = [];
  let allGenders = [];
  let activeGenders = new Set();
  let selectedCreators = new Set();
  let selectedSchools = new Set();
  let selectedNationalities = new Set();
  /** Localidade ativa (nome de país OU de continente). `''` = sem filtro. */
  let selectedLocalidade = '';
  /** Visibilidade das trajetórias (linhas conectando bubbles do mesmo criador). */
  let showTrajectories = true;
  let allCreators = [];
  let allSchools = [];
  let allNationalities = [];
  let loading = true;
  let error = null;

  // Estado da sidebar: aberta por padrão em desktop (≥1024px), fechada em mobile
  let sidebarOpen = typeof window !== 'undefined' ? window.innerWidth >= 1024 : false;

  /** Estado collapse do ArtworkStrip — controla `bottomInset` do WorldMap.
   * Inicializado do localStorage para persistir entre reloads. */
  let artworkStripCollapsed = readCollapsed();
  $: saveCollapsed(artworkStripCollapsed);
  /** Altura ocupada pela faixa: ARTWORK_STRIP_HEIGHT_EXPANDED quando expandida,
   * ARTWORK_STRIP_HEIGHT_COLLAPSED quando colapsada.
   * Quando não há obras, a faixa não renderiza e o inset é 0. */
  $: artworkStripInset = artworksForStrip.length === 0 ? 0 : (artworkStripCollapsed ? ARTWORK_STRIP_HEIGHT_COLLAPSED : ARTWORK_STRIP_HEIGHT_EXPANDED);

  onMount(async () => {
    try {
      const data = await loadData();
      bubbles = data.bubbles;
      trajectories = data.trajectories;
      acervoBubbles = data.acervoBubbles ?? [];
      artworksByCreator = data.artworksByCreator ?? new Map();
      allAcervos = [...new Set(bubbles.flatMap(b => b.acervos).filter(Boolean))].sort();
      // activeAcervos permanece Set vazio → sem filtro ativo, mostra tudo
      allGenders = [...new Set(bubbles.map(b => b.gender).filter(Boolean))].sort();
      activeGenders = new Set(allGenders);
      allCreators = [...new Set(bubbles.map(b => b.creator).filter(Boolean))].sort();
      allSchools = [...new Set(bubbles.flatMap(b => b.educatedAt))].sort();
      allNationalities = [...new Set(bubbles.map(b => b.nationality).filter(Boolean))].sort();
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  });

  /** Atualiza o conjunto de tipos ativos (nascimento/estudo/morte/acervo). */
  function handleFilterChange(event) {
    activeTypes = event.detail;
  }

  /** Atualiza a localidade ativa (string vazia limpa o filtro). */
  function handleLocalidadeChange(event) {
    selectedLocalidade = event.detail ?? '';
  }

  /** Alterna visibilidade das trajetórias. */
  function handleTrajectoriesChange(event) {
    showTrajectories = event.detail;
  }

  /** Alterna a projeção entre 2D e 3D. */
  function handleProjectionChange(event) {
    projectionType = event.detail;
  }

  /** Atualiza o conjunto de acervos ativos. */
  function handleAcervoChange(event) {
    activeAcervos = event.detail;
  }

  /** Atualiza o conjunto de gêneros ativos. */
  function handleGenderChange(event) {
    activeGenders = event.detail;
  }

  /** Atualiza o conjunto de criadores selecionados. */
  function handleCreatorsChange(event) {
    selectedCreators = event.detail;
  }

  /** Atualiza o conjunto de escolas selecionadas. */
  function handleSchoolsChange(event) {
    selectedSchools = event.detail;
  }

  /** Atualiza o conjunto de nacionalidades selecionadas. */
  function handleNationalitiesChange(event) {
    selectedNationalities = event.detail;
  }

  /** Alterna a sidebar (mobile). */
  function handleToggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }

  /** Fecha a sidebar (mobile). */
  function handleCloseSidebar() {
    sidebarOpen = false;
  }

  /** Click numa bubble do mapa: abre/atualiza o ArtistCard. */
  function handleArtistClick(event) {
    selectedArtist = event.detail;
  }

  /** Click numa obra do ArtworkStrip: trata como artistclick a partir do nome. */
  function handleArtistSelect(event) {
    const creator = event.detail;
    if (!creator) return;
    selectedArtist = { creator };
  }

  /** Fecha o ArtistCard e libera o mapa. */
  function handleArtistClose() {
    selectedArtist = null;
  }

  $: mapLocked = selectedArtist !== null;

  $: bubblesForMap = applyFilters(bubbles, {
    activeAcervos,
    activeGenders,
    selectedCreators,
    selectedSchools,
    selectedNationalities,
    selectedLocalidade: selectedLocalidade || null,
  });
  // Bubbles de acervo não passam pelos filtros de sidebar: visibilidade
  // depende somente da pill ACERVO em `activeTypes` (filtrada dentro do WorldMap).
  $: bubblesWithAcervos = [...bubblesForMap, ...acervoBubbles];
  // Segmentos visíveis apenas quando ambos os extremos passam pelos filtros atuais (sidebar + header).
  $: visibleBubbleIds = new Set(bubblesForMap.filter(b => activeTypes.has(b.type)).map(b => b.id));
  $: trajectoriesForMap = showTrajectories ? applyTrajectoryFilter(trajectories, visibleBubbleIds) : [];
  // Opções de localidade: países + continentes únicos das bubbles carregadas.
  $: allLocalidades = [...new Set([
    ...bubbles.map(b => b.country),
    ...bubbles.map(b => b.continent),
  ].filter(Boolean))].sort();

  // ── Obras para o ArtworkStrip: quando há artista selecionado, mostra só as
  // obras dele; caso contrário, flatmap dos criadores visíveis, dedup por id, ordenado.
  $: artworksForStrip = (() => {
    const isUndated = (y) => y === null || y === undefined || y === UNDATED_YEAR || typeof y !== 'number' || Number.isNaN(y);
    const sortWorks = (arr) => [...arr].sort((a, b) => {
      const au = isUndated(a.year); const bu = isUndated(b.year);
      if (au && bu) return 0; if (au) return 1; if (bu) return -1;
      return b.year - a.year;
    });
    if (selectedArtist?.creator) {
      const list = artworksByCreator.get(selectedArtist.creator) ?? [];
      const filtered = activeAcervos.size > 0 ? list.filter(art => activeAcervos.has(art.museum)) : list;
      return sortWorks(filtered);
    }
    const visibleCreators = new Set(bubblesForMap.map(b => b.creator).filter(Boolean));
    const seen = new Set();
    const out = [];
    for (const creator of visibleCreators) {
      const list = artworksByCreator.get(creator);
      if (!list) continue;
      for (const art of list) {
        if (seen.has(art.id)) continue;
        if (activeAcervos.size > 0 && !activeAcervos.has(art.museum)) continue;
        seen.add(art.id);
        out.push(art);
      }
    }
    return sortWorks(out);
  })();
  $: birthCount = bubblesForMap.filter(b => b.type === 'birth').length;
  $: deathCount = bubblesForMap.filter(b => b.type === 'death').length;

  // ── Stats agregados sobre o conjunto filtrado atual ────────────────
  $: statsBlock = (() => {
    const artists = new Set();
    const schools = new Set();
    for (const b of bubblesForMap) {
      if (b.creator) artists.add(b.creator);
      for (const s of b.educatedAt) schools.add(s);
    }
    let obras = 0;
    const acervos = new Set();
    for (const creator of artists) {
      const list = artworksByCreator.get(creator);
      if (!list) continue;
      for (const a of list) {
        if (activeAcervos.size > 0 && !activeAcervos.has(a.museum)) continue;
        obras++;
        if (a.museum) acervos.add(a.museum);
      }
    }
    return {
      acervos: activeAcervos.size > 0 ? activeAcervos.size : acervos.size,
      artistas: artists.size,
      escolas: schools.size,
      obras,
    };
  })();
</script>

<div class="layout" class:layout--sb-closed={!sidebarOpen}>

  <Sidebar
    isOpen={sidebarOpen}
    onClose={handleCloseSidebar}
    onToggle={handleToggleSidebar}
    acervos={allAcervos}
    {activeAcervos}
    {allGenders}
    {activeGenders}
    {allCreators}
    {selectedCreators}
    {allSchools}
    {selectedSchools}
    {allNationalities}
    {selectedNationalities}
    on:acervochange={handleAcervoChange}
    on:genderchange={handleGenderChange}
    on:creatorschange={handleCreatorsChange}
    on:schoolschange={handleSchoolsChange}
    on:nationalitieschange={handleNationalitiesChange}
  />

  <div class="main-area">
  <header class="header">
    <div class="header__controls">
      <Header
        {activeTypes}
        {selectedLocalidade}
        localidades={allLocalidades}
        {showTrajectories}
        on:typeschange={handleFilterChange}
        on:localidadechange={handleLocalidadeChange}
        on:trajectorieschange={handleTrajectoriesChange}
      />
    </div>

  </header>

  <div class="subheader">
    <Header
      {activeTypes}
      {selectedLocalidade}
      localidades={allLocalidades}
      {showTrajectories}
      on:typeschange={handleFilterChange}
      on:localidadechange={handleLocalidadeChange}
      on:trajectorieschange={handleTrajectoriesChange}
    />
  </div>

  <div class="content">
    {#if sidebarOpen}
      <div 
        class="sidebar-backdrop" 
        role="presentation" 
        on:click={handleCloseSidebar}
        on:keydown={(e) => e.key === 'Escape' && handleCloseSidebar()}
      ></div>
    {/if}
    
    <!-- Tab de reabertura removida: collapse-btn na Sidebar é absoluto e sempre visível -->

    <main class="map-container" style="--artwork-strip-inset: {artworkStripInset}px">
      {#if loading}
        <div class="state-message">Carregando dados…</div>
      {:else if error}
        <div class="state-message state-message--error">Erro: {error}</div>
      {:else}
        <WorldMap
          bubbles={bubblesWithAcervos}
          trajectories={trajectoriesForMap}
          {activeTypes}
          {projectionType}
          locked={mapLocked}
          pinnedCreator={selectedArtist?.creator ?? null}
          bottomInset={artworkStripInset}
          on:artistclick={handleArtistClick}
        />
        <ArtistCard
          artist={selectedArtist}
          allBubbles={bubbles}
          {artworksByCreator}
          on:close={handleArtistClose}
        />
        <div class="map-overlay-right">
          <ProjectionToggle {projectionType} on:change={handleProjectionChange} />
        </div>
        <MapStats stats={statsBlock} />
        <ArtworkStrip
          artworks={artworksForStrip}
          selectedCreator={selectedArtist?.creator ?? null}
          bind:collapsed={artworkStripCollapsed}
          on:artistselect={handleArtistSelect}
        />
      {/if}
    </main>
  </div>
  </div>
</div>

<style lang="scss">
  .layout {
    display: flex;
    flex-direction: row;
    height: 100vh;
    background: var(--bg);
    color: var(--txt);
    overflow: hidden;
  }

  .main-area {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .header {
    display: flex;
    align-items: center;
    gap: 30px;
    padding: 0 1.5rem 0 calc(1.5rem + 28px);
    height: var(--menu-height);
    background: var(--bg);
    color: var(--txt);
    border-bottom: 1px solid var(--bg-hl);
    flex-shrink: 0;
    flex-wrap: nowrap;
    overflow: visible;
  }

  .header__controls {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: nowrap;
    min-width: 0;
  }

  /* ─── Subheader para filtros (mobile) ──────────────────────────────── */
  .subheader {
    display: none;
    background: var(--txt);
    color: var(--bg);
    border-bottom: 1px solid var(--bg-hl);
    padding: 0.75rem 1.5rem;
    gap: 16px;
    flex-shrink: 0;
    flex-wrap: wrap;
    align-items: center;
  }

  .content {
    flex: 1;
    overflow: hidden;
    position: relative;
  }

  .map-container {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: var(--bg);
  }

  .map-overlay-right {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 10; /* acima do canvas, abaixo do ArtistCard (z-index: 20) */
    pointer-events: none;
  }

  .state-message {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    font-size: 0.85rem;
    color: var(--txt-hl);
  }

  .state-message--error {
    color: #e44;
  }

  /* ─── Menu toggle (hamburger) — REMOVIDO nessa visão ─────────────────────── */
  /* (hamburguer abandonado no redesign) */

  /* Sidebar backdrop (overlay quando sidebar aberta em mobile) ─────── */
  .sidebar-backdrop {
    display: none;
    position: fixed;
    inset: 0;
    /* background: SIDEBAR_BACKDROP_COLOR (rgba(0, 0, 0, 0.5)) */
    background: rgba(0, 0, 0, 0.5);
    z-index: 99;

  }

  /* Responsive: mobile (<BREAKPOINT_MOBILE: 1023px) ────────────────────────────────────── */
  @media (max-width: 1023px) {
    .sidebar-backdrop {
      display: block;
    }

    .header__controls {
      display: none;
    }

    .subheader {
      display: flex;
    }
  }
</style>
