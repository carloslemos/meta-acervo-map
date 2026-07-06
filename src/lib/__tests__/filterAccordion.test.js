/**
 * Testes do comportamento de toggle do FilterAccordion.
 *
 * A lógica central é uma máquina de estados pura:
 *   toggle(currentExpandedId, clickedId) → novo expandedId
 *
 * Extraída de src/components/FilterAccordion.svelte para teste isolado.
 * Sem renderização de componente: testa a camada de decisão que governa
 * qual nível está aberto/fechado.
 */

/**
 * Modela a função `toggle` de FilterAccordion.svelte.
 *
 * @param {string|null} currentExpandedId — nível atualmente aberto (ou null se todos fechados)
 * @param {string}      clickedId         — id do nível clicado
 * @returns {string|null}                 — novo expandedId
 */
function toggle(currentExpandedId, clickedId) {
  return currentExpandedId === clickedId ? null : clickedId;
}

// ─── Abertura ─────────────────────────────────────────────────────────────────

describe('FilterAccordion — abertura de nível', () => {
  test('abre level1 quando nenhum nível está aberto', () => {
    expect(toggle(null, 'level1')).toBe('level1');
  });

  test('abre level2 quando nenhum nível está aberto', () => {
    expect(toggle(null, 'level2')).toBe('level2');
  });
});

// ─── Fechamento ───────────────────────────────────────────────────────────────

describe('FilterAccordion — fechamento de nível (clique no mesmo aberto)', () => {
  test('fecha level1 ao clicar nele novamente', () => {
    expect(toggle('level1', 'level1')).toBeNull();
  });

  test('fecha level2 ao clicar nele novamente', () => {
    expect(toggle('level2', 'level2')).toBeNull();
  });
});

// ─── Só um aberto por vez ─────────────────────────────────────────────────────

describe('FilterAccordion — apenas um nível aberto por vez', () => {
  test('clique em level2 com level1 aberto: fecha level1, abre level2', () => {
    const result = toggle('level1', 'level2');
    expect(result).toBe('level2');
    expect(result).not.toBe('level1');
  });

  test('clique em level1 com level2 aberto: fecha level2, abre level1', () => {
    const result = toggle('level2', 'level1');
    expect(result).toBe('level1');
    expect(result).not.toBe('level2');
  });

  test('resultado é sempre string ou null — nunca array/objeto', () => {
    expect(typeof toggle(null, 'level1')).toBe('string');
    expect(toggle('level1', 'level1')).toBeNull();
    expect(typeof toggle('level1', 'level2')).toBe('string');
  });
});

// ─── Sequência realista de interações ─────────────────────────────────────────

describe('FilterAccordion — sequência de interações mobile', () => {
  test('estado inicial: nenhum nível aberto', () => {
    const initial = null;
    expect(initial).toBeNull();
  });

  test('abre level1 → abre level2 → fecha level2: estado final null', () => {
    let state = null;
    state = toggle(state, 'level1'); // abre level1
    expect(state).toBe('level1');

    state = toggle(state, 'level2'); // troca para level2
    expect(state).toBe('level2');

    state = toggle(state, 'level2'); // fecha level2
    expect(state).toBeNull();
  });

  test('abre level1 → fecha level1 → abre level2: dois níveis nunca abertos juntos', () => {
    let state = null;
    state = toggle(state, 'level1');
    expect(state).toBe('level1');

    state = toggle(state, 'level1'); // fecha
    expect(state).toBeNull();

    state = toggle(state, 'level2');
    expect(state).toBe('level2');
  });
});
