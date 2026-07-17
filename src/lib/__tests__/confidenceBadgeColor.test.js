import { confidenceBadgeColor } from '../constants.js';

describe('confidenceBadgeColor', () => {
  // ─── Valores canônicos normalizados (saída de normalizeConfidence) ──────────

  test('alta → var(--confidence-alta)', () => {
    expect(confidenceBadgeColor('alta')).toBe('var(--confidence-alta)');
  });

  test('médio → var(--confidence-media)', () => {
    expect(confidenceBadgeColor('médio')).toBe('var(--confidence-media)');
  });

  test('baixo → var(--confidence-baixa)', () => {
    expect(confidenceBadgeColor('baixo')).toBe('var(--confidence-baixa)');
  });

  // ─── Variantes brutas do CSV (PT) ────────────────────────────────────────────

  test('alto → var(--confidence-alta)', () => {
    expect(confidenceBadgeColor('alto')).toBe('var(--confidence-alta)');
  });

  test('medio (sem acento) → var(--confidence-media)', () => {
    expect(confidenceBadgeColor('medio')).toBe('var(--confidence-media)');
  });

  test('baixa → var(--confidence-baixa)', () => {
    expect(confidenceBadgeColor('baixa')).toBe('var(--confidence-baixa)');
  });

  // ─── Valores EN brutos do CSV ────────────────────────────────────────────────

  test('high → var(--confidence-alta)', () => {
    expect(confidenceBadgeColor('high')).toBe('var(--confidence-alta)');
  });

  test('medium → var(--confidence-media)', () => {
    expect(confidenceBadgeColor('medium')).toBe('var(--confidence-media)');
  });

  test('low → var(--confidence-baixa)', () => {
    expect(confidenceBadgeColor('low')).toBe('var(--confidence-baixa)');
  });

  // ─── Case-insensitivity ──────────────────────────────────────────────────────

  test('ALTA (maiúsculo) → var(--confidence-alta)', () => {
    expect(confidenceBadgeColor('ALTA')).toBe('var(--confidence-alta)');
  });

  test('High (misto) → var(--confidence-alta)', () => {
    expect(confidenceBadgeColor('High')).toBe('var(--confidence-alta)');
  });

  // ─── Fallback ────────────────────────────────────────────────────────────────

  test('null → fallback var(--confidence-media)', () => {
    expect(confidenceBadgeColor(null)).toBe('var(--confidence-media)');
  });

  test('undefined → fallback var(--confidence-media)', () => {
    expect(confidenceBadgeColor(undefined)).toBe('var(--confidence-media)');
  });

  test('string inválida → fallback var(--confidence-media)', () => {
    expect(confidenceBadgeColor('invalido')).toBe('var(--confidence-media)');
  });

  test('string vazia → fallback var(--confidence-media)', () => {
    expect(confidenceBadgeColor('')).toBe('var(--confidence-media)');
  });
});
