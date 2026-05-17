import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { BUBBLE_RADIUS, CENTRAL_ROTATION, REF_W, REF_H, ISO_CONTINENT } from './constants.js';

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
 * Quebra um campo de instituições aceitando `|` ou `;` como separador.
 *
 * @param {string|null|undefined} val
 * @returns {string[]}
 */
function splitInstitutions(val) {
  return (val ?? '').split(/[|;]/).map(s => s.trim()).filter(Boolean);
}

/** Normaliza nome de instituição para chave de lookup (trim + lowercase). */
function normalizeInstitutionKey(name) {
  return (name ?? '').trim().toLowerCase();
}

/**
 * Carrega o CSV de geolocalização de instituições e retorna um Map
 * `nomeNormalizado -> { lat, lon }`. Linhas sem coordenadas são ignoradas.
 *
 * @returns {Promise<Map<string, { lat: number, lon: number }>>}
 */
async function loadEducatedAtIndex() {
  const rows = await d3.csv('educated_at_geolocated.csv');
  const index = new Map();
  for (const row of rows) {
    const name = row['educated at'];
    const coord = row['coordinate location'];
    if (!name || !coord) continue;
    const [latStr, lonStr] = String(coord).split(',').map(s => s.trim());
    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);
    if (isNaN(lat) || isNaN(lon)) continue;
    index.set(normalizeInstitutionKey(name), { lat, lon });
  }
  return index;
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
 * Retorna o nome do continente em PT-BR para um código ISO 3166-1 numérico.
 * Aceita string ou número; retorna `null` se desconhecido ou nulo.
 *
 * @param {string|number|null|undefined} isoId
 * @returns {string|null}
 */
export function continentForIsoId(isoId) {
  if (isoId === null || isoId === undefined) return null;
  const key = String(isoId);
  return ISO_CONTINENT[key] ?? ISO_CONTINENT[String(parseInt(key, 10))] ?? null;
}

/**
 * Ordena obras por `year` descendente. Obras com `year === 9999`, `null`,
 * `undefined` ou não-numérico vão para o final, na ordem original entre si.
 *
 * @param {object[]} artworks
 * @returns {object[]} novo array ordenado (não muta o original)
 */
export function sortArtworks(artworks) {
  const isUndated = (y) => y === null || y === undefined || y === 9999 || typeof y !== 'number' || Number.isNaN(y);
  return [...artworks].sort((a, b) => {
    const au = isUndated(a.year);
    const bu = isUndated(b.year);
    if (au && bu) return 0;
    if (au) return 1;
    if (bu) return -1;
    return b.year - a.year;
  });
}

/**
 * Carrega o CSV de acervos geolocalizados e retorna bubbles do tipo `acervo`.
 * Linhas sem lat/lon válidos são ignoradas silenciosamente.
 *
 * @returns {Promise<object[]>}
 */
async function loadAcervoBubbles() {
  const rows = await d3.csv('acervos_geolocated.csv');
  const out = [];
  rows.forEach((row, i) => {
    const acervo = (row.acervo ?? '').trim();
    const lat = parseFloat(row.lat);
    const lon = parseFloat(row.lon);
    if (!acervo || isNaN(lat) || isNaN(lon)) return;
    const name = ACERVO_ALIASES[acervo] ?? acervo;
    out.push({
      id: `acervo-${i}`,
      creator: name,
      lat,
      lon,
      type: 'acervo',
      place: name,
      acervos: [name],
      educatedAt: [],
      nationality: '',
      gender: 'unknown',
      score: 0,
      confidence: null,
    });
  });
  return out;
}

/**
 * Carrega o JSON de obras e retorna um Map `creator -> obras[]` já ordenado
 * por `year` descendente (9999/null por último).
 *
 * @returns {Promise<Map<string, object[]>>}
 */
