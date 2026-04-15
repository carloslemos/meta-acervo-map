import * as d3 from 'd3';

/**
 * Loads and transforms creator data from the CSV into bubble objects.
 * Each creator can produce up to two bubbles: birth and death.
 *
 * @returns {Promise<Array<{id: string, creator: string, lat: number, lon: number, type: 'birth'|'death', place: string, acervo: string, score: number}>>}
 */
export async function loadData() {
  const rows = await d3.csv('resultado_geolocalizado.csv');
  const bubbles = [];

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
      bubbles.push({
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
      });
    }

    const latDeath = parseFloat(row['lat_death']);
    const lonDeath = parseFloat(row['lon_death']);
    if (!isNaN(latDeath) && !isNaN(lonDeath)) {
      bubbles.push({
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
      });
    }
  });

  return bubbles;
}
