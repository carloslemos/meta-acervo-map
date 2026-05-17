import { applyFilters, applyTrajectoryFilter } from '../filterModel.js';

/**
 * Cria uma bubble de teste com defaults razoáveis e override por param.
 */
function mkBubble(overrides = {}) {
  return {
    id: 'b1',
    creator: 'Tarsila do Amaral',
    type: 'birth',
    acervos: ['MAC'],
    educatedAt: [],
    nationality: 'Brazilian',
    gender: 'female',
    country: 'Brazil',
    continent: 'América do Sul',
    ...overrides,
  };
}

function emptyFilters(overrides = {}) {
  return {
    activeAcervos: new Set(['MAC', 'MASP', 'MAM']),
    activeGenders: new Set(),
    selectedCreators: new Set(),
    selectedSchools: new Set(),
    selectedNationalities: new Set(),
    selectedLocalidade: null,
    ...overrides,
  };
}

describe('applyFilters', () => {
  const tarsila = mkBubble({ id: 'b1', creator: 'Tarsila do Amaral', gender: 'female', nationality: 'Brazilian', country: 'Brazil', continent: 'América do Sul' });
  const picasso = mkBubble({ id: 'b2', creator: 'Pablo Picasso', gender: 'male', nationality: 'Spanish', country: 'Spain', continent: 'Europa', acervos: ['MASP'], educatedAt: ['Real Academia'] });
  const kahlo   = mkBubble({ id: 'b3', creator: 'Frida Kahlo', gender: 'female', nationality: 'Mexican', country: 'Mexico', continent: 'América do Norte', acervos: ['MAM'], educatedAt: ['ENP'] });
  const all = [tarsila, picasso, kahlo];

  test('sem filtros ativos retorna todas as bubbles', () => {
    expect(applyFilters(all, emptyFilters())).toHaveLength(3);
  });

  test('filtra por um criador selecionado', () => {
    const out = applyFilters(all, emptyFilters({ selectedCreators: new Set(['Tarsila do Amaral']) }));
    expect(out).toEqual([tarsila]);
  });

  test('filtra por múltiplos criadores (união)', () => {
    const out = applyFilters(all, emptyFilters({ selectedCreators: new Set(['Tarsila do Amaral', 'Frida Kahlo']) }));
    expect(out.map(b => b.id).sort()).toEqual(['b1', 'b3']);
  });

  test('filtra por escolas multi-select (qualquer match em educatedAt)', () => {
    const out = applyFilters(all, emptyFilters({ selectedSchools: new Set(['ENP', 'Real Academia']) }));
    expect(out.map(b => b.id).sort()).toEqual(['b2', 'b3']);
  });

  test('filtra por nacionalidades multi-select', () => {
    const out = applyFilters(all, emptyFilters({ selectedNationalities: new Set(['Spanish', 'Mexican']) }));
    expect(out.map(b => b.id).sort()).toEqual(['b2', 'b3']);
  });

  test('selectedLocalidade casa com country', () => {
    const out = applyFilters(all, emptyFilters({ selectedLocalidade: 'Brazil' }));
    expect(out).toEqual([tarsila]);
  });

  test('selectedLocalidade casa com continent', () => {
    const out = applyFilters(all, emptyFilters({ selectedLocalidade: 'Europa' }));
    expect(out).toEqual([picasso]);
  });

  test('selectedLocalidade null não filtra', () => {
    expect(applyFilters(all, emptyFilters({ selectedLocalidade: null }))).toHaveLength(3);
  });

  test('combina gender + creators + localidade (interseção)', () => {
    const out = applyFilters(all, emptyFilters({
      activeGenders: new Set(['female']),
      selectedCreators: new Set(['Tarsila do Amaral', 'Pablo Picasso']),
      selectedLocalidade: 'América do Sul',
    }));
    expect(out).toEqual([tarsila]);
  });

  test('activeGenders vazio significa "todos"', () => {
    expect(applyFilters(all, emptyFilters({ activeGenders: new Set() }))).toHaveLength(3);
  });

  test('bubble sem acervos sempre passa pelo filtro de acervos', () => {
    const semAcervo = mkBubble({ id: 'b9', acervos: [] });
    const out = applyFilters([semAcervo], emptyFilters({ activeAcervos: new Set(['X']) }));
    expect(out).toEqual([semAcervo]);
  });
});

describe('applyTrajectoryFilter', () => {
  const seg = (fromId, toId) => ({
    from: { id: fromId }, to: { id: toId }, kind: 'birth-death',
  });
  const trajectories = [
    { creator: 'A', segments: [seg('b1', 'b2'), seg('b2', 'b3')] },
    { creator: 'B', segments: [seg('b4', 'b5')] },
  ];

  test('mantém somente segmentos com ambos extremos visíveis', () => {
    const visible = new Set(['b1', 'b2']);
    const out = applyTrajectoryFilter(trajectories, visible);
    expect(out).toHaveLength(1);
    expect(out[0].creator).toBe('A');
    expect(out[0].segments).toHaveLength(1);
  });

  test('conjunto vazio remove tudo', () => {
    expect(applyTrajectoryFilter(trajectories, new Set())).toEqual([]);
  });

  test('todos visíveis mantém todas as trajetórias', () => {
    const visible = new Set(['b1', 'b2', 'b3', 'b4', 'b5']);
    const out = applyTrajectoryFilter(trajectories, visible);
    expect(out).toHaveLength(2);
  });
});
