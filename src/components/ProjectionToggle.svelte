<script>
  import { createEventDispatcher } from 'svelte';

  export let projectionType = '2d';

  const dispatch = createEventDispatcher();

  function select(value) {
    if (value !== projectionType) {
      dispatch('change', value);
    }
  }
</script>

<div class="projection-toggle" role="group" aria-label="Tipo de projeção">
  <!-- Globo 3D -->
  <button
    type="button"
    class="map-btn"
    class:map-btn--active={projectionType === '3d'}
    on:click={() => select('3d')}
    title="Globo 3D"
    aria-label="Globo 3D"
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/>
      <ellipse cx="12" cy="12" rx="4.5" ry="9" stroke="currentColor" stroke-width="1.5"/>
      <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="1.5"/>
    </svg>
  </button>

  <!-- Mapa plano 2D -->
  <button
    type="button"
    class="map-btn"
    class:map-btn--active={projectionType === '2d'}
    on:click={() => select('2d')}
    title="Mapa 2D"
    aria-label="Mapa 2D"
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 7L9 5L15 7L21 5V17L15 19L9 17L3 19V7Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      <line x1="9" y1="5" x2="9" y2="17" stroke="currentColor" stroke-width="1.5"/>
      <line x1="15" y1="7" x2="15" y2="19" stroke="currentColor" stroke-width="1.5"/>
    </svg>
  </button>
</div>

<style lang="scss">
  .projection-toggle {
    display: flex;
    flex-direction: column;
    gap: 2px;
    pointer-events: none; /* container passthrough — apenas botões capturam */
  }

  .map-btn {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 2px solid var(--bg-hl);
    border-radius: 4px;
    color: var(--txt-hl);
    cursor: pointer;
    pointer-events: auto;
    transition: color 0.12s, border-color 0.12s;

    &:hover {
      color: var(--txt);
      border-color: var(--txt-l);
    }
  }

  .map-btn--active {
    background: #a5a5a5;
    border-color: #a5a5a5;
    color: #000;

    &:hover {
      background: #a5a5a5;
      border-color: #a5a5a5;
      color: #000;
      cursor: default;
    }
  }
</style>
