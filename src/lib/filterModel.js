/**
 * Lógica de filtragem das bubbles e trajetórias.
 *
 * Módulo puro: sem efeitos colaterais, sem estado, sem dependências de framework.
 * App.svelte mantém as variáveis reativas; este módulo centraliza os predicados.
 *
 * Benefício: adicionar um novo filtro (ex: período, cidade) requer apenas:
 *   1. Adicionar o campo ao parâmetro `filters` em `applyFilters`
 *   2. Adicionar o predicado correspondente abaixo
 *   — sem editar o bloco `$:` inline do App.svelte
 */

/**
 * Aplica os filtros de sidebar às bubbles.
 * Os filtros de tipo (birth/death/education) são aplicados
 * separadamente pela visibilidade na camada do mapa.
 *
 * @param {object[]} bubbles
 * @param {{
 *   activeAcervos:       Set<string>,
 *   activeGenders:       Set<string>,
 *   selectedCreator:     string|null,
 *   selectedSchool:      string|null,
 *   selectedNationality: string|null,
 * }} filters
 * @returns {object[]}
 */
export function applyFilters(bubbles, filters) {
  const { activeAcervos, activeGenders, selectedCreator, selectedSchool, selectedNationality } = filters;
  return bubbles.filter(b =>
    (b.acervos.length === 0 || b.acervos.some(a => activeAcervos.has(a))) &&
    (activeGenders.size === 0 || activeGenders.has(b.gender)) &&
    (!selectedCreator || b.creator === selectedCreator) &&
    (!selectedSchool || b.educatedAt.includes(selectedSchool)) &&
    (!selectedNationality || b.nationality === selectedNationality)
  );
}

/**
 * Filtra as trajetórias para incluir apenas segmentos onde ambas as bubbles
 * extremas estão no conjunto de IDs visíveis.
 *
 * @param {object[]} trajectories
 * @param {Set<string>} visibleBubbleIds
 * @returns {object[]}
 */
export function applyTrajectoryFilter(trajectories, visibleBubbleIds) {
  return trajectories
    .map(t => ({
      creator: t.creator,
      segments: t.segments.filter(s =>
        visibleBubbleIds.has(s.from.id) && visibleBubbleIds.has(s.to.id)
      ),
    }))
    .filter(t => t.segments.length > 0);
}
