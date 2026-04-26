<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import * as d3 from 'd3';
  import * as topojson from 'topojson-client';

  export let bubbles = [];
  export let trajectories = [];
  export let activeTypes = new Set(['birth', 'education', 'death']);
  export let projectionType = '2d';

  const dispatch = createEventDispatcher();

  const BUBBLE_RADIUS = 2.5;
  const TAU = 2 * Math.PI;

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
  const CENTRAL_ROTATION = [54, 0, 0];

  // Per-projection state — preserved when switching back
  // 2D: zoom transform {k, x, y}. 3D: rotation + zoom factor k
  const state2d = { k: 1, x: 0, y: 0 };
  const state3d = { rotate: [CENTRAL_ROTATION[0], -10, 0], k: 1 };

  // Parâmetros base proporcionais ao tamanho atual do canvas.
  // 2D: "content-fit" pela altura — o mapa preenche toda a altura do canvas
  // (pode ficar mais largo que o container; o pan revela o resto, contido).
  $: BASE_2D = (() => {
    if (width <= 0 || height <= 0) return { scale: 168, translate: [width / 2, height / 2] };
    const tmp = d3.geoEqualEarth().rotate(CENTRAL_ROTATION).fitSize([Infinity, height], SPHERE);
    return { scale: tmp.scale(), translate: [width / 2, height / 2] };
  })();
  $: BASE_3D = {
    scale: Math.min(width, height) * 0.44, // 220 quando 500x500
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

  // Reactive projection: rebuilt when projectionType (or its state, or dims) changes
  let projection;
  let projectionUnclipped;
  let dragTick = 0;

  $: {
    dragTick;
    void width; void height;
    if (projectionType === '3d') {
      projection = d3.geoOrthographic()
        .scale(BASE_3D.scale * state3d.k)
        .translate([width / 2, height / 2])
        .rotate(state3d.rotate)
        .clipAngle(90);
      projectionUnclipped = d3.geoOrthographic()
        .scale(BASE_3D.scale * state3d.k)
        .translate([width / 2, height / 2])
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

  const SPHERE = { type: 'Sphere' };

  const TYPE_COLOR = {
    birth: '#2563eb',
    death: '#dc2626',
    education: '#16a34a',
  };

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
  });

  onDestroy(() => {
    resizeObserver?.disconnect();
    if (rafHandle) cancelAnimationFrame(rafHandle);
  });

  // ─── rAF scheduler ────────────────────────────────────────────────────────
  // Coalescing: vários `dragTick`/hover/etc dentro do mesmo frame produzem
  // um único redraw. Camada estática (basemap) e dinâmica (bubbles/trajetórias)
  // têm flags independentes para que hover só repinte o que precisa.
  let rafHandle = 0;
  let staticDirty = false;
  let dynamicDirty = false;

  function markStaticDirty() {
    staticDirty = true;
    dynamicDirty = true; // mudanças de projeção/dim afetam ambos
    scheduleDraw();
  }
  function markDynamicDirty() {
    dynamicDirty = true;
    scheduleDraw();
  }
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

  // Attach drag & zoom — re-runs when projection mode OR dimensions change
  let attachedKey = null;
  $: if (canvasEl && ctx) {
    const key = `${projectionType}|${Math.round(width)}x${Math.round(height)}`;
    if (attachedKey !== key) {
      attachedKey = key;
      const sel = d3.select(canvasEl);
      sel.on('.drag', null);
      sel.on('.zoom', null);

      if (projectionType === '3d') {
        const zoom = d3.zoom()
          .scaleExtent([0.5, 5])
          .filter((e) => {
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

  function isVisibleOnGlobe(lon, lat) {
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
    void projection; void dragTick;
    const isGlobe = projectionType === '3d';
    const k2d = state2d.k || 1;
    const out = [];
    for (const b of visibleBubbles) {
      const pt = projection([b.lon, b.lat]);
      if (!pt) continue;
      if (isGlobe && !isVisibleOnGlobe(b.lon, b.lat)) continue;
      const dx = b.dxBase || 0;
      const dy = b.dyBase || 0;
      const x = isGlobe ? pt[0] + dx : pt[0] + dx / k2d;
      const y = isGlobe ? pt[1] + dy : pt[1] + dy / k2d;
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
    void projection; void dragTick;
    const isGlobe = projectionType === '3d';
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
          out.push({
            id,
            kind: seg.kind,
            fromId: seg.from.id,
            toId: seg.to.id,
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

  // ─── Canvas redraw — camada estática (basemap) ───────────────────────────
  function redrawStatic() {
    if (!bgCtx || !projection) return;
    const isGlobe = projectionType === '3d';
    const geoPath = d3.geoPath().projection(projection).context(bgCtx);

    bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bgCtx.clearRect(0, 0, width, height);

    if (isGlobe) {
      bgCtx.beginPath();
      geoPath(SPHERE);
      bgCtx.fillStyle = '#f4f6f8';
      bgCtx.fill();
      bgCtx.strokeStyle = '#202020';
      bgCtx.lineWidth = 0.6;
      bgCtx.stroke();
    } else {
      bgCtx.fillStyle = '#ffffff';
      bgCtx.fillRect(0, 0, width, height);
    }

    if (countriesFeature) {
      // Um único path agregando todos os países: 1 fill em vez de 177.
      bgCtx.beginPath();
      geoPath(countriesFeature);
      bgCtx.fillStyle = '#202020';
      bgCtx.fill();

      // Bordas via mesh interno (cada borda compartilhada desenhada uma vez).
      if (countriesMesh) {
        bgCtx.beginPath();
        geoPath(countriesMesh);
        bgCtx.strokeStyle = isGlobe ? '#f4f6f8' : '#ffffff';
        bgCtx.lineWidth = 0.5;
        bgCtx.stroke();
      }
    }
  }

  // ─── Canvas redraw — camada dinâmica (trajetórias + bubbles) ─────────────
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
          ctx.globalAlpha = isHovering ? 0.15 : 1;
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
            ctx.strokeStyle = '#f59e0b';
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
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.6;
          ctx.globalAlpha = 1;
          ctx.stroke(highlightPath);
        }
        ctx.globalAlpha = 1;
      }
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
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1;
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
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }
    }

    ctx.globalAlpha = 1;
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
    if (hoveredBubbleId) {
      sel.style('cursor', 'pointer');
    } else {
      sel.style('cursor', 'grab');
    }
  }

  // ─── Mouse interaction (hit-test) ─────────────────────────────────────────
  // Throttled via rAF: no máximo uma checagem por frame.
  let pendingMouse = null;
  let mouseRaf = 0;
  function onMouseMove(e) {
    if (!canvasEl) return;
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
        if (hoveredBubbleId !== found.bubble.id) {
          hoveredBubbleId = found.bubble.id;
          dispatch('bubblehover', { bubble: found.bubble, x: clientX, y: clientY });
        } else {
          // Mesma bubble — só atualiza posição do tooltip
          dispatch('bubblehover', { bubble: found.bubble, x: clientX, y: clientY });
        }
      } else if (hoveredBubbleId) {
        hoveredBubbleId = null;
        dispatch('bubbleleave');
      }
    });
  }

  function onMouseLeave() {
    if (mouseRaf) { cancelAnimationFrame(mouseRaf); mouseRaf = 0; }
    pendingMouse = null;
    if (hoveredBubbleId) {
      hoveredBubbleId = null;
      dispatch('bubbleleave');
    }
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
    aria-label="Mapa interativo de criadores"
    on:mousemove={onMouseMove}
    on:mouseleave={onMouseLeave}
  ></canvas>
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
</style>
