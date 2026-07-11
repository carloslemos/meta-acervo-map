/**
 * Agrega métricas analíticas sobre um conjunto de bubbles filtradas.
 *
 * Operação pura: sem efeitos colaterais, totalmente testável em isolamento.
 * Recebe o array `bubblesForMap` (exceto type === 'acervo') e devolve
 * um objeto com distribuição de gênero, local de formação e regiões.
 */

/**
 * Retorna as top N entradas de um Map<string, count> como array de
 * { label, pct }, ordenado decrescente por frequência.
 *
 * @param {Map<string, number>} freq - mapa label → contagem
 * @param {number} topN - máximo de entradas
 * @param {number} total - denominador para o %
 * @returns {{ label: string, pct: number }[]}
 */
function topFromFreq(freq, topN, total) {
  if (!freq.size || total === 0) return [];
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, topN)
    .map(([label, count]) => ({
      label,
      pct: Math.round((count / total) * 100),
    }));
}

/**
 * Calcula métricas analíticas de um conjunto de bubbles filtradas.
 *
 * Base de cálculo: **criadores únicos** (deduplicados por `bubble.creator`).
 *
 * @param {object[]} bubbles - array de bubbles (excluir type === 'acervo' antes)
 * @returns {{
 *   genderTop: { label: string, pct: number } | null,
 *   formationTop: { label: string, pct: number } | null,
 *   birthByRegion: { label: string, pct: number }[],
 *   formationByRegion: { label: string, pct: number }[]
 * }}
 */
export function profileStats(bubbles) {
  // ─── Deduplicação por criador único ───────────────────────────────────────
  /** Map<creator, { gender, birthContinent, formationPlace, formationContinent }> */
  const creators = new Map();

  for (const b of bubbles) {
    if (b.type === 'acervo') continue;

    if (!creators.has(b.creator)) {
      creators.set(b.creator, {
        gender: b.gender ?? 'unknown',
        birthContinent: null,
        formationPlace: null,
        formationContinent: null,
      });
    }

    const entry = creators.get(b.creator);

    if (b.type === 'birth' && b.continent && !entry.birthContinent) {
      entry.birthContinent = b.continent;
    }

    if (b.type === 'education') {
      // Usa o nome da escola (ou lugar) como local de formação
      if ((b.schoolName || b.place) && !entry.formationPlace) {
        entry.formationPlace = b.schoolName || b.place;
      }
      if (b.continent && !entry.formationContinent) {
        entry.formationContinent = b.continent;
      }
    }
  }

  const total = creators.size;

  if (total === 0) {
    return {
      genderTop: null,
      formationTop: null,
      birthByRegion: [],
      formationByRegion: [],
    };
  }

  // ─── Frequências ──────────────────────────────────────────────────────────
  const genderFreq = new Map();
  const formationPlaceFreq = new Map();
  const birthContFreq = new Map();
  const formationContFreq = new Map();

  for (const { gender, birthContinent, formationPlace, formationContinent } of creators.values()) {
    if (gender) genderFreq.set(gender, (genderFreq.get(gender) ?? 0) + 1);
    if (birthContinent) birthContFreq.set(birthContinent, (birthContFreq.get(birthContinent) ?? 0) + 1);
    if (formationPlace) formationPlaceFreq.set(formationPlace, (formationPlaceFreq.get(formationPlace) ?? 0) + 1);
    if (formationContinent) formationContFreq.set(formationContinent, (formationContFreq.get(formationContinent) ?? 0) + 1);
  }

  // ─── Top gênero ──────────────────────────────────────────────────────────
  const genderTop = topFromFreq(genderFreq, 1, total)[0] ?? null;

  // ─── Top local de formação (por nome da escola/cidade) ───────────────────
  const formationTop = topFromFreq(formationPlaceFreq, 1, formationPlaceFreq.size > 0 ? [...formationPlaceFreq.values()].reduce((a, b) => a + b, 0) : 0)[0] ?? null;

  // ─── Regiões de nascimento — top 4 ───────────────────────────────────────
  const birthByRegion = topFromFreq(birthContFreq, 4, [...birthContFreq.values()].reduce((a, b) => a + b, 0) || 1);

  // ─── Regiões de formação — top 4 ─────────────────────────────────────────
  const formationByRegion = topFromFreq(formationContFreq, 4, [...formationContFreq.values()].reduce((a, b) => a + b, 0) || 1);

  return { genderTop, formationTop, birthByRegion, formationByRegion };
}
