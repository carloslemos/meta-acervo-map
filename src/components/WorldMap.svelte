<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import * as d3 from 'd3';
  import * as topojson from 'topojson-client';
  import {
  TYPE_COLOR,
  BUBBLE_RADIUS,
  CENTRAL_ROTATION,
  TRAJECTORY_FLOW_ENABLED,
  TRAJECTORY_FLOW_SPEED_PX,
  TRAJECTORY_FLOW_DOT_RADIUS,
  TRAJECTORY_FLOW_COLOR_NORMAL,
  TRAJECTORY_FLOW_COLOR_HIGHLIGHT,
  PROJECTION_MORPH_ENABLED,
  PROJECTION_MORPH_DURATION,
  PROJECTION_3D_SCALE_FACTOR,
  PROJECTION_2D_BASE_SCALE,
} from '../lib/constants.js';

  export let bubbles = [];
  export let trajectories = [];
  export let activeTypes = new Set(['birth', 'education', 'death']);
  export let projectionType = '2d';
  /** Quando `true`, bloqueia totalmente interação (mouse, drag, zoom). */
  export let locked = false;
  /**
   * Margem inferior (em px) ocupada por overlays externos (ex.: ArtworkStrip).
   * O canvas continua ocupando toda a altura do container, mas a projeção é
   * centralizada apenas na altura visível (`height - bottomInset`), de modo
   * que o globo não fique escondido sob o overlay.
   */
  export let bottomInset = 0;

  const dispatch = createEventDispatcher();



  const TAU = 2 * Math.PI;

  // ─── Animação de fluxo nas trajetórias ───────────────────────────────────
  // Valores importados de constants.js

  // Dimensões do canvas — atualizadas dinamicamente via ResizeObserver
  let width = 960;
  let height = 500;
  let containerEl;
  let canvasEl;        // camada dinâmica (bubbles + trajetórias)
  let bgCanvasEl;      // camada estática (sphere + países)
  let ctx;
  let bgCtx;
  let dpr = 1;
  let resizeObserver;
  let countriesFeature = null;
  let countriesMesh = null;

  // Meridiano central ~-54°W — Brasil no centro do mundo (estilo IBGE, abr/2024).
  // CENTRAL_ROTATION importado de constants.js

  // Estado por projeção — preservado ao alternar de volta.
  // 2D: transform de zoom {k, x, y}. 3D: rotação + fator de zoom k.
  const state2d = { k: 1, x: 0, y: 0 };
  const state3d = { rotate: [CENTRAL_ROTATION[0], -10, 0], k: 1 };

  // ─── Morph entre projeções (2D ↔ 3D) ─────────────────────────
  // Valores importados de constants.js: PROJECTION_MORPH_ENABLED, PROJECTION_MORPH_DURATION
  let morphing = false;
  let morphT = 0;            // 0 = pose `morphFrom`, 1 = pose `morphTo`
  let morphFrom = '2d';
  let morphTo = '3d';
  let morphStartTime = 0;
  let morphRaf = 0;
  let morphTick = 0;          // força reatividade no $: projection
  let currentProjection = projectionType;
  let prefersReducedMotion = false;
  // Estado do clipping da projeção-morph corrente — usado também no
  // culling manual das bubbles (geoPath já usa via .clipAngle).
  let morphClipAngleRad = Math.PI;          // π = sem clip
  let morphRotateCenter = [-CENTRAL_ROTATION[0], -CENTRAL_ROTATION[1]];

  // Parâmetros base proporcionais ao tamanho atual do canvas.
  // 2D: "content-fit" pela altura — o mapa preenche toda a altura do canvas
  // (pode ficar mais largo que o container; o pan revela o resto, contido).
  /* Altura efetiva para centralizar a projeção, descontando overlays. */
  $: effHeight = Math.max(1, height - bottomInset);
  $: BASE_2D = (() => {
    if (width <= 0 || effHeight <= 0) return { scale: PROJECTION_2D_BASE_SCALE, translate: [width / 2, effHeight / 2] };
    const tmp = d3.geoEqualEarth().rotate(CENTRAL_ROTATION).fitSize([Infinity, effHeight], SPHERE);
    return { scale: tmp.scale(), translate: [width / 2, effHeight / 2] };
  })();
  $: BASE_3D = {
    scale: Math.min(width, effHeight) * PROJECTION_3D_SCALE_FACTOR,
  };

  // Bounds do mapa renderizado em pixels (no estado base k=1) — usado para
  // limitar o pan ao conteúdo real, sem mostrar área vazia além do mapa.
  $: mapBounds2D = (() => {
    if (projectionType !== '2d' || width <= 0 || height <= 0) return null;
    const baseProj = d3.geoEqualEarth()
      .scale(BASE_2D.scale)
      .translate(BASE_2D.translate)
      .rotate(CENTRAL_ROTATION);
    return d3.geoPath().projection(baseProj).bounds(SPHERE);
  })();

  // Projeção reativa: reconstruída quando projectionType (ou seu estado, ou as dimensões) muda.
  let projection;
  let projectionUnclipped;
  let dragTick = 0;

  /**
   * Constrói a projeção-morph para um t∈[0,1] entre `morphFrom` e `morphTo`.
   *
   * Estratégia: combinação linear ponderada das raw functions (já com a
   * escala-alvo de cada modo aplicada *dentro* do raw, pois as duas raws
   * produzem ranges diferentes). Translate e rotate sofrem lerp comum.
   *
   * @param {number} t
   * @returns {d3.GeoProjection}
   */
  function makeMorphProjection(t) {
    const tx2d = BASE_2D.translate[0] * state2d.k + state2d.x;
    const ty2d = BASE_2D.translate[1] * state2d.k + state2d.y;
    const s2d = BASE_2D.scale * state2d.k;
    const s3d = BASE_3D.scale * state3d.k;

    const txFrom = morphFrom === '2d' ? tx2d : width / 2;
    const tyFrom = morphFrom === '2d' ? ty2d : effHeight / 2;
    const txTo   = morphTo   === '2d' ? tx2d : width / 2;
    const tyTo   = morphTo   === '2d' ? ty2d : effHeight / 2;
    const rotFrom = morphFrom === '2d' ? CENTRAL_ROTATION : state3d.rotate;
    const rotTo   = morphTo   === '2d' ? CENTRAL_ROTATION : state3d.rotate;

    // Peso da componente equal-earth (w2d) e ortho (w3d) — soma = 1.
    const w2d = morphFrom === '2d' ? (1 - t) : t;
    const w3d = 1 - w2d;

    const eeRaw = d3.geoEqualEarthRaw;
    const orRaw = d3.geoOrthographicRaw;
    const raw = (lambda, phi) => {
      const a = eeRaw(lambda, phi);
      const b = orRaw(lambda, phi);
      return [
        a[0] * s2d * w2d + b[0] * s3d * w3d,
        a[1] * s2d * w2d + b[1] * s3d * w3d,
      ];
    };

    const lerp = (a, b) => a + (b - a) * t;
    const lerpAng = (a, b) => {
      let d = b - a;
      if (d > 180) d -= 360;
      if (d < -180) d += 360;
      return a + d * t;
    };
    const tx = lerp(txFrom, txTo);
    const ty = lerp(tyFrom, tyTo);
    const rot = [
      lerpAng(rotFrom[0], rotTo[0]),
      lerpAng(rotFrom[1], rotTo[1]),
      lerpAng(rotFrom[2], rotTo[2]),
    ];

    // ClipAngle interpolado: 180° (sem clip) em w3d=0 → 90° (hemisfério) em w3d=1.
    // Mantém a face oculta do globo invisível à medida que a esfericidade aumenta
    // e casa exatamente com a projeção ortográfica final (clipAngle=90).
    const clipAngDeg = 180 - 90 * w3d;
    morphClipAngleRad = clipAngDeg * Math.PI / 180;
    morphRotateCenter = [-rot[0], -rot[1]];

    return d3.geoProjection(raw)
      .scale(1)
      .translate([tx, ty])
      .rotate(rot)
      .clipAngle(clipAngDeg);
  }

  $: {
    dragTick; morphTick;
    void width; void height;
    if (morphing) {
      projection = makeMorphProjection(morphT);
      projectionUnclipped = projection;
    } else if (projectionType === '3d') {
      projection = d3.geoOrthographic()
        .scale(BASE_3D.scale * state3d.k)
        .translate([width / 2, effHeight / 2])
        .rotate(state3d.rotate)
        .clipAngle(90);
      projectionUnclipped = d3.geoOrthographic()
        .scale(BASE_3D.scale * state3d.k)
        .translate([width / 2, effHeight / 2])
        .rotate(state3d.rotate);
    } else {
      const tx = BASE_2D.translate[0] * state2d.k + state2d.x;
      const ty = BASE_2D.translate[1] * state2d.k + state2d.y;
      projection = d3.geoEqualEarth()
        .scale(BASE_2D.scale * state2d.k)
        .translate([tx, ty])
        .rotate(CENTRAL_ROTATION);
      projectionUnclipped = projection;
    }
  }

  /**
   * Inicia o tween de transição entre duas projeções.
   *
   * @param {'2d'|'3d'} from
   * @param {'2d'|'3d'} to
   */
  function startMorph(from, to) {
    if (!PROJECTION_MORPH_ENABLED || prefersReducedMotion || from === to) return;
    if (morphRaf) cancelAnimationFrame(morphRaf);
    morphFrom = from;
    morphTo = to;
    morphing = true;
    morphT = 0;
    morphStartTime = performance.now();
    attachedKey = null; // detach drag/zoom durante o tween
    stepMorph();
  }

  /** Avança um frame do tween de morph. */
  function stepMorph() {
    const elapsed = performance.now() - morphStartTime;
    const u = Math.min(1, elapsed / PROJECTION_MORPH_DURATION);
    morphT = d3.easeCubicInOut(u);
    morphTick++;
    markStaticDirty();
    markDynamicDirty();
    if (u < 1) {
      morphRaf = requestAnimationFrame(stepMorph);
    } else {
      morphRaf = 0;
      morphing = false;
      morphTick++; // garante reatividade do $: projection no estado final
      markStaticDirty();
      markDynamicDirty();
    }
  }

  // Detecta mudança de projectionType vinda do parent.
  $: if (projectionType !== currentProjection) {
    const from = currentProjection;
    currentProjection = projectionType;
    if (canvasEl && ctx) startMorph(from, projectionType);
  }

  const SPHERE = { type: 'Sphere' };

  // TYPE_COLOR importado de constants.js

  /** Ajusta as dimensões internas dos canvases (foreground e background) ao DPR atual. */
  function applyCanvasDims() {
    if (canvasEl) {
      canvasEl.width = Math.max(1, Math.round(width * dpr));
      canvasEl.height = Math.max(1, Math.round(height * dpr));
    }
    if (bgCanvasEl) {
      bgCanvasEl.width = Math.max(1, Math.round(width * dpr));
      bgCanvasEl.height = Math.max(1, Math.round(height * dpr));
    }
  }

  onMount(async () => {
    dpr = window.devicePixelRatio || 1;

    // prefers-reduced-motion: troca instantânea sem tween.
    if (typeof window.matchMedia === 'function') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      prefersReducedMotion = mq.matches;
      mq.addEventListener?.('change', (e) => { prefersReducedMotion = e.matches; });
    }

    // Tamanho inicial a partir do container
    if (containerEl) {
      const rect = containerEl.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        width = rect.width;
        height = rect.height;
      }
    }
    applyCanvasDims();
    ctx = canvasEl.getContext('2d');
    bgCtx = bgCanvasEl.getContext('2d');

    // Observa redimensionamento do container
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        if (cr.width > 0 && cr.height > 0 && (cr.width !== width || cr.height !== height)) {
          width = cr.width;
          height = cr.height;
          applyCanvasDims();
          // força reanexar zoom para atualizar translateExtent
          attachedKey = null;
          markStaticDirty();
          markDynamicDirty();
        }
      }
    });
    resizeObserver.observe(containerEl);

    const topo = await d3.json('countries-110m.json');
    countriesFeature = topojson.feature(topo, topo.objects.countries);
    countriesMesh = topojson.mesh(topo, topo.objects.countries, (a, b) => a !== b);
    markStaticDirty();

    // Inicia animação de fluxo se habilitada e respeitando reduced-motion.
    if (TRAJECTORY_FLOW_ENABLED && !prefersReducedMotion) {
      flowLastTs = 0;
      flowRaf = requestAnimationFrame(tickFlow);
    }
  });

  onDestroy(() => {
    resizeObserver?.disconnect();
    if (rafHandle) cancelAnimationFrame(rafHandle);
    if (morphRaf) cancelAnimationFrame(morphRaf);
    if (flowRaf) cancelAnimationFrame(flowRaf);
  });

  // ─── rAF scheduler ────────────────────────────────────────────────────────
  // Coalescing: vários `dragTick`/hover/etc dentro do mesmo frame produzem
  // um único redraw. Camada estática (basemap) e dinâmica (bubbles/trajetórias)
  // têm flags independentes para que hover só repinte o que precisa.
  let rafHandle = 0;
  let staticDirty = false;
  let dynamicDirty = false;

  // ─── Estado da animação de fluxo ─────────────────────────────────────────
  // flowPhase = distância acumulada (px) — cada segmento usa o módulo do seu
  // próprio comprimento, garantindo velocidade visual constante em todos.
  let flowPhase = 0;
  let flowRaf = 0;
  let flowLastTs = 0;

  /**
   * Hash determinístico string → [0,1). Usado para desfasar cada segmento e
   * produzir efeito orgânico (cada trajetória pulsa em fase distinta).
   *
   * @param {string} id
   * @returns {number}
   */
  function flowOffsetFor(id) {
    let h = 2166136261;
    for (let i = 0; i < id.length; i++) {
      h ^= id.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return ((h >>> 0) % 1000) / 1000;
  }

  /** Tick do rAF para atualizar a fase do fluxo das trajetórias. */
  function tickFlow(ts) {
    if (flowLastTs) {
      flowPhase += (ts - flowLastTs) * TRAJECTORY_FLOW_SPEED_PX;
    }
    flowLastTs = ts;
    markDynamicDirty();
    flowRaf = requestAnimationFrame(tickFlow);
  }

  /** Marca a camada estática (basemap) e a dinâmica como sujas e agenda redraw. */
  function markStaticDirty() {
    staticDirty = true;
    dynamicDirty = true; // mudanças de projeção/dim afetam ambos
    scheduleDraw();
  }
  /** Marca apenas a camada dinâmica como suja e agenda redraw. */
  function markDynamicDirty() {
    dynamicDirty = true;
    scheduleDraw();
  }
  /** Coalesce múltiplas marcações no mesmo frame em um único redraw. */
  function scheduleDraw() {
    if (rafHandle) return;
    rafHandle = requestAnimationFrame(() => {
      rafHandle = 0;
      if (staticDirty) {
        staticDirty = false;
        redrawStatic();
      }
      if (dynamicDirty) {
        dynamicDirty = false;
        redrawDynamic();
      }
    });
  }

  // Anexa drag & zoom — reexecuta quando o modo de projeção OU as dimensões mudam.
  // Durante o morph, handlers ficam desanexados (cursor neutro, sem interação).
  let attachedKey = null;
  $: if (canvasEl && ctx) {
    const key = morphing
      ? 'morph'
      : `${projectionType}|${Math.round(width)}x${Math.round(height)}|${locked ? 'L' : 'U'}`;
    if (attachedKey !== key) {
      attachedKey = key;
      const sel = d3.select(canvasEl);
      sel.on('.drag', null);
      sel.on('.zoom', null);

      if (morphing) {
        sel.style('cursor', 'progress');
      } else if (projectionType === '3d') {
        const zoom = d3.zoom()
          .scaleExtent([0.5, 5])
          .filter((e) => {
            if (locked) return false;
            // Zoom: só wheel e dois dedos (pinch) em touch
            // Drag (um dedo/mouse) passa direto para d3.drag, sem filtro
            if (e.type === 'wheel') return true;
            if (e.type === 'touchstart' || e.type === 'touchmove') {
              return e.touches && e.touches.length >= 2; // pinch zoom
            }
            return false;
          })
          .on('zoom', (e) => {
            state3d.k = e.transform.k;
            dragTick++;
          });

        const drag = d3.drag()
          .filter(() => !locked)
          .on('start', () => sel.style('cursor', 'grabbing'))
          .on('drag', (e) => {
            const k = 75 / (BASE_3D.scale * state3d.k);
            const [λ, φ, γ] = state3d.rotate;
            state3d.rotate = [λ + e.dx * k, Math.max(-90, Math.min(90, φ - e.dy * k)), γ];
            dragTick++;
          })
          .on('end', () => sel.style('cursor', 'grab'));

        sel.call(zoom).call(drag).style('cursor', 'grab');
        sel.call(zoom.transform, d3.zoomIdentity.scale(state3d.k));
      } else {
        // Pan clamping: translateExtent baseado nos bounds reais do mapa,
        // permitindo ver todo o conteúdo mas não área vazia além dele.
        const b = mapBounds2D ?? [[0, 0], [width, height]];
        const zoom = d3.zoom()
          .scaleExtent([1, 8])
          .extent([[0, 0], [width, height]])
          .translateExtent(b)
          .filter(() => !locked)
          .on('zoom', (e) => {
            state2d.k = e.transform.k;
            state2d.x = e.transform.x;
            state2d.y = e.transform.y;
            dragTick++;
          });

        sel.call(zoom).style('cursor', 'grab');
        // Reaplica transform corrente (ou identity se vinha de outro modo / resize forçou clamp)
        const clampedK = Math.max(1, Math.min(8, state2d.k));
        sel.call(
          zoom.transform,
          d3.zoomIdentity.translate(state2d.x, state2d.y).scale(clampedK)
        );
      }
    }
  }

  /**
   * Verifica se uma coordenada (lon, lat) está na face visível do globo.
   * Em 2D, sempre retorna `true`.
   *
   * @param {number} lon
   * @param {number} lat
   * @returns {boolean}
   */
  function isVisibleOnGlobe(lon, lat) {
    if (morphing) {
      // Usa o clipAngle e o centro de rotação atual interpolados.
      return d3.geoDistance(morphRotateCenter, [lon, lat]) < morphClipAngleRad;
    }
    if (projectionType !== '3d') return true;
    const [λ, φ] = state3d.rotate;
    const center = [-λ, -φ];
    return d3.geoDistance(center, [lon, lat]) < Math.PI / 2;
  }

  $: visibleBubbles = bubbles.filter(b => activeTypes.has(b.type));

  // Posições finais das bubbles. Usa offsets de descolisão pré-computados
  // em loadData() — sem rodar forceCollide a cada pan/zoom.
  // Em 2D o offset é dividido por k (zoom) para preservar a aparência visual.
  $: positionedBubbles = (() => {
    void projection; void dragTick; void morphTick;
    const isGlobe = projectionType === '3d';
    const k2d = state2d.k || 1;
    const out = [];
    for (const b of visibleBubbles) {
      // Durante o morph o culling usa o clipAngle interpolado;
      // em 3D fixo, usa o hemisfério padrão.
      if (morphing) {
        if (!isVisibleOnGlobe(b.lon, b.lat)) continue;
      } else if (isGlobe && !isVisibleOnGlobe(b.lon, b.lat)) continue;
      const pt = projection([b.lon, b.lat]);
      if (!pt) continue;
      const dx = b.dxBase || 0;
      const dy = b.dyBase || 0;
      // Durante o morph, ignoramos offsets de descolisão (não escalam bem na
      // projeção interpolada). Voltam no estado final.
      const x = morphing ? pt[0] : (isGlobe ? pt[0] + dx : pt[0] + dx / k2d);
      const y = morphing ? pt[1] : (isGlobe ? pt[1] + dy : pt[1] + dy / k2d);
      out.push({ bubble: b, x, y });
    }
    return out;
  })();

  // Quadtree para hit-test em O(log n) em vez de O(n).
  $: bubbleQuadtree = (() => {
    const qt = d3.quadtree()
      .x(d => d.x)
      .y(d => d.y);
    qt.addAll(positionedBubbles);
    return qt;
  })();

  $: positionedTrajectories = (() => {
    void projection; void dragTick; void morphTick;
    const isGlobe = morphing || projectionType === '3d';
    const proj = projectionUnclipped;
    const out = [];
    for (const t of trajectories) {
      for (const seg of t.segments) {
        const id = `${seg.from.id}__${seg.to.id}`;
        if (isGlobe) {
          // Em 3D não pré-calculamos pontos de tela: deixamos a projeção
          // ortográfica (clipada) cortar o arco geodésico na linha do horizonte.
          // Pulamos apenas se ambos os extremos estão na face oculta.
          const fromVisible = isVisibleOnGlobe(seg.from.lon, seg.from.lat);
          const toVisible = isVisibleOnGlobe(seg.to.lon, seg.to.lat);
          if (!fromVisible && !toVisible) continue;
          // Comprimento aproximado em pixels: distância entre extremos
          // projetados (sem clip) — dá length consistente mesmo se um lado
          // estiver na face oculta do globo.
          const apU = proj([seg.from.lon, seg.from.lat]);
          const bpU = proj([seg.to.lon, seg.to.lat]);
          const length = (apU && bpU)
            ? Math.hypot(bpU[0] - apU[0], bpU[1] - apU[1])
            : 0;
          out.push({
            id,
            kind: seg.kind,
            fromId: seg.from.id,
            toId: seg.to.id,
            fromBubble: seg.from,
            fromLon: seg.from.lon,
            fromLat: seg.from.lat,
            toLon: seg.to.lon,
            toLat: seg.to.lat,
            flowOffset: flowOffsetFor(id),
            length,
            geo: {
              type: 'LineString',
              coordinates: [
                [seg.from.lon, seg.from.lat],
                [seg.to.lon, seg.to.lat],
              ],
            },
          });
        } else {
          const ap = proj([seg.from.lon, seg.from.lat]);
          const bp = proj([seg.to.lon, seg.to.lat]);
          if (!ap || !bp) continue;
          const [ax, ay] = ap;
          const [bx, by] = bp;
          const dx = bx - ax;
          const dy = by - ay;
          const dist = Math.hypot(dx, dy);
          if (dist < 1) continue;
          const offset = dist * 0.2;
          const mx = (ax + bx) / 2;
          const my = (ay + by) / 2;
          const cpx = mx + (-dy / dist) * offset;
          const cpy = my + (dx / dist) * offset;
          out.push({
            id,
            kind: seg.kind,
            fromId: seg.from.id,
            toId: seg.to.id,
            fromBubble: seg.from,
            flowOffset: flowOffsetFor(id),
            length: dist,
            ax, ay, cpx, cpy, bx, by,
          });
        }
      }
    }
    return out;
  })();

  let hoveredBubbleId = null;
  $: highlightedBubbleIds = (() => {
    if (!hoveredBubbleId) return null;
    const ids = new Set();
    for (const t of trajectories) {
      const touches = t.segments.some(s => s.from.id === hoveredBubbleId || s.to.id === hoveredBubbleId);
      if (touches) {
        for (const s of t.segments) {
          ids.add(s.from.id);
          ids.add(s.to.id);
        }
      }
    }
    ids.add(hoveredBubbleId);
    return ids;
  })();
  $: highlightedSegmentIds = (() => {
    if (!hoveredBubbleId) return null;
    const ids = new Set();
    for (const seg of positionedTrajectories) {
      if (seg.fromId === hoveredBubbleId || seg.toId === hoveredBubbleId) {
        ids.add(seg.id);
      } else if (highlightedBubbleIds && highlightedBubbleIds.has(seg.fromId) && highlightedBubbleIds.has(seg.toId)) {
        ids.add(seg.id);
      }
    }
    return ids;
  })();

  // ─── Canvas redraw — camada estática (basemap) ────────────────────────
  /** Repinta o basemap (sphere + países + bordas). */
  function redrawStatic() {
    if (!bgCtx || !projection) return;
    // Durante o morph: trata como globo (sphere fill consistente) e
    // pula o mesh de bordas para reduzir custo por frame.
    const isGlobe = morphing || projectionType === '3d';
    const geoPath = d3.geoPath().projection(projection).context(bgCtx);

    bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bgCtx.clearRect(0, 0, width, height);

    if (isGlobe) {
      /* Gradiente vertical: topo escuro → base mais clara */
      const vertGrad = bgCtx.createLinearGradient(0, 0, 0, height);
      vertGrad.addColorStop(0,    'rgba(0, 0, 0, 1)');
      vertGrad.addColorStop(1,    'rgba(94, 94, 94, 1)');
      bgCtx.fillStyle = vertGrad;
      bgCtx.fillRect(0, 0, width, height);

      /* Glow luminoso por trás do globo — canvas preenchido com gradiente
         radial antes da esfera, criando um halo mais claro ao redor dela. */
      const [glowCx, glowCy] = projection.translate();
      const glowSc = projection.scale();
      const glow = bgCtx.createRadialGradient(
        glowCx, glowCy, glowSc * 0.8,
        glowCx, glowCy, glowSc * 2.4
      );
      glow.addColorStop(0,   'rgba(94, 94, 94, 1)');
      glow.addColorStop(0.3, 'rgba(94, 94, 94, 0.3)');
      glow.addColorStop(1,   'rgba(94, 94, 94, 0)');
      bgCtx.fillStyle = glow;
      bgCtx.fillRect(0, 0, width, height);

      bgCtx.beginPath();
      geoPath(SPHERE);
      bgCtx.fillStyle = '#141414';
      bgCtx.fill();
      bgCtx.strokeStyle = 'rgba(255,255,255,0.18)';
      bgCtx.lineWidth = 0.6;
      bgCtx.stroke();
    } else {
      /* Fundo do mapa 2D: gradiente vertical sólido — topo preto → base cinza */
      const vertGrad2d = bgCtx.createLinearGradient(0, 0, 0, height);
      vertGrad2d.addColorStop(0, 'rgba(0, 0, 0, 1)');
      vertGrad2d.addColorStop(1, 'rgba(94, 94, 94, 1)');
      bgCtx.fillStyle = vertGrad2d;
      bgCtx.fillRect(0, 0, width, height);
    }

    if (countriesFeature) {
      // Um único path agregando todos os países: 1 fill em vez de 177.
      bgCtx.beginPath();
      geoPath(countriesFeature);
      bgCtx.fillStyle = isGlobe ? '#404040' : 'rgba(125, 125, 125, 1)';
      bgCtx.fill();

      // Bordas via mesh interno (cada borda compartilhada desenhada uma vez).
      // Durante o morph, o mesh também é desenhado: o clipping da projeção
      // garante que apenas a face visível apareça.
      if (countriesMesh) {
        bgCtx.beginPath();
        geoPath(countriesMesh);
        bgCtx.strokeStyle = isGlobe ? '#0a0a0a' : '#3a3a3a';
        bgCtx.lineWidth = 0.5;
        bgCtx.stroke();
      }
    }

    /* Efeitos 3D clipsados na esfera: sombra interna (rim) + brilho superior */
    if (isGlobe) {
      const [cx, cy] = projection.translate();
      const sc = projection.scale();

      bgCtx.save();
      bgCtx.beginPath();
      geoPath(SPHERE);
      bgCtx.clip();

      /* Sombra interna — borda escura (efeito atmosférico / profundidade) */
      const rim = bgCtx.createRadialGradient(cx, cy, sc * 0.42, cx, cy, sc);
      rim.addColorStop(0,    'rgba(0,0,0,0)');
      rim.addColorStop(0.65, 'rgba(0,0,0,0.10)');
      rim.addColorStop(1,    'rgba(0,0,0,0.58)');
      bgCtx.fillStyle = rim;
      bgCtx.fillRect(0, 0, width, height);

      /* Brilho fixo superior-central — dá tridimensionalidade à esfera */
      const halo = bgCtx.createRadialGradient(cx, cy - sc * 0.30, 0, cx, cy - sc * 0.30, sc * 0.80);
      halo.addColorStop(0,   'rgba(255,255,255,0.07)');
      halo.addColorStop(0.5, 'rgba(255,255,255,0.02)');
      halo.addColorStop(1,   'rgba(255,255,255,0)');
      bgCtx.fillStyle = halo;
      bgCtx.fillRect(0, 0, width, height);

      bgCtx.restore();
    }
  }

  // ─── Canvas redraw — camada dinâmica (trajetórias + bubbles) ─────────────
  /** Repinta as trajetórias, fluxo e bubbles. */
  function redrawDynamic() {
    if (!ctx || !projection) return;

    const isHovering = !!hoveredBubbleId;
    const isGlobe = projectionType === '3d';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // Trajetórias — agrupadas por estilo para reduzir trocas de strokeStyle.
    if (positionedTrajectories.length) {
      const baseColor = '#ccc';

      if (isGlobe) {
        // Em 3D, desenhamos cada trajetória como uma LineString geodésica.
        // A projeção ortográfica clipada corta o arco no horizonte automaticamente,
        // fazendo a curva acompanhar a superfície do globo.
        const geoPath = d3.geoPath().projection(projection).context(ctx);

        // Path padrão (uma única chamada de stroke)
        ctx.beginPath();
        let hasDefault = false;
        for (const seg of positionedTrajectories) {
          const isHighlightSeg = highlightedSegmentIds && highlightedSegmentIds.has(seg.id);
          if (isHovering && isHighlightSeg) continue;
          geoPath(seg.geo);
          hasDefault = true;
        }
        if (hasDefault) {
          ctx.strokeStyle = baseColor;
          ctx.lineWidth = 0.6;
          ctx.globalAlpha = isHovering ? 0.05 : 0.3
          ctx.stroke();
        }

        // Path destacado
        if (isHovering) {
          ctx.beginPath();
          let hasHighlight = false;
          for (const seg of positionedTrajectories) {
            const isHighlightSeg = highlightedSegmentIds && highlightedSegmentIds.has(seg.id);
            if (!isHighlightSeg) continue;
            geoPath(seg.geo);
            hasHighlight = true;
          }
          if (hasHighlight) {
            ctx.strokeStyle = TRAJECTORY_FLOW_COLOR_HIGHLIGHT;
            ctx.lineWidth = 1.6;
            ctx.globalAlpha = 1;
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
      } else {
        // Em 2D, mantemos as curvas Bézier pré-calculadas.
        const defaultPath = new Path2D();
        const highlightPath = new Path2D();
        let hasDefault = false;
        let hasHighlight = false;

        for (const seg of positionedTrajectories) {
          const isHighlightSeg = highlightedSegmentIds && highlightedSegmentIds.has(seg.id);
          if (isHovering && isHighlightSeg) {
            highlightPath.moveTo(seg.ax, seg.ay);
            highlightPath.quadraticCurveTo(seg.cpx, seg.cpy, seg.bx, seg.by);
            hasHighlight = true;
          } else {
            defaultPath.moveTo(seg.ax, seg.ay);
            defaultPath.quadraticCurveTo(seg.cpx, seg.cpy, seg.bx, seg.by);
            hasDefault = true;
          }
        }

        if (hasDefault) {
          ctx.strokeStyle = baseColor;
          ctx.lineWidth = 0.6;
          ctx.globalAlpha = isHovering ? 0.15 : 1;
          ctx.stroke(defaultPath);
        }
        if (hasHighlight) {
          ctx.strokeStyle = TRAJECTORY_FLOW_COLOR_HIGHLIGHT;
          ctx.lineWidth = 1.6;
          ctx.globalAlpha = 1;
          ctx.stroke(highlightPath);
        }
        ctx.globalAlpha = 1;
      }
    }

    // Dots de fluxo — pulso percorrendo cada segmento (from → to). Acumulamos
    // em dois Path2D (normal/highlight) para reduzir o número de chamadas.
    if (TRAJECTORY_FLOW_ENABLED && positionedTrajectories.length) {
      const normalPath = new Path2D();
      const highlightPath = new Path2D();
      let hasNormal = false;
      let hasHighlight = false;
      // Em 3D/morph as trajetórias têm `geo`; em 2D têm Bézier.
      const useGeo = morphing || projectionType === '3d';
      const r = TRAJECTORY_FLOW_DOT_RADIUS;
      const rH = TRAJECTORY_FLOW_DOT_RADIUS * 1.6;

      for (const seg of positionedTrajectories) {
        if (!seg.length) continue;
        // flowPhase em px; offset desfasado proporcional ao length do seg.
        const t = ((flowPhase + seg.flowOffset * seg.length) % seg.length) / seg.length;
        let x, y;
        if (useGeo) {
          const ll = d3.geoInterpolate(
            [seg.fromLon, seg.fromLat],
            [seg.toLon, seg.toLat]
          )(t);
          if (!isVisibleOnGlobe(ll[0], ll[1])) continue;
          const pt = projection(ll);
          if (!pt) continue;
          x = pt[0]; y = pt[1];
        } else {
          const mt = 1 - t;
          x = mt * mt * seg.ax + 2 * mt * t * seg.cpx + t * t * seg.bx;
          y = mt * mt * seg.ay + 2 * mt * t * seg.cpy + t * t * seg.by;
        }
        const isHighlightSeg = highlightedSegmentIds && highlightedSegmentIds.has(seg.id);
        if (isHovering && isHighlightSeg) {
          highlightPath.moveTo(x + rH, y);
          highlightPath.arc(x, y, rH, 0, TAU);
          hasHighlight = true;
        } else {
          normalPath.moveTo(x + r, y);
          normalPath.arc(x, y, r, 0, TAU);
          hasNormal = true;
        }
      }

      if (hasNormal) {
        ctx.globalAlpha = isHovering ? 0.05 : 0.3;
        ctx.fillStyle = TRAJECTORY_FLOW_COLOR_NORMAL;
        ctx.fill(normalPath);
      }
      if (hasHighlight) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = TRAJECTORY_FLOW_COLOR_HIGHLIGHT;
        ctx.fill(highlightPath);
      }
      ctx.globalAlpha = 1;
    }

    // Bubbles — agrupadas por cor (3 paths em vez de N).
    // Quando há hover, separamos também as destacadas.
    const fillByColor = new Map(); // color → Path2D
    const highlightArcs = [];      // {x, y, color}
    const dimAlpha = isHovering ? 0.25 : 0.85;

    for (const { bubble, x, y } of positionedBubbles) {
      const color = TYPE_COLOR[bubble.type];
      if (!color) continue;
      const isHighlightBubble = highlightedBubbleIds && highlightedBubbleIds.has(bubble.id);
      if (isHovering && isHighlightBubble) {
        highlightArcs.push({ x, y, color });
      } else {
        let p = fillByColor.get(color);
        if (!p) { p = new Path2D(); fillByColor.set(color, p); }
        p.moveTo(x + BUBBLE_RADIUS, y);
        p.arc(x, y, BUBBLE_RADIUS, 0, TAU);
      }
    }

    // Fills agrupados
    ctx.globalAlpha = dimAlpha;
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 0.1;
    for (const [color, path] of fillByColor) {
      ctx.fillStyle = color;
      ctx.fill(path);
      ctx.stroke(path);
    }

    // Bubbles destacadas — desenhadas individualmente (sempre poucas)
    if (highlightArcs.length) {
      ctx.globalAlpha = 1;
      for (const a of highlightArcs) {
        ctx.beginPath();
        ctx.arc(a.x, a.y, BUBBLE_RADIUS, 0, TAU);
        ctx.fillStyle = a.color;
        ctx.fill();
        ctx.strokeStyle = TRAJECTORY_FLOW_COLOR_HIGHLIGHT;
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }
    }

    ctx.globalAlpha = 1;

    // Label de hover desenhado diretamente no canvas
    if (hoveredBubbleId) {
      const found = positionedBubbles.find(pb => pb.bubble.id === hoveredBubbleId);
      if (found) {
        const { bubble, x, y } = found;
        const label = (bubble.creator || bubble.place || '').toUpperCase();
        if (label) {
          const PAD = 4;
          const FONT_SIZE = 10;
          ctx.save();
          ctx.globalAlpha = 1;
          ctx.font = `500 ${FONT_SIZE}px "Roboto Mono", monospace`;
          ctx.textBaseline = 'alphabetic';
          const tw = ctx.measureText(label).width;
          const boxW = tw + PAD * 2;
          const boxH = FONT_SIZE + PAD * 2;
          let lx = x + BUBBLE_RADIUS + 6;
          let ly = y - BUBBLE_RADIUS - 4;
          if (lx + boxW > width) lx = x - boxW - BUBBLE_RADIUS - 6;
          if (ly - boxH < 0) ly = y + BUBBLE_RADIUS + boxH + 4;
          ctx.fillStyle = 'rgba(20,20,20,0.88)';
          ctx.fillRect(lx, ly - boxH, boxW, boxH);
          ctx.fillStyle = '#f4f6f8';
          ctx.fillText(label, lx + PAD, ly - PAD);
          ctx.restore();
        }
      }
    }
  }

  // Reatividade: qualquer mudança de projeção/dimensão/dados marca ambas
  // as camadas como sujas; hover só marca a dinâmica.
  $: { void projection; void width; void height; void countriesFeature; void countriesMesh;
       if (bgCtx) markStaticDirty();
       if (ctx) markDynamicDirty(); }
  $: { void positionedBubbles; void positionedTrajectories; void hoveredBubbleId;
       if (ctx) markDynamicDirty(); }

  // Atualiza cursor quando entra/sai do hover de uma bubble
  $: if (canvasEl) {
    const sel = d3.select(canvasEl);
    if (morphing) {
      sel.style('cursor', 'progress');
    } else if (hoveredBubbleId) {
      sel.style('cursor', 'pointer');
    } else {
      sel.style('cursor', 'grab');
    }
  }

  // ─── Interação do mouse (hit-test) ───────────────────────────────
  // Throttled via rAF: no máximo uma checagem por frame.
  let pendingMouse = null;
  let mouseRaf = 0;
  /** Hit-test em quadtree para detectar bubble sob o cursor. */
  function onMouseMove(e) {
    if (!canvasEl) return;
    if (locked) { if (hoveredBubbleId) hoveredBubbleId = null; return; }
    pendingMouse = { clientX: e.clientX, clientY: e.clientY };
    if (mouseRaf) return;
    mouseRaf = requestAnimationFrame(() => {
      mouseRaf = 0;
      if (!pendingMouse) return;
      const { clientX, clientY } = pendingMouse;
      pendingMouse = null;
      const rect = canvasEl.getBoundingClientRect();
      const scaleX = width / rect.width;
      const scaleY = height / rect.height;
      const mx = (clientX - rect.left) * scaleX;
      const my = (clientY - rect.top) * scaleY;

      const found = bubbleQuadtree
        ? bubbleQuadtree.find(mx, my, BUBBLE_RADIUS + 4)
        : null;

      if (found) {
        hoveredBubbleId = found.bubble.id;
        return;
      }

      // Sem bubble sob o cursor — tenta acertar uma trajetória.
      const seg = hitTrajectory(mx, my, 4);
      if (seg) {
        // Usa o id do extremo `from` para reaproveitar a lógica existente de
        // destaque por criador (highlightedBubbleIds/highlightedSegmentIds).
        if (hoveredBubbleId !== seg.fromId) hoveredBubbleId = seg.fromId;
      } else if (hoveredBubbleId) {
        hoveredBubbleId = null;
      }
    });
  }

  /** Limpa estado de hover ao sair do canvas. */
  function onMouseLeave() {
    if (mouseRaf) { cancelAnimationFrame(mouseRaf); mouseRaf = 0; }
    pendingMouse = null;
    if (hoveredBubbleId) {
      hoveredBubbleId = null;
    }
  }

  /** Click no canvas: hit-test e dispatch de `artistclick` se acertou uma bubble. */
  function onClick(e) {
    if (!canvasEl || !bubbleQuadtree) return;
    const rect = canvasEl.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    const found = bubbleQuadtree.find(mx, my, BUBBLE_RADIUS + 4);
    // Bubbles de acervo não disparam interação de artista.
    if (found && found.bubble.type !== 'acervo') {
      dispatch('artistclick', found.bubble);
      return;
    }
    if (found) return; // acervo: ignora
    // Sem bubble — tenta acertar trajetória.
    const seg = hitTrajectory(mx, my, 4);
    if (seg?.fromBubble) {
      dispatch('artistclick', seg.fromBubble);
    }
  }

  // ─── Hit-test em trajetórias ─────────────────────────────────
  // Itera `positionedTrajectories` amostrando cada segmento e calculando
  // distância ponto-a-polilinha. Retorna o segmento mais próximo se
  // estiver dentro de `tol` pixels. Em 2D usa Bézier quadrática
  // pré-calculada; em 3D amostra o arco geodésico pela projeção atual.
  const HIT_SAMPLES = 10;

  function distPointSeg(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let t = len2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
    if (t < 0) t = 0; else if (t > 1) t = 1;
    const cx = ax + t * dx, cy = ay + t * dy;
    return Math.hypot(px - cx, py - cy);
  }

  function hitTrajectory(mx, my, tol) {
    if (!positionedTrajectories.length) return null;
    const isGlobe = morphing || projectionType === '3d';
    let best = null;
    let bestDist = tol;

    for (const seg of positionedTrajectories) {
      // Reusa um array de amostras locais para evitar alocações.
      const pts = [];
      if (isGlobe) {
        const interp = d3.geoInterpolate(
          [seg.fromLon, seg.fromLat],
          [seg.toLon, seg.toLat]
        );
        for (let i = 0; i <= HIT_SAMPLES; i++) {
          const t = i / HIT_SAMPLES;
          const ll = interp(t);
          if (!isVisibleOnGlobe(ll[0], ll[1])) continue;
          const pt = projection(ll);
          if (pt) pts.push(pt[0], pt[1]);
        }
      } else {
        for (let i = 0; i <= HIT_SAMPLES; i++) {
          const t = i / HIT_SAMPLES;
          const mt = 1 - t;
          const x = mt * mt * seg.ax + 2 * mt * t * seg.cpx + t * t * seg.bx;
          const y = mt * mt * seg.ay + 2 * mt * t * seg.cpy + t * t * seg.by;
          pts.push(x, y);
        }
      }
      // Bounding box rápido para descartar segmentos muito distantes.
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (let i = 0; i < pts.length; i += 2) {
        const x = pts[i], y = pts[i + 1];
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
      if (mx < minX - bestDist || mx > maxX + bestDist ||
          my < minY - bestDist || my > maxY + bestDist) continue;

      for (let i = 0; i + 3 < pts.length; i += 2) {
        const d = distPointSeg(mx, my, pts[i], pts[i + 1], pts[i + 2], pts[i + 3]);
        if (d < bestDist) {
          bestDist = d;
          best = seg;
        }
      }
    }
    return best;
  }
</script>

<div class="world-map-wrap" bind:this={containerEl}>
  <canvas
    bind:this={bgCanvasEl}
    class="world-map world-map--bg"
    class:world-map--globe={projectionType === '3d'}
    aria-hidden="true"
  ></canvas>
  <canvas
    bind:this={canvasEl}
    class="world-map world-map--fg"
    class:world-map--globe={projectionType === '3d'}
    class:world-map--locked={locked}
    aria-label="Mapa interativo de criadores"
    on:mousemove={onMouseMove}
    on:mouseleave={onMouseLeave}
    on:click={onClick}
  ></canvas>
  <!-- Gradientes de profundidade sobre o canvas: apenas no modo globo 3D -->
  {#if projectionType === '3d'}
  <div class="map-vignette" aria-hidden="true"></div>
  <div class="map-gradient-top" aria-hidden="true"></div>
  <div class="map-gradient-left" aria-hidden="true"></div>
  {/if}
</div>

<style lang="scss">
  .world-map-wrap {
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
  }

  .world-map {
    display: block;
    width: 100%;
    height: 100%;
    touch-action: none;
  }

  .world-map--bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .world-map--fg {
    position: relative;
    cursor: grab;

    &:active {
      cursor: grabbing;
    }
  }

  .world-map--locked {
    /* Bloqueia hover/cursor; pan/zoom desligados via filter() do d3, mas o
       click permanece ativo para permitir troca de artista no card. */
    cursor: default;
  }

  /* ── Gradientes de profundidade ────────────────────────────────────── */
  .map-vignette,
  .map-gradient-top,
  .map-gradient-left {
    position: absolute;
    pointer-events: none;
    z-index: 3;
  }

  /* Vignette radial: cantos escuros, centro aberto */
  .map-vignette {
    inset: 0;
    background: radial-gradient(
      ellipse 70% 60% at 60% 50%,
      transparent 30%,
      rgba(0, 0, 0, 0.70) 100%
    );
  }

  /* Gradiente superior — separa canvas do header */
  .map-gradient-top {
    top: 0;
    left: 0;
    right: 0;
    height: 80px;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.60) 0%, transparent 100%);
  }

  /* Gradiente lateral esquerdo — suaviza transição com a sidebar */
  .map-gradient-left {
    top: 0;
    left: 0;
    bottom: 0;
    width: 200px;
    background: linear-gradient(to right, rgba(0, 0, 0, 0.50) 0%, transparent 100%);
  }
</style>
