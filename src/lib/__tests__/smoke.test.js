import {
  TYPE_COLOR,
  BUBBLE_RADIUS,
  CENTRAL_ROTATION,
  TRAJECTORY_FLOW_ENABLED,
  PROJECTION_3D_SCALE_FACTOR,
  PROJECTION_2D_BASE_SCALE,
} from '../constants.js';

// Smoke test — confirma que o ambiente Jest está configurado corretamente.
test('ambiente Jest operacional', () => {
  expect(1 + 1).toBe(2);
});

/**
 * Smoke test das constantes críticas do WorldMap.
 * Verifica que o módulo de constantes importa sem erro e que os valores
 * usados pelo WorldMap para inicializar canvas/projeção existem e são válidos.
 * Substitui o smoke test de montagem de componente enquanto não há jsdom configurado.
 */
describe('WorldMap — smoke: constantes de inicialização', () => {
  test('TYPE_COLOR tem as quatro chaves canônicas', () => {
    expect(typeof TYPE_COLOR.birth).toBe('string');
    expect(typeof TYPE_COLOR.death).toBe('string');
    expect(typeof TYPE_COLOR.education).toBe('string');
    expect(typeof TYPE_COLOR.acervo).toBe('string');
  });

  test('BUBBLE_RADIUS é positivo', () => {
    expect(BUBBLE_RADIUS).toBeGreaterThan(0);
  });

  test('CENTRAL_ROTATION é array de 3 números', () => {
    expect(Array.isArray(CENTRAL_ROTATION)).toBe(true);
    expect(CENTRAL_ROTATION).toHaveLength(3);
    CENTRAL_ROTATION.forEach(v => expect(typeof v).toBe('number'));
  });

  test('TRAJECTORY_FLOW_ENABLED é booleano', () => {
    expect(typeof TRAJECTORY_FLOW_ENABLED).toBe('boolean');
  });

  test('fatores de escala da projeção são positivos', () => {
    expect(PROJECTION_3D_SCALE_FACTOR).toBeGreaterThan(0);
    expect(PROJECTION_2D_BASE_SCALE).toBeGreaterThan(0);
  });
});
