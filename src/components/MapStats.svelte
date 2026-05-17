<script>
  /**
   * Overlay de contagens no mapa. Recebe quatro valores agregados; não calcula nada.
   */
  export let stats = { acervos: 0, artistas: 0, escolas: 0, obras: 0 };
</script>

<div class="map-stats" aria-label="Estatísticas do mapa">
  <p class="map-stats__line">{stats.acervos} Acervos selecionados</p>
  <p class="map-stats__line">{stats.artistas} Artistas</p>
  <p class="map-stats__line">{stats.escolas} Escolas</p>
  <p class="map-stats__line">{stats.obras} Obras</p>
</div>

<style lang="scss">
  .map-stats {
    position: absolute;
    top: 32px;
    left: 32px;
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: 0;
    pointer-events: none;
    font-family: "Roboto Mono", monospace;
    font-style: normal;
    font-weight: 700;
    font-size: 13px;
    line-height: 20px;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.64);
  }

  .map-stats__line {
    margin: 0;
  }
</style>
