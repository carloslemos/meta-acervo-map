<script>
  /**
   * Overlay de contagens no mapa. Recebe quatro valores agregados; não calcula nada.
   */
  export let stats = { acervos: 0, artistas: 0, escolas: 0, obras: 0 };
</script>

<div class="map-stats" aria-label="Estatísticas">
  <div class="stat">
    <span class="stat__value">{stats.acervos}</span>
    <span class="stat__label">Acervos</span>
  </div>
  <div class="stat">
    <span class="stat__value">{stats.artistas}</span>
    <span class="stat__label">Artistas</span>
  </div>
  <div class="stat">
    <span class="stat__value">{stats.escolas}</span>
    <span class="stat__label">Escolas</span>
  </div>
  <div class="stat">
    <span class="stat__value">{stats.obras}</span>
    <span class="stat__label">Obras</span>
  </div>
</div>

<style lang="scss">
  .map-stats {
    position: absolute;
    bottom: 16px;
    left: 16px;
    z-index: 10;
    display: flex;
    gap: 18px;
    padding: 10px 14px;
    background: rgba(20, 20, 20, 0.78);
    color: #f4f6f8;
    border-radius: 4px;
    pointer-events: none; /* não interfere na interação do mapa */
    font-family: "Roboto Mono", monospace;
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    line-height: 1;
  }

  .stat__value {
    font-size: 1.05rem;
    font-weight: 600;
  }

  .stat__label {
    margin-top: 4px;
    font-size: 0.65rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    opacity: 0.7;
  }
</style>
