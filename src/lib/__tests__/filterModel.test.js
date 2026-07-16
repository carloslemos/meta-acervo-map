import {
  applyFilters,
  applyTrajectoryFilter,
  FILTER_FIELDS,
  FIELD_PREDICATES,
  makeFilterContext,
  bubbleMatchesFields,
  computeAvailableOptions,
} from '../filterModel.js';

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

/**
 * Mock do mapa reverso de localidades para testes.
 * Mapeia nomes canônicos de volta a si mesmos (EN → EN, PT → PT).
 */
const mockReverseMap = new Map([
  // Países
  ['Brazil', 'Brazil'],
  ['Spain', 'Spain'],
  ['Mexico', 'Mexico'],
  // Continentes
  ['América do Sul', 'América do Sul'],
  ['Europa', 'Europa'],
  ['América do Norte', 'América do Norte'],
]);

describe('applyFilters', () => {
  const tarsila = mkBubble({ id: 'b1', creator: 'Tarsila do Amaral', gender: 'female', nationality: 'Brazilian', country: 'Brazil', continent: 'América do Sul' });
  const picasso = mkBubble({ id: 'b2', creator: 'Pablo Picasso', gender: 'male', nationality: 'Spanish', country: 'Spain', continent: 'Europa', acervos: ['MASP'], educatedAt: ['Real Academia'] });
  const kahlo   = mkBubble({ id: 'b3', creator: 'Frida Kahlo', gender: 'female', nationality: 'Mexican', country: 'Mexico', continent: 'América do Norte', acervos: ['MAM'], educatedAt: ['ENP'] });
  const all = [tarsila, picasso, kahlo];

  test('sem filtros ativos retorna nada (ambos filtros devem estar preenchidos)', () => {
    expect(applyFilters(all, emptyFilters(), mockReverseMap)).toHaveLength(0);
  });

  test('filtra por um criador selecionado (com ambos filtros preenchidos)', () => {
    const out = applyFilters(all, emptyFilters({ activeAcervos: new Set(['MAC', 'MASP', 'MAM']), activeGenders: new Set(['female', 'male']), selectedCreators: new Set(['Tarsila do Amaral']) }), mockReverseMap);
    expect(out).toEqual([tarsila]);
  });

  test('filtra por múltiplos criadores (união, com ambos filtros preenchidos)', () => {
    const out = applyFilters(all, emptyFilters({ activeAcervos: new Set(['MAC', 'MASP', 'MAM']), activeGenders: new Set(['female', 'male']), selectedCreators: new Set(['Tarsila do Amaral', 'Frida Kahlo']) }), mockReverseMap);
    expect(out.map(b => b.id).sort()).toEqual(['b1', 'b3']);
  });

  test('filtra por escolas multi-select (qualquer match em educatedAt, com ambos filtros preenchidos)', () => {
    const out = applyFilters(all, emptyFilters({ activeAcervos: new Set(['MAC', 'MASP', 'MAM']), activeGenders: new Set(['female', 'male']), selectedSchools: new Set(['ENP', 'Real Academia']) }), mockReverseMap);
    expect(out.map(b => b.id).sort()).toEqual(['b2', 'b3']);
  });

  test('filtra por nacionalidades multi-select (com ambos filtros preenchidos)', () => {
    const out = applyFilters(all, emptyFilters({ activeAcervos: new Set(['MAC', 'MASP', 'MAM']), activeGenders: new Set(['female', 'male']), selectedNationalities: new Set(['Spanish', 'Mexican']) }), mockReverseMap);
    expect(out.map(b => b.id).sort()).toEqual(['b2', 'b3']);
  });

  test('selectedLocalidade casa com country (com ambos filtros preenchidos)', () => {
    const out = applyFilters(all, emptyFilters({ activeAcervos: new Set(['MAC', 'MASP', 'MAM']), activeGenders: new Set(['female', 'male']), selectedLocalidade: 'Brazil' }), mockReverseMap);
    expect(out).toEqual([tarsila]);
  });

  test('selectedLocalidade casa com continent (com ambos filtros preenchidos)', () => {
    const out = applyFilters(all, emptyFilters({ activeAcervos: new Set(['MAC', 'MASP', 'MAM']), activeGenders: new Set(['female', 'male']), selectedLocalidade: 'Europa' }), mockReverseMap);
    expect(out).toEqual([picasso]);
  });

  test('selectedLocalidade null não filtra localidade (mas ambos filtros devem estar preenchidos)', () => {
    expect(applyFilters(all, emptyFilters({ activeAcervos: new Set(['MAC', 'MASP', 'MAM']), activeGenders: new Set(['female', 'male']), selectedLocalidade: null }), mockReverseMap)).toHaveLength(3);
  });

  test('combina acervo + gender + creators + localidade (interseção)', () => {
    const out = applyFilters(all, emptyFilters({
      activeAcervos: new Set(['MAC', 'MASP', 'MAM']),
      activeGenders: new Set(['female']),
      selectedCreators: new Set(['Tarsila do Amaral', 'Pablo Picasso']),
      selectedLocalidade: 'América do Sul',
    }), mockReverseMap);
    expect(out).toEqual([tarsila]);
  });

  test('activeGenders vazio filtra tudo', () => {
    expect(applyFilters(all, emptyFilters({ activeGenders: new Set() }), mockReverseMap)).toHaveLength(0);
  });

  test('bubble sem acervos é sempre filtrada', () => {
    const semAcervo = mkBubble({ id: 'b9', acervos: [] });
    const out = applyFilters([semAcervo], emptyFilters({ activeAcervos: new Set(['MAC', 'MASP', 'MAM']), activeGenders: new Set(['female']) }), mockReverseMap);
    expect(out).toHaveLength(0);
  });

  test('activeAcervos vazio filtra tudo (mesmo que gênero selecionado)', () => {
    const out = applyFilters(all, emptyFilters({ activeAcervos: new Set(), activeGenders: new Set(['female', 'male']) }), mockReverseMap);
    expect(out).toHaveLength(0);
  });

  test('se acervo vazio mas gênero selecionado → retorna vazio', () => {
    const out = applyFilters(all, emptyFilters({ activeAcervos: new Set(), activeGenders: new Set(['female']) }), mockReverseMap);
    expect(out).toHaveLength(0);
  });

  test('se gênero vazio mas acervo selecionado → retorna vazio', () => {
    const out = applyFilters(all, emptyFilters({ activeGenders: new Set(), activeAcervos: new Set(['MAC', 'MASP']) }), mockReverseMap);
    expect(out).toHaveLength(0);
  });
});

