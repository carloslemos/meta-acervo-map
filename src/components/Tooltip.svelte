<script>
  export let bubble = null;
  export let x = 0;
  export let y = 0;
  export let visible = false;

  const TYPE_LABEL = {
    birth: 'Nascimento',
    death: 'Morte',
    education: 'Estudo',
  };

  const TYPE_COLOR = {
    birth: '#2563eb',
    death: '#dc2626',
    education: '#16a34a',
  };

  // Offset from cursor so it doesn't obstruct the bubble
  const OFFSET_X = 14;
  const OFFSET_Y = -10;
</script>

{#if visible && bubble}
  <div
    class="tooltip"
    style="left: {x + OFFSET_X}px; top: {y + OFFSET_Y}px;"
    role="tooltip"
  >
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

    {#if bubble.acervo}
      <p class="tooltip__acervo">Acervo: {bubble.acervo}</p>
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
  }

  .tooltip__badge {
    display: inline-block;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: #fff;
    padding: 2px 6px;
    margin-bottom: 6px;
    border-radius: 2px;
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
