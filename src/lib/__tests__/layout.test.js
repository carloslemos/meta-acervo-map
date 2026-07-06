/**
 * Testes de layout responsivo.
 *
 * Cobre a lógica de decisão de layout a partir da largura de viewport,
 * usando as constantes canônicas de src/lib/constants.js.
 *
 * Sem renderização de componente: testa a camada de decisão (getBreakpoint +
 * constantes de dimensão) que governa qual cabeçalho/painel é exibido em
 * cada faixa (mobile / tablet / desktop), e a consistência das dimensões da
 * ArtworkStrip por breakpoint.
 *
 * Referência: Figma node 505-4840 "Tablet e Mobile".
 */
import {
  getBreakpoint,
  BREAKPOINT_TABLET,
  BREAKPOINT_DESKTOP,
  SIDEBAR_WIDTH_DESKTOP,
  SIDEBAR_WIDTH_TABLET,
  MOBILE_HEADER_HEIGHT,
  ARTWORK_STRIP_HEIGHT_EXPANDED,
  ARTWORK_STRIP_HEIGHT_COLLAPSED,
  ARTWORK_STRIP_HEIGHT_MOBILE_EXPANDED,
  ARTWORK_STRIP_HEIGHT_MOBILE_COLLAPSED,
  ACCORDION_ITEM_HEIGHT,
} from '../constants.js';

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Retorna a configuração de layout para uma dada largura de viewport.
 * Replica a lógica condicional de App.svelte (`$: breakpoint`, `$: isMobile`).
 *
 * @param {number} width
 */
function layoutFor(width) {
  const bp = getBreakpoint(width);
  return {
    breakpoint: bp,
    /** App.svelte: `{#if isMobile}` → MobileHeader + FilterAccordion */
    showMobileHeader: bp === 'mobile',
    showFilterAccordion: bp === 'mobile',
    /** App.svelte: `{#if !isMobile}` → Header + Sidebar */
    showSidebar: bp !== 'mobile',
    /** Largura da sidebar em px (0 em mobile, onde não há sidebar fixa) */
    sidebarWidth: bp === 'desktop'
      ? SIDEBAR_WIDTH_DESKTOP
      : bp === 'tablet'
        ? SIDEBAR_WIDTH_TABLET
        : 0,
  };
}

// ─── Mobile (< 760px) ─────────────────────────────────────────────────────────

describe('layout mobile (< 760px)', () => {
  const W = 375; // iPhone SE

  test('exibe MobileHeader no mobile', () => {
    expect(layoutFor(W).showMobileHeader).toBe(true);
  });

  test('exibe FilterAccordion no mobile', () => {
    expect(layoutFor(W).showFilterAccordion).toBe(true);
  });

  test('NÃO exibe Sidebar no mobile', () => {
    expect(layoutFor(W).showSidebar).toBe(false);
  });

  test('sidebarWidth é 0 no mobile (sem sidebar fixa)', () => {
    expect(layoutFor(W).sidebarWidth).toBe(0);
  });

  test('MOBILE_HEADER_HEIGHT é positivo', () => {
    expect(MOBILE_HEADER_HEIGHT).toBeGreaterThan(0);
  });

  test('ACCORDION_ITEM_HEIGHT é positivo', () => {
    expect(ACCORDION_ITEM_HEIGHT).toBeGreaterThan(0);
  });
});

// ─── Tablet (760–1379px) ──────────────────────────────────────────────────────

describe('layout tablet (760–1379px)', () => {
  const W = 1024; // iPad Pro

  test('exibe Sidebar no tablet', () => {
    expect(layoutFor(W).showSidebar).toBe(true);
  });

  test('NÃO exibe MobileHeader no tablet', () => {
    expect(layoutFor(W).showMobileHeader).toBe(false);
  });

  test('NÃO exibe FilterAccordion no tablet', () => {
    expect(layoutFor(W).showFilterAccordion).toBe(false);
  });

  test('sidebarWidth em tablet é SIDEBAR_WIDTH_TABLET (302px)', () => {
    expect(layoutFor(W).sidebarWidth).toBe(SIDEBAR_WIDTH_TABLET);
  });
});

// ─── Desktop (≥ 1380px) ───────────────────────────────────────────────────────

describe('layout desktop (≥ 1380px)', () => {
  const W = 1440; // MacBook Air

  test('exibe Sidebar no desktop', () => {
    expect(layoutFor(W).showSidebar).toBe(true);
  });

  test('NÃO exibe MobileHeader no desktop', () => {
    expect(layoutFor(W).showMobileHeader).toBe(false);
  });

  test('NÃO exibe FilterAccordion no desktop', () => {
    expect(layoutFor(W).showFilterAccordion).toBe(false);
  });

  test('sidebarWidth em desktop é SIDEBAR_WIDTH_DESKTOP (365px)', () => {
    expect(layoutFor(W).sidebarWidth).toBe(SIDEBAR_WIDTH_DESKTOP);
  });

  test('sidebar é mais larga no desktop que no tablet', () => {
    expect(SIDEBAR_WIDTH_DESKTOP).toBeGreaterThan(SIDEBAR_WIDTH_TABLET);
  });
});

// ─── Transição nos limites dos breakpoints ────────────────────────────────────

describe('transição de layout nos limites de breakpoint', () => {
  test('759px (mobile) → MobileHeader visível', () => {
    expect(layoutFor(BREAKPOINT_TABLET - 1).showMobileHeader).toBe(true);
  });

  test('760px (tablet) → MobileHeader oculto, Sidebar visível', () => {
    const l = layoutFor(BREAKPOINT_TABLET);
    expect(l.showMobileHeader).toBe(false);
    expect(l.showSidebar).toBe(true);
  });

  test('1379px (tablet) → sidebarWidth ainda é SIDEBAR_WIDTH_TABLET', () => {
    expect(layoutFor(BREAKPOINT_DESKTOP - 1).sidebarWidth).toBe(SIDEBAR_WIDTH_TABLET);
  });

  test('1380px (desktop) → sidebarWidth passa a SIDEBAR_WIDTH_DESKTOP', () => {
    expect(layoutFor(BREAKPOINT_DESKTOP).sidebarWidth).toBe(SIDEBAR_WIDTH_DESKTOP);
  });
});

// ─── Consistência das dimensões da ArtworkStrip ───────────────────────────────

describe('ArtworkStrip: consistência de dimensões por breakpoint', () => {
  test('altura expandida > altura colapsada em tablet/desktop', () => {
    expect(ARTWORK_STRIP_HEIGHT_EXPANDED).toBeGreaterThan(ARTWORK_STRIP_HEIGHT_COLLAPSED);
  });

  test('altura expandida mobile > altura colapsada mobile', () => {
    expect(ARTWORK_STRIP_HEIGHT_MOBILE_EXPANDED).toBeGreaterThan(ARTWORK_STRIP_HEIGHT_MOBILE_COLLAPSED);
  });

  test('altura colapsada tablet/desktop é positiva (header sempre visível)', () => {
    expect(ARTWORK_STRIP_HEIGHT_COLLAPSED).toBeGreaterThan(0);
  });

  test('altura colapsada mobile (tab) é positiva', () => {
    expect(ARTWORK_STRIP_HEIGHT_MOBILE_COLLAPSED).toBeGreaterThan(0);
  });
});
