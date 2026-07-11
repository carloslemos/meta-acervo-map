<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();
</script>

<div class="zoom-buttons" role="group" aria-label="Controles de zoom">
  <button
    type="button"
    class="zoom-btn"
    on:click={() => dispatch('zoomin')}
    title="Aproximar"
    aria-label="Aproximar"
  >
    <!-- Ícone + (cruz) -->
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M11 5v6H5v2h6v6h2v-6h6v-2h-6V5h-2z" fill="currentColor"/>
    </svg>
  </button>

  <button
    type="button"
    class="zoom-btn"
    on:click={() => dispatch('zoomout')}
    title="Afastar"
    aria-label="Afastar"
  >
    <!-- Ícone − (traço horizontal) -->
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M5 11h14v2H5z" fill="currentColor"/>
    </svg>
  </button>
</div>

<style lang="scss">
  .zoom-buttons {
    display: flex;
    flex-direction: column;
    gap: 2px;
    pointer-events: none; /* container passthrough — apenas botões capturam */
  }

  .zoom-btn {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-white);
    border: none;
    border-radius: 5.28px;
    color: var(--color-black);
    cursor: pointer;
    pointer-events: auto;
    backdrop-filter: blur(3.52px);
    -webkit-backdrop-filter: blur(3.52px);
    transition: background 0.12s;

    &:hover {
      background: var(--neutral-30); /* #BBBBBB */
    }

    &:active {
      background: var(--neutral-10); /* #E8E8E8 */
    }
  }
</style>