describe('predicados por faceta (decomposição)', () => {
  const tarsila = mkBubble({ id: 'b1', creator: 'Tarsila do Amaral', gender: 'female', nationality: 'Brazilian', country: 'Brazil', continent: 'América do Sul' });
  const picasso = mkBubble({ id: 'b2', creator: 'Pablo Picasso', gender: 'male', nationality: 'Spanish', country: 'Spain', continent: 'Europa', acervos: ['MASP'], educatedAt: ['Real Academia'] });
  const all = [tarsila, picasso];

  test('FILTER_FIELDS cobre exatamente as chaves de FIELD_PREDICATES', () => {
    expect([...FILTER_FIELDS].sort()).toEqual(Object.keys(FIELD_PREDICATES).sort());
  });

  test('makeFilterContext resolve a localidade traduzida ao valor canônico', () => {
    const reverse = new Map([['Espanha', 'Spain']]);
    const ctx = makeFilterContext(emptyFilters({ selectedLocalidade: 'Espanha' }), reverse);
    expect(ctx.canonicalLocalidade).toBe('Spain');
  });

  test('makeFilterContext deixa canonicalLocalidade null quando não há seleção', () => {
    const ctx = makeFilterContext(emptyFilters({ selectedLocalidade: null }), mockReverseMap);
    expect(ctx.canonicalLocalidade).toBeNull();
  });

  test('cada predicado avalia apenas a sua própria faceta', () => {
    const ctx = makeFilterContext(emptyFilters({ selectedCreators: new Set(['Tarsila do Amaral']) }), mockReverseMap);
    expect(FIELD_PREDICATES.creators(tarsila, ctx)).toBe(true);
    expect(FIELD_PREDICATES.creators(picasso, ctx)).toBe(false);
    // A faceta de acervo, isolada, ignora a seleção de criador
    expect(FIELD_PREDICATES.acervos(picasso, ctx)).toBe(true);
  });

  test('bubbleMatchesFields com subconjunto ignora o campo omitido (base do N-1)', () => {
    const ctx = makeFilterContext(emptyFilters({
      activeAcervos: new Set(['MAC', 'MASP', 'MAM']),
      activeGenders: new Set(['female', 'male']),
      selectedCreators: new Set(['Tarsila do Amaral']),
    }), mockReverseMap);
    const semCreators = FILTER_FIELDS.filter(f => f !== 'creators');
    // Sem a faceta 'creators', Picasso volta a passar
    expect(bubbleMatchesFields(picasso, ctx, semCreators)).toBe(true);
    // Com todas as facetas, Picasso é excluído pela seleção de criador
    expect(bubbleMatchesFields(picasso, ctx, FILTER_FIELDS)).toBe(false);
  });

  test('applyFilters equivale à conjunção de todos os predicados via bubbleMatchesFields', () => {
    const filters = emptyFilters({
      activeAcervos: new Set(['MAC', 'MASP', 'MAM']),
      activeGenders: new Set(['female', 'male']),
      selectedNationalities: new Set(['Spanish']),
    });
    const ctx = makeFilterContext(filters, mockReverseMap);
    const manual = all.filter(b => bubbleMatchesFields(b, ctx, FILTER_FIELDS));
    expect(applyFilters(all, filters, mockReverseMap)).toEqual(manual);
  });
});

