<script>
  import { createEventDispatcher } from 'svelte';
  import { TYPE_COLOR, TYPE_LABEL } from '../lib/constants.js';

  export let bubble = null;
  export let x = 0;
  export let y = 0;
  export let visible = false;

  const dispatch = createEventDispatcher();

  let tooltipEl;
  let tooltipWidth = 0;
  let tooltipHeight = 0;

  // TYPE_LABEL e TYPE_COLOR importados de constants.js

  const CONFIDENCE_COLOR = {
    alta: '#16a34a',      // verde
    médio: '#eab308',    // amarelo/ouro
    baixo: '#ef4444',     // vermelho
  };

  const CONFIDENCE_LABEL = {
    alta: 'Alta',
    médio: 'Médio',
    baixo: 'Baixo',
  };

  // Deslocamento em relação ao cursor para não cobrir a bubble.
  // OFFSET_Y > 0 faz o tooltip aparecer abaixo do cursor.
  const OFFSET_X = 14;
  const OFFSET_Y = 20;
  const MARGIN = 8; // margem mínima até as bordas da viewport

  $: if (tooltipEl) {
    tooltipWidth = tooltipEl.offsetWidth;
    tooltipHeight = tooltipEl.offsetHeight;
  }

  // Posição X final: tenta lado direito do cursor; se não couber, lado
  // esquerdo; em último caso, força dentro da viewport com `MARGIN`.
  $: adjustedX = (() => {
    let posX = x + OFFSET_X;
    if (posX + tooltipWidth > window.innerWidth - MARGIN) {
      posX = x - tooltipWidth - OFFSET_X;
    }
    return Math.max(MARGIN, Math.min(posX, window.innerWidth - tooltipWidth - MARGIN));
  })();

  // Posição Y final: mesma estratégia, abaixo → acima → clamp.
  $: adjustedY = (() => {
    let posY = y + OFFSET_Y;
    if (posY + tooltipHeight > window.innerHeight - MARGIN) {
      posY = y - tooltipHeight - OFFSET_Y;
    }
    return Math.max(MARGIN, Math.min(posY, window.innerHeight - tooltipHeight - MARGIN));
  })();

  /** Despacha o evento de fechamento (usado pelo botão X em mobile). */
  function closeTooltip() {
    dispatch('close');
  }
</script>

{#if visible && bubble}
  <div
    bind:this={tooltipEl}
    class="tooltip"
    style="left: {adjustedX}px; top: {adjustedY}px;"
    role="tooltip"
  >
    <button
      class="tooltip__close"
      on:click={closeTooltip}
      aria-label="Fechar informações"
      type="button"
    >
      ×
    </button>

    <span
      class="tooltip__badge"
      style="background: {TYPE_COLOR[bubble.type]}"
    >
      {TYPE_LABEL[bubble.type] ?? bubble.type}
    </span>

    <p class="tooltip__creator">{bubble.creator}</p>

    {#if bubble.place}
      <p class="tooltip__place">{bubble.place}</p>
    {/if}

    {#if bubble.type === 'education' && bubble.schoolName}
      <p class="tooltip__place">{bubble.schoolName}</p>
    {/if}

    {#if bubble.acervos?.length}
      <p class="tooltip__acervo">Acervo: {bubble.acervos.join('; ')}</p>
    {/if}

    {#if bubble.confidence}
      <span
        class="tooltip__badge tooltip__badge--confidence"
        style="background: {CONFIDENCE_COLOR[bubble.confidence]}"
      >
        Confiança do dado: {CONFIDENCE_LABEL[bubble.confidence]}
      </span>
    {/if}
  </div>
{/if}

<style lang="scss">
  .tooltip {
    position: fixed;
    z-index: 100;
    background: #fff;
    border: 1px solid var(--txt, #202020);
    border-radius: 0;
    padding: 10px 14px;
    pointer-events: none;
    max-width: 260px;
    font-family: 'Roboto Mono', monospace;
    text-transform: uppercase;

    @media (max-width: 1023px) {
      pointer-events: auto;
      padding: 8px 32px 8px 8px;
    }
  }

  .tooltip__close {
    display: none;
    position: absolute;
    top: 4px;
    right: 4px;
    width: 24px;
    height: 24px;
    padding: 0;
    background: none;
    border: none;
    font-size: 1.2rem;
    line-height: 1;
    color: var(--txt, #202020);
    cursor: pointer;
    align-items: center;
    justify-content: center;

    @media (max-width: 1023px) {
      display: flex;
    }

    &:hover {
      opacity: 0.7;
    }
  }

  .tooltip__badges {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 6px;
  }

  .tooltip__badge {
    display: inline-block;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: #fff;
    padding: 2px 6px;
    border-radius: 2px;
    width: fit-content;
    margin-bottom: 6px;
  }

  .tooltip__badge--confidence {
    font-size: 0.6rem;
    margin-bottom: 0;
    margin-top: 6px;
  }

  .tooltip__creator {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--txt, #202020);
    margin: 0 0 4px;
  }

  .tooltip__place {
    font-size: 0.72rem;
    color: var(--txt-l, #404040);
    margin: 0 0 3px;
  }

  .tooltip__acervo {
    font-size: 0.68rem;
    color: var(--txt-hl, #808080);
    margin: 0;
  }
</style>
