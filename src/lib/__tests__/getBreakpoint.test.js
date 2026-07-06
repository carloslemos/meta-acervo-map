import { getBreakpoint, BREAKPOINT_TABLET, BREAKPOINT_DESKTOP } from '../constants.js';

describe('getBreakpoint', () => {
  // ─── Valores típicos de cada faixa ─────────────────────────────────────
  test('retorna "mobile" para largura típica de smartphone (375px)', () => {
    expect(getBreakpoint(375)).toBe('mobile');
  });

  test('retorna "tablet" para largura típica de tablet (1024px)', () => {
    expect(getBreakpoint(1024)).toBe('tablet');
  });

  test('retorna "desktop" para largura típica de desktop (1440px)', () => {
    expect(getBreakpoint(1440)).toBe('desktop');
  });

  // ─── Limites críticos dos breakpoints ──────────────────────────────────
  test('759px (um abaixo de BREAKPOINT_TABLET) → "mobile"', () => {
    expect(getBreakpoint(BREAKPOINT_TABLET - 1)).toBe('mobile');
  });

  test('760px (exatamente BREAKPOINT_TABLET) → "tablet"', () => {
    expect(getBreakpoint(BREAKPOINT_TABLET)).toBe('tablet');
  });

  test('1379px (um abaixo de BREAKPOINT_DESKTOP) → "tablet"', () => {
    expect(getBreakpoint(BREAKPOINT_DESKTOP - 1)).toBe('tablet');
  });

  test('1380px (exatamente BREAKPOINT_DESKTOP) → "desktop"', () => {
    expect(getBreakpoint(BREAKPOINT_DESKTOP)).toBe('desktop');
  });

  // ─── Casos extremos ────────────────────────────────────────────────────
  test('0px → "mobile"', () => {
    expect(getBreakpoint(0)).toBe('mobile');
  });

  test('largura muito grande (9999px) → "desktop"', () => {
    expect(getBreakpoint(9999)).toBe('desktop');
  });
});
