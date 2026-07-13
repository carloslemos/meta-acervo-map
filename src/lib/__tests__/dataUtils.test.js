import { continentForIsoId, sortArtworks, normalizeConfidence } from '../dataUtils.js';

describe('continentForIsoId', () => {
  test('mapeia código ISO existente para o continente correto (Brasil → América do Sul)', () => {
    expect(continentForIsoId('76')).toBe('América do Sul');
  });

  test('aceita número além de string (76 → América do Sul)', () => {
    expect(continentForIsoId(76)).toBe('América do Sul');
  });

  test('cobre os seis continentes principais com códigos representativos', () => {
    expect(continentForIsoId('840')).toBe('América do Norte'); // EUA
    expect(continentForIsoId('250')).toBe('Europa');           // França
    expect(continentForIsoId('392')).toBe('Ásia');             // Japão
    expect(continentForIsoId('818')).toBe('África');           // Egito
    expect(continentForIsoId('36')).toBe('Oceania');           // Austrália
    expect(continentForIsoId('10')).toBe('Antártica');
  });

  test('retorna null para código inexistente', () => {
    expect(continentForIsoId('99999')).toBeNull();
  });

  test('retorna null para null ou undefined', () => {
    expect(continentForIsoId(null)).toBeNull();
    expect(continentForIsoId(undefined)).toBeNull();
  });
});

describe('sortArtworks', () => {
  test('ordena por year decrescente', () => {
    const out = sortArtworks([
      { id: 'a', year: 1950 },
      { id: 'b', year: 2000 },
      { id: 'c', year: 1900 },
    ]);
    expect(out.map(o => o.id)).toEqual(['b', 'a', 'c']);
  });

  test('coloca year === 9999 no final', () => {
    const out = sortArtworks([
      { id: 'a', year: 9999 },
      { id: 'b', year: 2000 },
      { id: 'c', year: 1900 },
    ]);
    expect(out.map(o => o.id)).toEqual(['b', 'c', 'a']);
  });

  test('coloca year === null no final', () => {
    const out = sortArtworks([
      { id: 'a', year: null },
      { id: 'b', year: 2000 },
      { id: 'c', year: 1900 },
    ]);
    expect(out.map(o => o.id)).toEqual(['b', 'c', 'a']);
  });

  test('coloca year undefined no final', () => {
    const out = sortArtworks([
      { id: 'a' },
      { id: 'b', year: 2000 },
    ]);
    expect(out.map(o => o.id)).toEqual(['b', 'a']);
  });

  test('agrupa 9999, null, undefined e não-numérico ao final, mantendo ordem relativa', () => {
    const out = sortArtworks([
      { id: 'a', year: 9999 },
      { id: 'b', year: null },
      { id: 'c', year: 2000 },
      { id: 'd' },
      { id: 'e', year: 'desconhecido' },
      { id: 'f', year: 1800 },
    ]);
    // Datados: c (2000), f (1800). Indatados na ordem original: a, b, d, e.
    expect(out.map(o => o.id)).toEqual(['c', 'f', 'a', 'b', 'd', 'e']);
  });

  test('não muta o array original', () => {
    const input = [
      { id: 'a', year: 1950 },
      { id: 'b', year: 2000 },
    ];
    const snapshot = input.map(o => o.id);
    sortArtworks(input);
    expect(input.map(o => o.id)).toEqual(snapshot);
  });

  test('retorna array vazio para entrada vazia', () => {
    expect(sortArtworks([])).toEqual([]);
  });
});

describe('normalizeConfidence', () => {
  test('normaliza valor PT-BR "alta" para "alta"', () => {
    expect(normalizeConfidence('alta')).toBe('alta');
  });

  test('normaliza valor PT-BR "alto" para "alta"', () => {
    expect(normalizeConfidence('alto')).toBe('alta');
  });

  test('normaliza valor PT-BR "médio" e "medio" para "médio"', () => {
    expect(normalizeConfidence('médio')).toBe('médio');
    expect(normalizeConfidence('medio')).toBe('médio');
  });

  test('normaliza valor PT-BR "baixa" e "baixo" para "baixo"', () => {
    expect(normalizeConfidence('baixa')).toBe('baixo');
    expect(normalizeConfidence('baixo')).toBe('baixo');
  });

  test('normaliza valor EN "high" para "alta"', () => {
    expect(normalizeConfidence('high')).toBe('alta');
  });

  test('normaliza valor EN "medium" para "médio"', () => {
    expect(normalizeConfidence('medium')).toBe('médio');
  });

  test('normaliza valor EN "low" para "baixo"', () => {
    expect(normalizeConfidence('low')).toBe('baixo');
  });

  test('retorna null para null ou undefined', () => {
    expect(normalizeConfidence(null)).toBeNull();
    expect(normalizeConfidence(undefined)).toBeNull();
  });

  test('retorna null para string vazia', () => {
    expect(normalizeConfidence('')).toBeNull();
  });

  test('retorna null para valor desconhecido', () => {
    expect(normalizeConfidence('desconhecido')).toBeNull();
  });

  test('é case-insensitive', () => {
    expect(normalizeConfidence('ALTA')).toBe('alta');
    expect(normalizeConfidence('HIGH')).toBe('alta');
    expect(normalizeConfidence('Medium')).toBe('médio');
  });
});
