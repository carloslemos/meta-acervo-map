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

  let bubbles = [];
  let trajectories = [];
  let acervoBubbles = [];
  let artworksByCreator = new Map();
  let selectedArtist = null;
  let activeTypes = new Set(['birth', 'education', 'death', 'acervo']);
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

  // Estado da sidebar (mobile)
  let sidebarOpen = false;

  onMount(async () => {
    try {
      const data = await loadData();
      bubbles = data.bubbles;
      trajectories = data.trajectories;
      acervoBubbles = data.acervoBubbles ?? [];
      artworksByCreator = data.artworksByCreator ?? new Map();
      allAcervos = [...new Set(bubbles.flatMap(b => b.acervos).filter(Boolean))].sort();
      activeAcervos = new Set(allAcervos);
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

  // ── Obras para o ArtworkStrip: flatmap dos criadores visíveis, dedup por id, ordenado.
  $: artworksForStrip = (() => {
    const visibleCreators = new Set(bubblesForMap.map(b => b.creator).filter(Boolean));
    const seen = new Set();
    const out = [];
    for (const creator of visibleCreators) {
      const list = artworksByCreator.get(creator);
      if (!list) continue;
      for (const art of list) {
        if (seen.has(art.id)) continue;
        seen.add(art.id);
        out.push(art);
      }
    }
    // Já vem ordenada por criador via sortArtworks no loadData, mas o flatmap
    // entre criadores precisa re-ordenar. Aplicamos a mesma regra inline:
    // year desc, 9999/null/não-numérico ao final preservando ordem original.
    const isUndated = (y) => y === null || y === undefined || y === 9999 || typeof y !== 'number' || Number.isNaN(y);
    return out.sort((a, b) => {
      const au = isUndated(a.year);
      const bu = isUndated(b.year);
      if (au && bu) return 0;
      if (au) return 1;
      if (bu) return -1;
      return b.year - a.year;
    });
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
      obras += list.length;
      for (const a of list) {
        if (a.museum) acervos.add(a.museum);
      }
    }
    return {
      acervos: acervos.size,
      artistas: artists.size,
      escolas: schools.size,
      obras,
    };
  })();
</script>

<div class="layout">
  <header class="header">
    <button class="menu-toggle" on:click={handleToggleSidebar} aria-label="Menu">
      <span class="menu-toggle__icon">☰</span>
    </button>

    <div class="header__brand">
      <span class="header__title">Atlas dos acervos digitais</span>
      <span class="header__sep">—</span>
      <span class="header__subtitle">Mapa de Criadores</span>
    </div>

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
      <ProjectionToggle {projectionType} on:change={handleProjectionChange} />
    </div>

    <div class="header__stats">
      <span class="stat">{birthCount} <span class="stat__label">nasc.</span></span>
      <span class="stat">{deathCount} <span class="stat__label">morte</span></span>
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
    <ProjectionToggle {projectionType} on:change={handleProjectionChange} />
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
    
    <Sidebar
      isOpen={sidebarOpen}
      onClose={handleCloseSidebar}
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

    <main class="map-container">
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
          on:artistclick={handleArtistClick}
        />
        <ArtistCard
          artist={selectedArtist}
          allBubbles={bubbles}
          {artworksByCreator}
          on:close={handleArtistClose}
        />
        <MapStats stats={statsBlock} />
      {/if}
    </main>
  </div>

  {#if !loading && !error}
    <ArtworkStrip
      artworks={artworksForStrip}
      on:artistselect={handleArtistSelect}
    />
  {/if}
</div>

<style lang="scss">
  .layout {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--bg);
    color: var(--txt);
    overflow: hidden;
  }

  .header {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 0 1.5rem;
    height: var(--menu-height);
    background: var(--txt);
    color: var(--bg);
    border-bottom: 1px solid var(--bg-hl);
    flex-shrink: 0;
    flex-wrap: nowrap;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
  }

  .header::-webkit-scrollbar {
    display: none;
  }

  .header__brand {
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex-shrink: 0;
    white-space: nowrap;
  }

  .header__title {
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 0.05em;
  }

  .header__sep {
    color: var(--bg-hl);
  }

  .header__subtitle {
    font-size: 0.8rem;
    color: var(--bg-l);
    letter-spacing: 0.04em;
  }

  .header__controls {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: nowrap;
  }

  .header__stats {
    display: flex;
    gap: 16px;
    flex-shrink: 0;
    white-space: nowrap;
  }

  .stat {
    font-size: 0.8rem;
    color: var(--bg-l);
  }

  .stat__label {
    color: var(--bg-hl);
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
    display: flex;
    flex-direction: row;
    flex: 1;
    overflow: hidden;
  }

  .map-container {
    flex: 1;
    overflow: hidden;
    position: relative;
    background: var(--bg);
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

  /* ─── Menu toggle (hamburger button) ─────────────────────────────────── */
  .menu-toggle {
    display: none;
    background: none;
    border: none;
    color: var(--bg);
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0 1rem;
    flex-shrink: 0;
  }

  .menu-toggle:hover {
    opacity: 0.8;
  }

  .menu-toggle__icon {
    display: block;
    line-height: 1;
  }

  /* ─── Sidebar backdrop (overlay quando sidebar aberta em mobile) ─────── */
  .sidebar-backdrop {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 99;
    top: var(--menu-height);
  }

  /* ─── Responsive: mobile (<1024px) ────────────────────────────────────── */
  @media (max-width: 1023px) {
    .header {
      padding: 0 1.5rem 0 0;
    }
    
    .menu-toggle {
      display: block;
    }

    .sidebar-backdrop {
      display: block;
    }

    .content {
      position: relative;
    }

    .header__controls {
      display: none;
    }

    .subheader {
      display: flex;
    }
  }
</style>
