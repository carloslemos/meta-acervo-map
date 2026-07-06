<script>
  import { onMount } from 'svelte';
  import WorldMap from './components/WorldMap.svelte';
  import Header from './components/Header.svelte';
  import MobileHeader from './components/MobileHeader.svelte';
  import FilterAccordion from './components/FilterAccordion.svelte';
  import SidebarFilters from './components/SidebarFilters.svelte';
  import ProjectionToggle from './components/ProjectionToggle.svelte';
  import Sidebar from './components/Sidebar.svelte';
  import ArtistCard from './components/ArtistCard.svelte';
  import ArtworkStrip from './components/ArtworkStrip.svelte';
  import MapStats from './components/MapStats.svelte';
  import TutorialBox from './components/TutorialBox.svelte';
  import { loadData } from './lib/dataUtils.js';
  import { applyFilters, applyTrajectoryFilter } from './lib/filterModel.js';
import {
  UNDATED_YEAR,
  ARTWORK_STRIP_HEIGHT_EXPANDED,
  ARTWORK_STRIP_HEIGHT_COLLAPSED,
  ARTWORK_STRIP_HEIGHT_MOBILE_EXPANDED,
  ARTWORK_STRIP_HEIGHT_MOBILE_COLLAPSED,
  BREAKPOINT_TABLET,
  getBreakpoint,
  LS_TUTORIAL_KEY,
  TUTORIAL_MAP_TITLE,
  TUTORIAL_MAP_TEXT_NAV,
  TUTORIAL_MAP_TEXT_ZOOM,
  TUTORIAL_MAP_TEXT_MOBILE_SELECT,
  TUTORIAL_MAP_TEXT_MOBILE_NAV,
  TUTORIAL_MAP_TEXT_MOBILE_ZOOM,
} from './lib/constants.js';

  /** Níveis do FilterAccordion no mobile (ordem + rótulos). */
  const ACCORDION_ITEMS = [
    { id: 'level1', label: 'Acervos e Artistas' },
    { id: 'level2', label: 'Visualizações e Filtros' },
  ];

  const LS_STRIP_KEY = 'meta-acervo:artwork-strip-collapsed';

  /** Lê estado collapsed do localStorage (fallback false). */
  function readCollapsed() {
    try { return localStorage.getItem(LS_STRIP_KEY) === 'true'; } catch { return false; }
  }

  /** Persiste estado collapsed sem lançar exceção (quota / modo privado). */
  function saveCollapsed(val) {
    try { localStorage.setItem(LS_STRIP_KEY, String(val)); } catch { /* silencioso */ }
  }

  // ── Tutorial / Onboarding ─────────────────────────────────────────────────────

  let tutorialDismissed = (() => {
    try { return localStorage.getItem(LS_TUTORIAL_KEY) === 'true'; } catch { return false; }
  })();

  function handleTutorialDismiss() {
    tutorialDismissed = true;
    try { localStorage.setItem(LS_TUTORIAL_KEY, 'true'); } catch { /* silencioso */ }
  }

  function handleTutorialReopen() {
    tutorialDismissed = false;
    try { localStorage.removeItem(LS_TUTORIAL_KEY); } catch { /* silencioso */ }
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

  // Estado da sidebar: aberta por padrão em tablet/desktop (≥760px), fechada em mobile
  let sidebarOpen = typeof window !== 'undefined' ? window.innerWidth >= BREAKPOINT_TABLET : false;

  /** Largura da viewport (px), sincronizada via `bind:innerWidth`. */
  let viewportWidth = typeof window !== 'undefined' ? window.innerWidth : BREAKPOINT_TABLET;
  /** Faixa de layout atual: 'mobile' | 'tablet' | 'desktop'. */
  $: breakpoint = getBreakpoint(viewportWidth);
  $: isMobile = breakpoint === 'mobile';

  /** Nível do FilterAccordion expandido no mobile (null = ambos colapsados).
   * Reseta a cada carregamento de página; mantém estado ao redimensionar. */
  let accordionExpandedId = null;
  $: accordionOpen = accordionExpandedId !== null;

  /** Estado collapse do ArtworkStrip — controla `bottomInset` do WorldMap.
   * Inicializado do localStorage para persistir entre reloads. */
  let artworkStripCollapsed = readCollapsed();
  $: saveCollapsed(artworkStripCollapsed);
  /** Altura ocupada pela faixa, sensível ao breakpoint (mobile usa overlay menor).
   * Quando não há obras, a faixa não renderiza e o inset é 0. */
  $: stripCollapsedH = isMobile ? ARTWORK_STRIP_HEIGHT_MOBILE_COLLAPSED : ARTWORK_STRIP_HEIGHT_COLLAPSED;
  $: stripExpandedH = isMobile ? ARTWORK_STRIP_HEIGHT_MOBILE_EXPANDED : ARTWORK_STRIP_HEIGHT_EXPANDED;
  $: artworkStripInset = artworksForStrip.length === 0 ? 0 : (artworkStripCollapsed ? stripCollapsedH : stripExpandedH);

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

<svelte:window bind:innerWidth={viewportWidth} />

<div class="layout" class:layout--sb-closed={!sidebarOpen} class:layout--mobile={isMobile}>

  {#if !isMobile}
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
      tutorialActive={!tutorialDismissed}
      on:tutorialreopen={handleTutorialReopen}
    />
  {/if}

  <div class="main-area">
  {#if isMobile}
    <MobileHeader />

    <div class="mobile-filters" class:mobile-filters--open={accordionOpen}>
      <FilterAccordion items={ACCORDION_ITEMS} bind:expandedId={accordionExpandedId}>
        <div slot="level1" class="mobile-filters__panel">
          <SidebarFilters
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
        </div>
        <div slot="level2" class="mobile-filters__panel mobile-filters__panel--header">
          <Header
            {activeTypes}
            {selectedLocalidade}
            localidades={allLocalidades}
            {showTrajectories}
            on:typeschange={handleFilterChange}
            on:localidadechange={handleLocalidadeChange}
            on:trajectorieschange={handleTrajectoriesChange}
            tutorialActive={!tutorialDismissed}
            on:tutorialreopen={handleTutorialReopen}
          />
        </div>
      </FilterAccordion>
    </div>
  {:else}
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
          tutorialActive={!tutorialDismissed}
          on:tutorialreopen={handleTutorialReopen}
        />
      </div>
    </header>
  {/if}

  <div class="content">
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
        {#if !tutorialDismissed}
          <div class="tutorial-overlay tutorial-overlay--center">
            <TutorialBox title={TUTORIAL_MAP_TITLE} on:dismiss={handleTutorialDismiss}>
              {#if isMobile}
                <p><strong>Seleção:</strong> {TUTORIAL_MAP_TEXT_MOBILE_SELECT}</p>
                <p><strong>Navegação:</strong> {TUTORIAL_MAP_TEXT_MOBILE_NAV}</p>
                <img class="tutorial-illo" src="{import.meta.env.BASE_URL}tutorial-nav-mobile.png" alt="" />
                <p><strong>Zoom:</strong> {TUTORIAL_MAP_TEXT_MOBILE_ZOOM}</p>
                <img class="tutorial-illo" src="{import.meta.env.BASE_URL}tutorial-zoom-mobile.png" alt="" />
              {:else}
                <img class="tutorial-illo" src="{import.meta.env.BASE_URL}tutorial-nav-desktop.png" alt="" />
                <p><strong>Navegação:</strong> {TUTORIAL_MAP_TEXT_NAV}</p>
                <img class="tutorial-illo" src="{import.meta.env.BASE_URL}tutorial-zoom-desktop.png" alt="" />
                <p><strong>Zoom:</strong> {TUTORIAL_MAP_TEXT_ZOOM}</p>
              {/if}
            </TutorialBox>
          </div>
        {/if}
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
        {#if isMobile}
          <button
            class="tutorial-reopen-mobile"
            class:tutorial-reopen-mobile--active={!tutorialDismissed}
            style="bottom: {artworkStripInset + 12}px"
            on:click={handleTutorialReopen}
            aria-label="Tutorial"
          >
            <svg width="30" height="30" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.098 20.196C4.52087 20.196 0 15.6751 0 10.098C0 4.52087 4.52087 0 10.098 0C15.6751 0 20.196 4.52087 20.196 10.098C20.196 15.6751 15.6751 20.196 10.098 20.196ZM9.0882 9.0882V15.147H11.1078V9.0882H9.0882ZM9.0882 5.049V7.0686H11.1078V5.049H9.0882Z" fill="#BBBBBB"/>
            </svg>
          </button>
        {/if}
        <ArtworkStrip
          artworks={artworksForStrip}
          selectedCreator={selectedArtist?.creator ?? null}
          mobile={isMobile}
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

  /* ─── Filtros mobile (FilterAccordion sobre o mapa) ─────────────────── */
  .mobile-filters {
    flex-shrink: 0;
    position: relative;
    z-index: 30;
    background: var(--bg);
    border-bottom: 1px solid var(--bg-hl);
  }

  /* Quando um nível está expandido, o accordion vira overlay e cobre o mapa. */
  .mobile-filters--open {
    position: absolute;
    top: var(--menu-height);
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 60;
    display: flex;
    flex-direction: column;
    border-bottom: none;
  }

  .mobile-filters__panel {
    padding: 0 20px 20px; /* MOBILE_PADDING_X */
  }

  .mobile-filters__panel--header {
    padding-top: 16px;
  }

  /* No mobile, o Header (controles) empilha verticalmente dentro do accordion. */
  .mobile-filters__panel--header :global(.header-bar) {
    flex-direction: column;
    align-items: stretch;
    gap: 20px;
  }

  /* A seção de localidade usa flex-basis (345px) para largura no desktop;
     em coluna isso vira altura e cria um vão — neutralizar no mobile. */
  .mobile-filters__panel--header :global(.header-section--locality) {
    flex: none;
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

  /* ─── Tutorial overlays (Boxes 2 e 3) ──────────────────────────────── */
  .tutorial-overlay {
    position: absolute;
    z-index: 15; /* acima do map-stats (10), abaixo do ArtistCard (20) */
    pointer-events: none; /* passa cliques ao canvas; TutorialBox tem pointer-events: auto */
  }

  .tutorial-overlay--center {
    /* Desktop: canto superior esquerdo do mapa (alinhado à imagem handoff) */
    top: 16px;
    left: 16px;
  }

  /* Mobile: centraliza na área visível do mapa */
  @media (max-width: 759px) {
    .tutorial-overlay--center {
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    .tutorial-overlay--center :global(.tutorial-box) {
      width: 286px;
      padding: 16px 20px;
    }
  }

  /* Ilustrações (mouse/gestos) dentro da caixa de tutorial */
  .tutorial-illo {
    display: block;
    margin: 2px auto;
    max-width: 100%;
    height: auto;
  }

  /* Mobile: botão flutuante ⓘ para reabrir tutorial (canto inferior-esquerdo do mapa) */
  .tutorial-reopen-mobile {
    all: unset;
    position: absolute;
    left: 20px;
    z-index: 15;
    cursor: pointer;
    line-height: 0;
    transition: filter 0.12s;
  }

  .tutorial-reopen-mobile--active :global(svg) {
    filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.65));
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
</style>
