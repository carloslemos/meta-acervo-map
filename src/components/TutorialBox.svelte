<script>
  import { createEventDispatcher } from 'svelte';

  /** Título opcional exibido na linha de cabeçalho (em maiúsculas). */
  export let title = '';

  const dispatch = createEventDispatcher();

  function dismiss() {
    dispatch('dismiss');
  }
</script>

<div class="tutorial-box">
  <button
    class="tutorial-box__close"
    type="button"
    on:click={dismiss}
    aria-label="Fechar tutorial"
  >×</button>
  {#if title}
    <p class="tutorial-box__title">{title}</p>
  {/if}
  <div class="tutorial-box__body">
    <slot />
  </div>
</div>

<style lang="scss">
  .tutorial-box {
    pointer-events: auto;
    position: relative;
    background: rgba(18, 18, 18, 0.5);
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
    border: 1px solid #616161;
    border-radius: 16px;
    padding: 16px 24px;
    width: 246px;
    display: flex;
    flex-direction: column;
    gap: 9px;
  }

  .tutorial-box__title {
    font-size: 1.0625rem; /* 17px */
    font-weight: 700;
    line-height: 1.4;
    letter-spacing: -0.01em;
    color: #d2d2d2;
    text-transform: uppercase;
    margin: 0;
    padding-right: 18px; /* espaço para o botão × */
  }

  .tutorial-box__close {
    all: unset;
    position: absolute;
    top: 12px;
    right: 14px;
    font-size: 0.875rem;
    line-height: 1;
    color: rgba(255, 255, 255, 0.56);
    cursor: pointer;
    transition: color 0.12s;

    &:hover {
      color: #d2d2d2;
    }
  }

  .tutorial-box__body {
    font-size: 0.875rem; /* 14px */
    font-weight: 500;
    line-height: 1.4;
    letter-spacing: -0.01em;
    color: #d2d2d2;

    :global(p) {
      margin: 0;
    }

    :global(p + p) {
      margin-top: 9px;
    }

    :global(strong) {
      font-weight: 700;
      letter-spacing: -0.02em;
    }
  }
</style>