async function loadArtworksByCreator() {
  const resp = await fetch(`${import.meta.env?.BASE_URL ?? '/'}20250705_processed.json`);
  if (!resp.ok) throw new Error(`Falha ao carregar JSON de obras: ${resp.status}`);
  const dict = await resp.json();
  /** @type {Map<string, object[]>} */
  const byCreator = new Map();
  for (const [wikidataId, entry] of Object.entries(dict)) {
    const creator = (entry?.creator ?? '').trim();
    if (!creator) continue;
    const artwork = {
      id: wikidataId,
      creator,
      museum: entry.museum ?? '',
      title: entry.title ?? '',
      year: typeof entry.year === 'number' ? entry.year : null,
      image: entry.image?.image ?? '',
      url: entry.url ?? '',
    };
    const list = byCreator.get(creator);
    if (list) list.push(artwork);
    else byCreator.set(creator, [artwork]);
  }
  for (const [creator, list] of byCreator) {
    byCreator.set(creator, sortArtworks(list));
  }
  return byCreator;
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
  const [rows, educatedAtIndex, artworksByCreator, acervoBubbles, topo] = await Promise.all([
    d3.dsv(';', 'atlas_ma_0501_v2.csv'),
    loadEducatedAtIndex(),
    loadArtworksByCreator(),
    loadAcervoBubbles(),
    d3.json('countries-110m.json'),
  ]);
  const bubbles = [];
  /** @type {Map<number, { creator: string, birth?: object, educations?: object[], death?: object }>} */
  const byRow = new Map();

  rows.forEach((row, i) => {
    const creator = row['creator']?.trim() ?? '';
    const acervo = row['acervo']?.trim() ?? '';
    const museum_json = row['museum_json']?.trim() ?? '';
    const nationality = row['country of citizenship']?.trim() ?? '';
    const gender = row['sex or gender']?.trim() || 'unknown';

    const educatedAt = [...new Set([
      ...splitInstitutions(row['educated at']),
      ...splitInstitutions(row['onde estudou']),
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
        gender,
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
        gender,
        score: parseFloat(row['score_death']) || 0,
        confidence: normalizeConfidence(row['confianca_preenchimento']),
      };
      bubbles.push(b);
      if (!byRow.has(i)) byRow.set(i, { creator });
      byRow.get(i).death = b;
    }

    // Múltiplas bolhas de educação, uma por instituição com coordenada no
    // lookup. Instituições sem match são agrupadas em uma única bolha de
    // fallback usando lat_educated_at/lon_educated_at do CSV principal.
    const fallbackLat = parseFloat(row['lat_educated_at']);
    const fallbackLon = parseFloat(row['lon_educated_at']);
    const hasFallbackCoord = !isNaN(fallbackLat) && !isNaN(fallbackLon);
    const educationAcervos = splitSemicolon(museum_json || acervo);
    const educationScore = parseFloat(row['score_estudou']) || 0;
    const educationConfidence = normalizeConfidence(row['confianca_educated_at']);
    const educationDates = row['datas em que estudou']?.trim() ?? '';
    const educationPlace = row['onde estudou']?.trim() || row['educated at']?.trim() || '';
    const baseSchoolName = row['nome da escola']?.trim() ?? '';

    const educations = [];
    const unmatched = [];

    for (let j = 0; j < educatedAt.length; j++) {
      const institution = educatedAt[j];
      const hit = educatedAtIndex.get(normalizeInstitutionKey(institution));
      if (hit) {
        educations.push({
          id: `education-${i}-${j}`,
          creator,
          lat: hit.lat,
          lon: hit.lon,
          type: 'education',
          place: '',
          schoolName: institution,
          acervos: educationAcervos,
          educatedAt,
          nationality,
          gender,
          score: educationScore,
          confidence: educationConfidence,
          dates: educationDates,
        });
      } else {
        unmatched.push(institution);
      }
    }

    if (hasFallbackCoord) {
      if (unmatched.length > 0) {
        educations.push({
          id: `education-${i}-fallback`,
          creator,
          lat: fallbackLat,
          lon: fallbackLon,
          type: 'education',
          place: '',
          schoolName: unmatched.join(' / '),
          acervos: educationAcervos,
          educatedAt,
          nationality,
          gender,
          score: educationScore,
          confidence: educationConfidence,
          dates: educationDates,
          isFallback: true,
        });
      } else if (educations.length === 0) {
        // Sem instituições parseadas, mas o CSV tem coord — preserva
        // comportamento antigo de uma bolha com `nome da escola`.
        educations.push({
          id: `education-${i}-fallback`,
          creator,
          lat: fallbackLat,
          lon: fallbackLon,
          type: 'education',
          place: educationPlace,
          schoolName: baseSchoolName,
          acervos: educationAcervos,
          educatedAt,
          nationality,
          gender,
          score: educationScore,
          confidence: educationConfidence,
          dates: educationDates,
          isFallback: true,
        });
      }
    }

    if (educations.length > 0) {
      for (const b of educations) bubbles.push(b);
      if (!byRow.has(i)) byRow.set(i, { creator });
      byRow.get(i).educations = educations;
    }
  });

  // Constrói trajetórias: nascimento → estudo₁ → estudo₂ → … → morte
  // (pula extremos faltantes; cria segmento direto birth→death se não houver estudos).
  const trajectories = [];
  for (const [, group] of byRow) {
    const { creator, birth, educations, death } = group;
    const points = [birth, ...(educations ?? []), death].filter(Boolean);
    const segments = [];
    for (let p = 0; p < points.length - 1; p++) {
      const from = points[p];
      const to = points[p + 1];
      segments.push({ from, to, kind: `${from.type}-${to.type}` });
    }
    if (segments.length) trajectories.push({ creator, segments });
  }

  // Pré-computa offset de descolisão (dxBase/dyBase) por bubble usando uma
  // projeção de referência fixa. Em runtime, a posição final fica:
  //   x = projected.x + dxBase / k    (em 2D; k = zoom)
  //   y = projected.y + dyBase / k
  // Em 3D, o offset é aplicado direto (boa aproximação fora das bordas do globo).
  // Roda forceCollide uma única vez aqui, evitando recomputo a cada pan/zoom.
  // REF_W, REF_H e CENTRAL_ROTATION importados de constants.js
  const REF_ROTATION = CENTRAL_ROTATION;
  const refProj = d3.geoEqualEarth()
    .rotate(REF_ROTATION)
    .fitSize([Infinity, REF_H], { type: 'Sphere' })
    .translate([REF_W / 2, REF_H / 2]);

  const RADIUS = BUBBLE_RADIUS;
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

  // Acervos têm dxBase/dyBase = 0 (sem descolisão pré-computada por enquanto)
  for (const b of acervoBubbles) {
    b.dxBase = 0;
    b.dyBase = 0;
  }

  // Pré-anota country/continent para todas as bubbles (artistas + acervos).
  const countriesFeature = topojson.feature(topo, topo.objects.countries);
  annotateGeo([...bubbles, ...acervoBubbles], countriesFeature);

  return { bubbles, trajectories, artworksByCreator, acervoBubbles };
}

/**
 * Para cada bubble, popula `country` (nome em inglês do TopoJSON) e
 * `continent` (PT-BR via `ISO_CONTINENT`). Os campos ficam `null` quando
 * nenhuma feature contém o ponto.
 *
 * @param {object[]} bubbles
 * @param {object} countriesFeature - FeatureCollection do TopoJSON
 */
function annotateGeo(bubbles, countriesFeature) {
  for (const b of bubbles) {
    b.country = null;
    b.continent = null;
  }
  for (const feature of countriesFeature.features) {
    const name = feature.properties?.name ?? null;
    const continent = continentForIsoId(feature.id);
    for (const b of bubbles) {
      if (b.country !== null) continue;
      if (d3.geoContains(feature, [b.lon, b.lat])) {
        b.country = name;
        b.continent = continent;
      }
    }
  }
}
