import * as d3 from 'd3';

// Aliases para unificar grafias diferentes do mesmo acervo.
// Exemplo: "MAC USP" e "MAC" referem-se à mesma coleção.
const ACERVO_ALIASES = { 'MAC USP': 'MAC' };

/**
 * Normaliza valores de confiança do CSV para um formato canônico.
 *
 * @param {string|null|undefined} value — valor bruto da coluna de confiança
 * @returns {('alta'|'médio'|'baixo'|null)} valor normalizado, ou `null` se vazio/desconhecido
 */
function normalizeConfidence(value) {
  if (!value) return null;
  const val = value.toLowerCase().trim();
  if (val === 'alta') return 'alta';
  if (val === 'médio' || val === 'media') return 'médio';
  if (val === 'baixo') return 'baixo';
  return null;
}

/**
 * Quebra um campo separado por `|` em lista de strings limpas.
 *
 * @param {string|null|undefined} val
 * @returns {string[]}
 */
function splitPipe(val) {
  return (val ?? '').split('|').map(s => s.trim()).filter(Boolean);
}

/**
 * Quebra um campo de acervos separado por `;`, aplica aliases e remove duplicatas.
 *
 * @param {string|null|undefined} val
 * @returns {string[]} lista de acervos únicos já normalizados
 */
function splitSemicolon(val) {
  return [...new Set(
    (val ?? '').split(';').map(s => s.trim()).filter(Boolean)
      .map(s => ACERVO_ALIASES[s] ?? s)
  )];
}

/**
 * Carrega e transforma os dados de criadores a partir do CSV-fonte.
 *
 * Para cada linha do CSV, gera até três bubbles (nascimento, estudo, morte)
 * desde que existam coordenadas válidas. Em seguida, deriva as trajetórias
 * encadeando os pontos do mesmo criador na ordem nascimento → estudo → morte
 * (segmentos só são criados quando ambos os extremos existem).
 *
 * Também pré-calcula offsets de descolisão (`dxBase`/`dyBase`) por bubble,
 * usando uma projeção de referência fixa, para que `forceCollide` não rode a
 * cada pan/zoom em runtime.
 *
 * @returns {Promise<{ bubbles: Array<object>, trajectories: Array<object> }>}
 */
export async function loadData() {
  const rows = await d3.dsv(";", "atlas_ma_0426_v1.csv");
  const bubbles = [];
  /** @type {Map<number, { creator: string, birth?: object, education?: object, death?: object }>} */
  const byRow = new Map();

  rows.forEach((row, i) => {
    const creator = row['creator']?.trim() ?? '';
    const acervo = row['acervo']?.trim() ?? '';
    const museum_json = row['museum_json']?.trim() ?? '';
    const nationality = row['country of citizenship']?.trim() ?? '';

    const educatedAt = [...new Set([
      ...splitPipe(row['educated at']),
      ...splitPipe(row['onde estudou']),
    ])];

    const latBirth = parseFloat(row['lat_birth']);
    const lonBirth = parseFloat(row['lon_birth']);
    if (!isNaN(latBirth) && !isNaN(lonBirth)) {
      const b = {
        id: `birth-${i}`,
        creator,
        lat: latBirth,
        lon: lonBirth,
        type: 'birth',
        place: row['place of birth']?.trim() ?? '',
        acervos: splitSemicolon(museum_json || acervo),
        educatedAt,
        nationality,
        score: parseFloat(row['score_birth']) || 0,
        confidence: normalizeConfidence(row['confianca_place_of_birth']),
      };
      bubbles.push(b);
      if (!byRow.has(i)) byRow.set(i, { creator });
      byRow.get(i).birth = b;
    }

    const latDeath = parseFloat(row['lat_death']);
    const lonDeath = parseFloat(row['lon_death']);
    if (!isNaN(latDeath) && !isNaN(lonDeath)) {
      const b = {
        id: `death-${i}`,
        creator,
        lat: latDeath,
        lon: lonDeath,
        type: 'death',
        place: row['place of death']?.trim() ?? '',
        acervos: splitSemicolon(acervo),
        educatedAt,
        nationality,
        score: parseFloat(row['score_death']) || 0,
        confidence: normalizeConfidence(row['confianca_preenchimento']),
      };
      bubbles.push(b);
      if (!byRow.has(i)) byRow.set(i, { creator });
      byRow.get(i).death = b;
    }

    const latEducatedAt = parseFloat(row['lat_educated_at']);
    const lonEducatedAt = parseFloat(row['lon_educated_at']);
    if (!isNaN(latEducatedAt) && !isNaN(lonEducatedAt)) {
      const b = {
        id: `education-${i}`,
        creator,
        lat: latEducatedAt,
        lon: lonEducatedAt,
        type: 'education',
        place: row['onde estudou']?.trim() || row['educated at']?.trim() || '',
        schoolName: row['nome da escola']?.trim() ?? '',
        acervos: splitSemicolon(museum_json || acervo),
        educatedAt,
        nationality,
        score: parseFloat(row['score_estudou']) || 0,
        confidence: normalizeConfidence(row['confianca_educated_at']),
      };
      bubbles.push(b);
      if (!byRow.has(i)) byRow.set(i, { creator });
      byRow.get(i).education = b;
    }
  });

  // Constrói trajetórias: nascimento → estudo → morte (pula extremos faltantes)
  const trajectories = [];
  for (const [, group] of byRow) {
    const { creator, birth, education, death } = group;
    const segments = [];
    if (birth && education) segments.push({ from: birth, to: education, kind: 'birth-education' });
    if (education && death) segments.push({ from: education, to: death, kind: 'education-death' });
    if (birth && !education && death) segments.push({ from: birth, to: death, kind: 'birth-death' });
    if (segments.length) trajectories.push({ creator, segments });
  }

  // Pré-computa offset de descolisão (dxBase/dyBase) por bubble usando uma
  // projeção de referência fixa. Em runtime, a posição final fica:
  //   x = projected.x + dxBase / k    (em 2D; k = zoom)
  //   y = projected.y + dyBase / k
  // Em 3D, o offset é aplicado direto (boa aproximação fora das bordas do globo).
  // Roda forceCollide uma única vez aqui, evitando recomputo a cada pan/zoom.
  const REF_W = 960;
  const REF_H = 500;
  const REF_ROTATION = [54, 0, 0]; // mesmo CENTRAL_ROTATION usado em WorldMap
  const refProj = d3.geoEqualEarth()
    .rotate(REF_ROTATION)
    .fitSize([Infinity, REF_H], { type: 'Sphere' })
    .translate([REF_W / 2, REF_H / 2]);

  const RADIUS = 2.5; // mesmo BUBBLE_RADIUS de WorldMap
  const nodes = [];
  const projected = new Array(bubbles.length);
  for (let i = 0; i < bubbles.length; i++) {
    const b = bubbles[i];
    const pt = refProj([b.lon, b.lat]);
    if (!pt) {
      b.dxBase = 0;
      b.dyBase = 0;
      projected[i] = null;
      continue;
    }
    projected[i] = { x: pt[0], y: pt[1] };
    nodes.push({ index: i, x: pt[0], y: pt[1] });
  }
  const collide = d3.forceCollide(RADIUS + 0.5).strength(0.7);
  collide.initialize(nodes, () => Math.random());
  // Mais iterações aqui — roda só uma vez, pode pagar o custo.
  for (let it = 0; it < 8; it++) collide(1);
  for (const n of nodes) {
    const p = projected[n.index];
    bubbles[n.index].dxBase = n.x - p.x;
    bubbles[n.index].dyBase = n.y - p.y;
  }

  return { bubbles, trajectories };
}
