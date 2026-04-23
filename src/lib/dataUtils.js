import * as d3 from 'd3';

/**
 * Loads and transforms creator data from the CSV.
 *
 * Returns:
 *  - bubbles: array of marker objects (birth/death/education) for the map
 *  - trajectories: array of { creator, segments: [{from, to, kind}] } where
 *    `from`/`to` are references to bubbles of the same CSV row, ordered
 *    birth → education → death (segments only created when both endpoints exist).
 *
 * @returns {Promise<{ bubbles: Array<object>, trajectories: Array<object> }>}
 */
export async function loadData() {
  const rows = await d3.csv('resultado_geolocalizado.csv');
  const bubbles = [];
  /** Map<rowIndex, { creator, birth?, education?, death? }> */
  const byRow = new Map();

  rows.forEach((row, i) => {
    const creator = row['creator']?.trim() ?? '';
    const acervo = row['acervo']?.trim() ?? '';
    const museum_json = row['museum_json']?.trim() ?? '';
    const nationality = row['country of citizenship']?.trim() ?? '';

    const splitPipe = (val) =>
      (val ?? '').split('|').map(s => s.trim()).filter(Boolean);
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
        acervo: museum_json || acervo,
        educatedAt,
        nationality,
        score: parseFloat(row['score_birth']) || 0,
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
        acervo,
        educatedAt,
        nationality,
        score: parseFloat(row['score_death']) || 0,
      };
      bubbles.push(b);
      if (!byRow.has(i)) byRow.set(i, { creator });
      byRow.get(i).death = b;
    }

    const latEstudou = parseFloat(row['lat_estudou']);
    const lonEstudou = parseFloat(row['lon_estudou']);
    if (!isNaN(latEstudou) && !isNaN(lonEstudou)) {
      const b = {
        id: `education-${i}`,
        creator,
        lat: latEstudou,
        lon: lonEstudou,
        type: 'education',
        place: row['onde estudou']?.trim() || row['educated at']?.trim() || '',
        schoolName: row['nome da escola']?.trim() ?? '',
        acervo: museum_json || acervo,
        educatedAt,
        nationality,
        score: parseFloat(row['score_estudou']) || 0,
      };
      bubbles.push(b);
      if (!byRow.has(i)) byRow.set(i, { creator });
      byRow.get(i).education = b;
    }
  });

  // Build trajectories: birth → education → death (skip missing endpoints)
  const trajectories = [];
  for (const [, group] of byRow) {
    const { creator, birth, education, death } = group;
    const segments = [];
    if (birth && education) segments.push({ from: birth, to: education, kind: 'birth-education' });
    if (education && death) segments.push({ from: education, to: death, kind: 'education-death' });
    if (birth && !education && death) segments.push({ from: birth, to: death, kind: 'birth-death' });
    if (segments.length) trajectories.push({ creator, segments });
  }

  return { bubbles, trajectories };
}
