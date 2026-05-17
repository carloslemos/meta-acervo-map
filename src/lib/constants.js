/**
 * Constantes canônicas compartilhadas entre módulos.
 * Fonte de verdade única para valores que antes eram duplicados em
 * WorldMap.svelte, Tooltip.svelte, FilterControls.svelte e dataUtils.js.
 */

// ─── Cores e rótulos por tipo de bubble ──────────────────────────────────────

export const TYPE_COLOR = {
  birth:     '#2563eb',
  death:     '#dc2626',
  education: '#16a34a',
};

export const TYPE_LABEL = {
  birth:     'Nascimento',
  death:     'Morte',
  education: 'Estudo',
};

// ─── Parâmetros visuais do mapa ───────────────────────────────────────────────

/** Raio visual das bubbles (px). Usado em WorldMap e no cálculo de colisão em dataUtils. */
export const BUBBLE_RADIUS = 2.5;

// ─── Projeção de referência (compartilhada entre WorldMap e dataUtils) ────────

/**
 * Rotação central da projeção — Brasil no centro do mundo.
 * dataUtils usa este valor para pré-computar offsets de colisão na mesma
 * referência que WorldMap usa para renderizar.
 */
export const CENTRAL_ROTATION = [54, 0, 0];

/**
 * Dimensões da projeção de referência usada pelo forceCollide em dataUtils.
 * Devem ser compatíveis com a proporção típica do canvas em WorldMap.
 */
export const REF_W = 960;
export const REF_H = 500;
