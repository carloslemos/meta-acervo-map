import { profileStats } from '../profileStats.js';

/** Cria uma bubble de nascimento com defaults razoáveis. */
function mkBirth(creator, overrides = {}) {
  return { type: 'birth', creator, gender: 'female', continent: 'América do Sul', ...overrides };
}

/** Cria uma bubble de formação com defaults razoáveis. */
function mkEdu(creator, overrides = {}) {
  return { type: 'education', creator, gender: 'female', schoolName: 'USP', continent: 'América do Sul', place: '', ...overrides };
}

/** Cria uma bubble de morte com defaults razoáveis. */
function mkDeath(creator, overrides = {}) {
  return { type: 'death', creator, gender: 'female', continent: 'América do Sul', ...overrides };
}

describe('profileStats', () => {
  test('conjunto vazio → todos os valores null/[]', () => {
    const result = profileStats([]);
    expect(result.genderTop).toBeNull();
    expect(result.formationTop).toBeNull();
    expect(result.birthByRegion).toEqual([]);
    expect(result.formationByRegion).toEqual([]);
  });

  test('filtra e ignora bubbles de tipo acervo', () => {
    const result = profileStats([
      { type: 'acervo', creator: 'MAC', gender: 'unknown', continent: 'América do Sul' },
    ]);
    expect(result.genderTop).toBeNull();
  });

  test('todos os criadores com o mesmo gênero → genderTop.pct = 100', () => {
    const bubbles = [
      mkBirth('Tarsila', { gender: 'female' }),
      mkBirth('Frida', { gender: 'female' }),
      mkBirth('Anita', { gender: 'female' }),
    ];
    const result = profileStats(bubbles);
    expect(result.genderTop).toEqual({ label: 'female', pct: 100 });
  });

  test('dois gêneros → retorna o mais frequente', () => {
    const bubbles = [
      mkBirth('Tarsila', { gender: 'female' }),
      mkBirth('Frida', { gender: 'female' }),
      mkBirth('Picasso', { gender: 'male' }),
    ];
    const result = profileStats(bubbles);
    expect(result.genderTop?.label).toBe('female');
    expect(result.genderTop?.pct).toBeGreaterThan(50);
  });

  test('criador com múltiplas bubbles (birth + education + death) → deduplicado corretamente', () => {
    // Tarsila aparece 3x (birth, edu, death) mas deve contar como 1 criador
    const bubbles = [
      mkBirth('Tarsila', { gender: 'female' }),
      mkEdu('Tarsila', { gender: 'female' }),
      mkDeath('Tarsila', { gender: 'female' }),
      mkBirth('Frida', { gender: 'female' }),
    ];
    const result = profileStats(bubbles);
    // 2 criadores únicos (Tarsila, Frida), ambas female → 100%
    expect(result.genderTop?.pct).toBe(100);
    expect(result.genderTop?.label).toBe('female');
  });

  test('birthByRegion: mais de 4 regiões → retorna apenas top 4, ordem decrescente', () => {
    const bubbles = [
      mkBirth('c1', { continent: 'Europa' }),
      mkBirth('c2', { continent: 'Europa' }),
      mkBirth('c3', { continent: 'Europa' }),
      mkBirth('c4', { continent: 'América do Sul' }),
      mkBirth('c5', { continent: 'América do Sul' }),
      mkBirth('c6', { continent: 'Ásia' }),
      mkBirth('c7', { continent: 'África' }),
      mkBirth('c8', { continent: 'América do Norte' }),
      mkBirth('c9', { continent: 'Oceania' }),
    ];
    const result = profileStats(bubbles);
    expect(result.birthByRegion).toHaveLength(4);
    // Primeiro deve ser Europa (3/9)
    expect(result.birthByRegion[0].label).toBe('Europa');
    // Segundo deve ser América do Sul (2/9)
    expect(result.birthByRegion[1].label).toBe('América do Sul');
    // Ordem decrescente
    for (let i = 0; i < result.birthByRegion.length - 1; i++) {
      expect(result.birthByRegion[i].pct).toBeGreaterThanOrEqual(result.birthByRegion[i + 1].pct);
    }
  });

  test('formationByRegion: top 4 em ordem decrescente', () => {
    const bubbles = [
      mkEdu('c1', { continent: 'Europa' }),
      mkEdu('c2', { continent: 'Europa' }),
      mkEdu('c3', { continent: 'América do Sul' }),
      mkEdu('c4', { continent: 'Ásia' }),
      mkEdu('c5', { continent: 'África' }),
      mkEdu('c6', { continent: 'Oceania' }),
    ];
    const result = profileStats(bubbles);
    expect(result.formationByRegion).toHaveLength(4);
    expect(result.formationByRegion[0].label).toBe('Europa');
  });

  test('empate entre regiões → ordem estável e determinística (localeCompare)', () => {
    const bubbles = [
      mkBirth('c1', { continent: 'Europa' }),
      mkBirth('c2', { continent: 'Ásia' }),
    ];
    const result1 = profileStats(bubbles);
    const result2 = profileStats(bubbles);
    expect(result1.birthByRegion.map(r => r.label))
      .toEqual(result2.birthByRegion.map(r => r.label));
  });

  test('formationTop: retorna o local de formação mais frequente', () => {
    const bubbles = [
      mkEdu('c1', { schoolName: 'USP' }),
      mkEdu('c2', { schoolName: 'USP' }),
      mkEdu('c3', { schoolName: 'École des Beaux-Arts' }),
    ];
    const result = profileStats(bubbles);
    expect(result.formationTop?.label).toBe('USP');
  });

  test('sem bubbles de education → formationTop null, formationByRegion []', () => {
    const bubbles = [
      mkBirth('c1'),
      mkBirth('c2'),
    ];
    const result = profileStats(bubbles);
    expect(result.formationTop).toBeNull();
    expect(result.formationByRegion).toEqual([]);
  });
});
