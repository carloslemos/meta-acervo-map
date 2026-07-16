/**
 * Lógica de filtragem das bubbles e trajetórias.
 *
 * Módulo puro: sem efeitos colaterais, sem estado, sem dependências de framework.
 * App.svelte mantém as variáveis reativas; este módulo centraliza os predicados.
 *
 * O filtro combinado é decomposto num registro de predicados por faceta
 * (`FIELD_PREDICATES`). `applyFilters` é a conjunção de todos os predicados; a
 * decomposição permite compor "todos os filtros ativos exceto o do campo F",
 * base do facetamento (cross-filter N-1).
 *
 * Benefício: adicionar um novo filtro (ex: período, cidade) requer apenas:
 *   1. Adicionar o campo ao parâmetro `filters` e a `FILTER_FIELDS`
 *   2. Adicionar o predicado correspondente em `FIELD_PREDICATES`
 *   — sem editar o bloco `$:` inline do App.svelte
 */

/**
 * Ordem canônica das facetas filtráveis da sidebar.
 * Cada entrada tem um predicado correspondente em `FIELD_PREDICATES`.
 * @type {ReadonlyArray<string>}
 */
export const FILTER_FIELDS = Object.freeze([
  'acervos',
  'genders',
  'creators',
  'schools',
  'nationalities',
  'localidade',
]);

/**
 * Predicado por faceta: `(bubble, ctx) => boolean`.
 *
 * `ctx` é o contexto normalizado produzido por `makeFilterContext` — os mesmos
 * conjuntos de `filters` acrescidos de `canonicalLocalidade` já resolvido.
 *
 * Semântica de conjunto vazio (assimétrica, preservada da versão anterior):
 *   - acervo/gênero: "vazio = nada" (nenhuma bubble passa se o conjunto está vazio)
 *   - artista/escola/nacionalidade/localidade: "vazio = tudo" (sem filtro ativo)
 */
export const FIELD_PREDICATES = Object.freeze({
  acervos:       (b, ctx) => ctx.activeAcervos.size > 0 && b.acervos.some(a => ctx.activeAcervos.has(a)),
  genders:       (b, ctx) => ctx.activeGenders.size > 0 && ctx.activeGenders.has(b.gender),
  creators:      (b, ctx) => ctx.selectedCreators.size === 0 || ctx.selectedCreators.has(b.creator),
  schools:       (b, ctx) => ctx.selectedSchools.size === 0 || b.educatedAt.some(s => ctx.selectedSchools.has(s)),
  nationalities: (b, ctx) => ctx.selectedNationalities.size === 0 || ctx.selectedNationalities.has(b.nationality),
  localidade:    (b, ctx) => !ctx.canonicalLocalidade || b.country === ctx.canonicalLocalidade || b.continent === ctx.canonicalLocalidade,
});

/**
 * Normaliza os filtros da sidebar num contexto pronto para os predicados.
 * Resolve a seleção de localidade traduzida de volta ao valor canônico uma única
 * vez, para que os predicados sejam comparações diretas.
 *
 * @param {{
 *   activeAcervos:         Set<string>,
 *   activeGenders:         Set<string>,
 *   selectedCreators:      Set<string>,
 *   selectedSchools:       Set<string>,
 *   selectedNationalities: Set<string>,
 *   selectedLocalidade:    string|null,
 * }} filters
 * @param {Map<string, string>} localidadesReverseMap — mapa de nome traduzido → valor canônico
 * @returns {object} contexto com `canonicalLocalidade` resolvido
 */
export function makeFilterContext(filters, localidadesReverseMap) {
  const canonicalLocalidade = filters.selectedLocalidade
    ? localidadesReverseMap?.get(filters.selectedLocalidade) ?? filters.selectedLocalidade
    : null;
  return { ...filters, canonicalLocalidade };
}

/**
 * Testa se uma bubble passa por um subconjunto de facetas.
 * Base do facetamento: passe `FILTER_FIELDS` sem o campo F para obter
 * "todos os filtros ativos exceto o de F" (cross-filter N-1).
 *
 * @param {object} bubble
 * @param {object} ctx — contexto de `makeFilterContext`
 * @param {ReadonlyArray<string>} fields — facetas a avaliar (subconjunto de FILTER_FIELDS)
 * @returns {boolean}
 */
export function bubbleMatchesFields(bubble, ctx, fields) {
  return fields.every(field => FIELD_PREDICATES[field](bubble, ctx));
}

/**
 * Aplica os filtros de sidebar às bubbles.
 * Os filtros de tipo (birth/death/education) são aplicados
 * separadamente pela visibilidade na camada do mapa.
 *
 * @param {object[]} bubbles
 * @param {{
 *   activeAcervos:         Set<string>,
 *   activeGenders:         Set<string>,
 *   selectedCreators:      Set<string>,
 *   selectedSchools:       Set<string>,
 *   selectedNationalities: Set<string>,
 *   selectedLocalidade:    string|null,
 * }} filters
 * @param {Map<string, string>} localidadesReverseMap — mapa de nome traduzido → valor canônico
 * @returns {object[]}
 */
export function applyFilters(bubbles, filters, localidadesReverseMap) {
  const ctx = makeFilterContext(filters, localidadesReverseMap);
  return bubbles.filter(b => bubbleMatchesFields(b, ctx, FILTER_FIELDS));
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