describe('computeAvailableOptions', () => {
  const tarsila = mkBubble({ id: 'b1', creator: 'Tarsila do Amaral', gender: 'female', nationality: 'Brazilian', country: 'Brazil', continent: 'América do Sul', acervos: ['MAC'], educatedAt: ['ELPA'] });
  const picasso = mkBubble({ id: 'b2', creator: 'Pablo Picasso', gender: 'male', nationality: 'Spanish', country: 'Spain', continent: 'Europa', acervos: ['MASP'], educatedAt: ['Real Academia'] });
  const kahlo   = mkBubble({ id: 'b3', creator: 'Frida Kahlo', gender: 'female', nationality: 'Mexican', country: 'Mexico', continent: 'América do Norte', acervos: ['MAM'], educatedAt: ['ENP'] });
  const all = [tarsila, picasso, kahlo];

  /** Estado default do app: acervo/gênero com tudo selecionado, demais vazios. */
  function defaultFilters(overrides = {}) {
    return emptyFilters({
      activeAcervos: new Set(['MAC', 'MASP', 'MAM']),
      activeGenders: new Set(['female', 'male']),
      ...overrides,
    });
  }

  test('facet vazio (estado default): cada campo oferece todos os seus valores', () => {
    const opts = computeAvailableOptions(all, defaultFilters(), mockReverseMap);
    expect([...opts.acervos].sort()).toEqual(['MAC', 'MAM', 'MASP']);
    expect([...opts.genders].sort()).toEqual(['female', 'male']);
    expect([...opts.creators].sort()).toEqual(['Frida Kahlo', 'Pablo Picasso', 'Tarsila do Amaral']);
  });

  test('auto-não-restrição: selecionar um gênero não remove os outros da lista de gêneros', () => {
    const opts = computeAvailableOptions(all, defaultFilters({ activeGenders: new Set(['female']) }), mockReverseMap);
    // a faceta de gênero ignora o próprio predicado → 'male' segue disponível
    expect([...opts.genders].sort()).toEqual(['female', 'male']);
  });

  test('auto-não-restrição: selecionar um acervo não remove os outros acervos', () => {
    const opts = computeAvailableOptions(all, defaultFilters({ activeAcervos: new Set(['MAC']) }), mockReverseMap);
    expect([...opts.acervos].sort()).toEqual(['MAC', 'MAM', 'MASP']);
  });

  test('N-1: filtrar por localidade restringe os acervos disponíveis dos demais', () => {
    const opts = computeAvailableOptions(all, defaultFilters({ selectedLocalidade: 'Brazil' }), mockReverseMap);
    // só a bubble do Brasil (Tarsila/MAC) sobrevive ao aplicar os outros predicados
    expect([...opts.acervos]).toEqual(['MAC']);
    // e apenas a própria Tarsila entre os criadores
    expect([...opts.creators]).toEqual(['Tarsila do Amaral']);
  });

  test('N-1 com dois campos ativos: só valores compatíveis com ambos', () => {
    const opts = computeAvailableOptions(all, defaultFilters({
      activeGenders: new Set(['female']),
      selectedNationalities: new Set(['Mexican']),
    }), mockReverseMap);
    // female ∩ mexican → apenas Kahlo/MAM
    expect([...opts.acervos]).toEqual(['MAM']);
  });

  test('localidade oferece país e continente das bubbles remanescentes', () => {
    const opts = computeAvailableOptions(all, defaultFilters({ activeGenders: new Set(['female']) }), mockReverseMap);
    expect(opts.localidade.has('Brazil')).toBe(true);
    expect(opts.localidade.has('América do Sul')).toBe(true);
    expect(opts.localidade.has('Spain')).toBe(false);
  });

  test('tipos de bubble não são faceta: não restringem os acervos disponíveis', () => {
    const nasc = mkBubble({ id: 'x1', type: 'birth', acervos: ['MAC'] });
    const morte = mkBubble({ id: 'x2', type: 'death', acervos: ['MASP'] });
    const opts = computeAvailableOptions([nasc, morte], defaultFilters(), mockReverseMap);
    expect([...opts.acervos].sort()).toEqual(['MAC', 'MASP']);
  });

  test('cobre exatamente as facetas de FILTER_FIELDS', () => {
    const opts = computeAvailableOptions(all, defaultFilters(), mockReverseMap);
    expect(Object.keys(opts).sort()).toEqual([...FILTER_FIELDS].sort());
  });

  test('antiorfão: toda opção de artista oferecida gera recorte não-vazio', () => {
    // Recorte com um acervo selecionado → só criadores desse acervo são oferecidos
    const filtros = defaultFilters({ activeAcervos: new Set(['MASP']) });
    const opts = computeAvailableOptions(all, filtros, mockReverseMap);
    // cada criador disponível, ao ser selecionado junto do recorte, deixa ≥1 bubble
    for (const creator of opts.creators) {
      const out = applyFilters(all, { ...filtros, selectedCreators: new Set([creator]) }, mockReverseMap);
      expect(out.length).toBeGreaterThan(0);
    }
    // Picasso (MASP) é oferecido; Tarsila (MAC) e Kahlo (MAM) não
    expect([...opts.creators]).toEqual(['Pablo Picasso']);
  });

  test('antiorfão: localidade incompatível com o acervo selecionado não é oferecida', () => {
    const opts = computeAvailableOptions(all, defaultFilters({ activeAcervos: new Set(['MASP']) }), mockReverseMap);
    // MASP só existe na bubble da Espanha/Europa
    expect(opts.localidade.has('Spain')).toBe(true);
    expect(opts.localidade.has('Europa')).toBe(true);
    expect(opts.localidade.has('Brazil')).toBe(false);
    expect(opts.localidade.has('Mexico')).toBe(false);
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
