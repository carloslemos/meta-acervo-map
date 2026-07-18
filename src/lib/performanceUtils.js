/**
 * Utilitários de performance — detecção de forced reflow e monitoramento de frame rate.
 * Uso: detectar regressões após refatorações no hot path (mouse/click handlers, animations).
 * 
 * ⚠️  Funções com "browser" no nome requerem DOM (rodá-las apenas no browser).
 * Funções de teste usam mocks e funcionam em Node.js.
 */

/**
 * Detecta operações que causam forced reflow durante uma função.
 * ⚠️  BROWSER-ONLY — Não funciona em Node.js (sem DOM).
 * 
 * @param {Function} fn — função a ser perfilada
 * @param {string} label — identificação do teste (para logs)
 * @returns {Object} { duration, reflowCount, label }
 */
export function detectForcedReflow(fn, label = 'Unknown') {
  // Guarda para ambiente Node (testes rodando sem DOM)
  if (typeof Element === 'undefined') {
    return {
      duration: 0,
      reflowCount: 0,
      label,
      hasReflow: false,
      note: 'Skipped in Node environment (no DOM)'
    };
  }

  const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
  let reflowCount = 0;
  let lastWriteTime = -Infinity;

  const originalSetAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function(...args) {
    lastWriteTime = performance.now();
    return originalSetAttribute.apply(this, args);
  };

  Element.prototype.getBoundingClientRect = function() {
    const now = performance.now();
    const timeSinceLastWrite = now - lastWriteTime;

    if (timeSinceLastWrite < 1 && timeSinceLastWrite >= 0) {
      console.warn(
        `⚠️  Forced reflow em "${label}": leitura após escrita em ${timeSinceLastWrite.toFixed(2)}ms`
      );
      reflowCount++;
    }

    return originalGetBoundingClientRect.call(this);
  };

  const startTime = performance.now();
  try {
    fn();
  } finally {
    const endTime = performance.now();

    Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    Element.prototype.setAttribute = originalSetAttribute;

    return {
      duration: endTime - startTime,
      reflowCount,
      label,
      hasReflow: reflowCount > 0
    };
  }
}

/**
 * Monitora frame rate durante um período.
 * ⚠️  BROWSER-ONLY — requer requestAnimationFrame.
 *
 * @param {number} durationMs — tempo total a monitorar (ms)
 * @returns {Promise<Object>} { frameCount, averageFps, minFps, maxFps }
 */
export async function measureFrameRate(durationMs = 1000) {
  if (typeof requestAnimationFrame === 'undefined') {
    return Promise.resolve({
      frameCount: 0,
      averageFps: 0,
      minFps: 0,
      maxFps: 0,
      targetFps: 60,
      meetsTarget: false,
      note: 'Skipped in Node environment'
    });
  }

  let frameCount = 0;
  let lastTime = performance.now();
  let frameIntervals = [];

  return new Promise((resolve) => {
    const startTime = performance.now();

    function countFrame() {
      const now = performance.now();
      const elapsed = now - lastTime;

      if (elapsed > 0) {
        frameIntervals.push(elapsed);
      }
      lastTime = now;
      frameCount++;

      if (now - startTime < durationMs) {
        requestAnimationFrame(countFrame);
      } else {
        const avgInterval = frameIntervals.reduce((a, b) => a + b, 0) / frameIntervals.length || 0;
        const avgFps = 1000 / avgInterval;
        const minFps = Math.max(...frameIntervals.map((i) => 1000 / i));
        const maxFps = Math.min(...frameIntervals.map((i) => 1000 / i));

        resolve({
          frameCount,
          averageFps: avgFps,
          minFps,
          maxFps,
          targetFps: 60,
          meetsTarget: avgFps >= 55
        });
      }
    }

    requestAnimationFrame(countFrame);
  });
}

/**
 * Analisa traces de layout thrashing (alternância leitura/escrita).
 * ⚠️  BROWSER-ONLY — Não funciona em Node.js (sem DOM).
 * 
 * @param {Function} fn — função a ser analisada
 * @returns {Object} { cycles, details, isSafe }
 */
export function analyzeLayoutThrashing(fn) {
  if (typeof Element === 'undefined') {
    return {
      cycles: 0,
      details: [],
      isSafe: true,
      operations: 0,
      note: 'Skipped in Node environment (no DOM)'
    };
  }

  const operations = [];

  const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
  const originalSetAttribute = Element.prototype.setAttribute;

  Element.prototype.getBoundingClientRect = function() {
    operations.push({ type: 'read', time: performance.now() });
    return originalGetBoundingClientRect.call(this);
  };

  Element.prototype.setAttribute = function(...args) {
    operations.push({ type: 'write', time: performance.now() });
    return originalSetAttribute.apply(this, args);
  };

  fn();

  Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
  Element.prototype.setAttribute = originalSetAttribute;

  let cycles = 0;
  let i = 0;
  const details = [];

  while (i < operations.length - 1) {
    if (operations[i].type === 'write' && operations[i + 1].type === 'read') {
      cycles++;
      details.push(`Ciclo ${cycles}: escrita → leitura`);
      i += 2;
    } else {
      i++;
    }
  }

  return {
    cycles,
    details,
    isSafe: cycles === 0,
    operations: operations.length
  };
}

/**
 * Compara performance antes e depois de uma mudança.
 * Útil para validar que refatoração não degradou performance.
 *
 * @param {Function} beforeFn — medida baseline
 * @param {Function} afterFn — medida após refatoração
 * @param {string} label — identificação do teste
 * @returns {Object} { before, after, improvement, regressionDetected }
 */
export function comparePerformance(beforeFn, afterFn, label = 'Refactor') {
  const before = detectForcedReflow(beforeFn, `${label} (baseline)`);
  const after = detectForcedReflow(afterFn, `${label} (refactored)`);

  const durationChange = ((after.duration - before.duration) / before.duration) * 100;
  const reflowChange = after.reflowCount - before.reflowCount;

  return {
    before,
    after,
    improvement: {
      durationPercent: -durationChange,
      reflowReduction: -reflowChange
    },
    regressionDetected:
      after.duration > before.duration * 1.1 ||
      after.reflowCount > before.reflowCount
  };
}
