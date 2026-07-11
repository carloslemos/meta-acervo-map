import { applyZoomStep } from '../zoomUtils.js';

describe('applyZoomStep', () => {
  describe('escala 2D [1, 8]', () => {
    const scaleExtent2D = [1, 8];

    test('aumenta zoom dentro dos limites', () => {
      const currentK = 1;
      const factor = 1.3;
      const result = applyZoomStep(currentK, factor, scaleExtent2D);
      expect(result).toBeCloseTo(1.3, 5);
    });

    test('diminui zoom dentro dos limites', () => {
      const currentK = 1.3;
      const factor = 1 / 1.3; // ~0.769
      const result = applyZoomStep(currentK, factor, scaleExtent2D);
      expect(result).toBeCloseTo(1, 5);
    });

    test('clamp no máximo', () => {
      const currentK = 7; // 7 * 1.3 = 9.1, clamped a 8
      const factor = 1.3;
      const result = applyZoomStep(currentK, factor, scaleExtent2D);
      expect(result).toBeCloseTo(8, 5);
    });

    test('clamp no mínimo', () => {
      const currentK = 0.5; // 0.5 * 0.5 = 0.25, clamped a 1
      const factor = 0.5;
      const result = applyZoomStep(currentK, factor, scaleExtent2D);
      expect(result).toBeCloseTo(1, 5);
    });

    test('já no máximo, não ultrapassa', () => {
      const currentK = 8;
      const factor = 1.3;
      const result = applyZoomStep(currentK, factor, scaleExtent2D);
      expect(result).toBeCloseTo(8, 5);
    });

    test('já no mínimo, não reduz mais', () => {
      const currentK = 1;
      const factor = 0.5;
      const result = applyZoomStep(currentK, factor, scaleExtent2D);
      expect(result).toBeCloseTo(1, 5);
    });
  });

  describe('escala 3D [0.5, 5]', () => {
    const scaleExtent3D = [0.5, 5];

    test('aumenta zoom dentro dos limites', () => {
      const currentK = 1;
      const factor = 1.3;
      const result = applyZoomStep(currentK, factor, scaleExtent3D);
      expect(result).toBeCloseTo(1.3, 5);
    });

    test('clamp no máximo 3D', () => {
      const currentK = 4.5; // 4.5 * 1.3 = 5.85, clamped a 5
      const factor = 1.3;
      const result = applyZoomStep(currentK, factor, scaleExtent3D);
      expect(result).toBeCloseTo(5, 5);
    });

    test('clamp no mínimo 3D', () => {
      const currentK = 1;
      const factor = 0.5;
      const result = applyZoomStep(currentK, factor, scaleExtent3D);
      expect(result).toBeCloseTo(0.5, 5); // 1 * 0.5 = 0.5
    });

    test('abaixo do mínimo 3D é clamped', () => {
      const currentK = 0.6;
      const factor = 0.5;
      const result = applyZoomStep(currentK, factor, scaleExtent3D);
      expect(result).toBeCloseTo(0.5, 5); // 0.6 * 0.5 = 0.3, clamped a 0.5
    });
  });

  describe('casos extremos', () => {
    test('factor = 1 não altera escala', () => {
      const result = applyZoomStep(2.5, 1, [1, 8]);
      expect(result).toBeCloseTo(2.5, 5);
    });

    test('factor muito grande é clamped', () => {
      const result = applyZoomStep(1, 100, [1, 8]);
      expect(result).toBeCloseTo(8, 5);
    });

    test('factor muito pequeno é clamped', () => {
      const result = applyZoomStep(8, 0.01, [1, 8]);
      expect(result).toBeCloseTo(1, 5);
    });

    test('escala inicial fora dos limites é clamped', () => {
      const result = applyZoomStep(10, 1, [1, 8]);
      expect(result).toBeCloseTo(8, 5); // 10 * 1 = 10, clamped a 8
    });
  });
});
