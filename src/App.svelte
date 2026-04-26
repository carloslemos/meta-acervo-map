<script>
  import { onMount } from 'svelte';
  import WorldMap from './components/WorldMap.svelte';
  import Tooltip from './components/Tooltip.svelte';
  import FilterControls from './components/FilterControls.svelte';
  import ProjectionToggle from './components/ProjectionToggle.svelte';
  import Sidebar from './components/Sidebar.svelte';
  import { loadData } from './lib/dataUtils.js';

  let bubbles = [];
  let trajectories = [];
  let activeTypes = new Set(['birth', 'education', 'death']);
  let projectionType = '2d';
  let activeAcervos = new Set();
  let allAcervos = [];
  let selectedSchool = null;
  let selectedNationality = null;
  let allSchools = [];
  let allNationalities = [];
  let loading = true;
  let error = null;

  // Sidebar state (mobile)
  let sidebarOpen = false;

  // Tooltip state
  let tooltipVisible = false;
  let tooltipBubble = null;
  let tooltipX = 0;
  let tooltipY = 0;

  onMount(async () => {
    try {
      const data = await loadData();
      bubbles = data.bubbles;
      trajectories = data.trajectories;
      allAcervos = [...new Set(bubbles.map(b => b.acervo).filter(Boolean))].sort();
      activeAcervos = new Set(allAcervos);
      allSchools = [...new Set(bubbles.flatMap(b => b.educatedAt))].sort();
      allNationalities = [...new Set(bubbles.map(b => b.nationality).filter(Boolean))].sort();
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  });

  function handleFilterChange(event) {
    activeTypes = event.detail;
  }

  function handleProjectionChange(event) {
    projectionType = event.detail;
  }

  function handleAcervoChange(event) {
    activeAcervos = event.detail;
  }

  function handleSchoolSelect(event) {
    selectedSchool = event.detail;
  }

  function handleNationalitySelect(event) {
    selectedNationality = event.detail;
  }

  function handleBubbleHover(event) {
    const { bubble, x, y } = event.detail;
    tooltipBubble = bubble;
    tooltipX = x;
    tooltipY = y;
    tooltipVisible = true;
  }

  function handleBubbleLeave() {
    tooltipVisible = false;
  }

  function handleToggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }

  function handleCloseSidebar() {
    sidebarOpen = false;
  }

  $: bubblesForMap = bubbles.filter(b =>
    (!b.acervo || activeAcervos.has(b.acervo)) &&
    (!selectedSchool || b.educatedAt.includes(selectedSchool)) &&
    (!selectedNationality || b.nationality === selectedNationality)
  );
  // Segments visible only when both endpoints pass current filters (sidebar + header)
  $: visibleBubbleIds = new Set(bubblesForMap.filter(b => activeTypes.has(b.type)).map(b => b.id));
  $: trajectoriesForMap = trajectories
    .map(t => ({
      creator: t.creator,
      segments: t.segments.filter(s => visibleBubbleIds.has(s.from.id) && visibleBubbleIds.has(s.to.id)),
    }))
    .filter(t => t.segments.length > 0);
  $: birthCount = bubblesForMap.filter(b => b.type === 'birth').length;
  $: deathCount = bubblesForMap.filter(b => b.type === 'death').length;
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
      <FilterControls {activeTypes} on:change={handleFilterChange} />
      <ProjectionToggle {projectionType} on:change={handleProjectionChange} />
    </div>

    <div class="header__stats">
      <span class="stat">{birthCount} <span class="stat__label">nasc.</span></span>
      <span class="stat">{deathCount} <span class="stat__label">morte</span></span>
    </div>
  </header>

  <div class="subheader">
    <FilterControls {activeTypes} on:change={handleFilterChange} />
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
      {allSchools}
      {selectedSchool}
      {allNationalities}
      {selectedNationality}
      on:acervochange={handleAcervoChange}
      on:schoolselect={handleSchoolSelect}
      on:nationalityselect={handleNationalitySelect}
    />

    <main class="map-container">
      {#if loading}
        <div class="state-message">Carregando dados…</div>
      {:else if error}
        <div class="state-message state-message--error">Erro: {error}</div>
      {:else}
        <WorldMap
          bubbles={bubblesForMap}
          trajectories={trajectoriesForMap}
          {activeTypes}
          {projectionType}
          on:bubblehover={handleBubbleHover}
          on:bubbleleave={handleBubbleLeave}
        />
      {/if}
    </main>
  </div>
</div>

<Tooltip
  bubble={tooltipBubble}
  x={tooltipX}
  y={tooltipY}
  visible={tooltipVisible}
/>

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
