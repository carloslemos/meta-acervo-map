/**
 * Utilitários puros para controle de zoom do mapa.
 * Funções testáveis que operam sobre escala (k) e limites sem dependência de D3 ou Svelte.
 */

/**
 * Aplica um incremento/decremento de zoom multiplicativo, respeitando limites.
 *
 * @param {number} currentK - Escala atual do zoom (ex: 1, 2.5)
 * @param {number} factor - Fator multiplicativo (ex: 1.3 para aumentar 30%, 1/1.3 para diminuir)
 * @param {[number, number]} scaleExtent - Limites [min, max] de escala (ex: [1, 8] em 2D, [0.5, 5] em 3D)
 * @returns {number} Nova escala, clamped dentro de scaleExtent
 *
 * @example
 * applyZoomStep(1, 1.3, [1, 8])  // → 1.3
 * applyZoomStep(6, 1.3, [1, 8])  // → 8 (clamped ao máximo)
 * applyZoomStep(1.3, 1/1.3, [1, 8])  // → 1 (clamped ao mínimo)
 */
export function applyZoomStep(currentK, factor, scaleExtent) {
  const [min, max] = scaleExtent;
  const newK = currentK * factor;
  return Math.max(min, Math.min(max, newK));
}
