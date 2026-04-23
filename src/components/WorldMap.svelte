<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import * as d3 from 'd3';
  import * as topojson from 'topojson-client';

  export let bubbles = [];
  export let trajectories = [];
  export let activeTypes = new Set(['birth', 'death']);
  export let projectionType = '2d';

  const dispatch = createEventDispatcher();

  const WIDTH = 960;
  const HEIGHT = 500;
  const BUBBLE_RADIUS = 2.5;

  let svgEl;
  let countriesFeature = null;

  // Base projection parameters (the "identity" pose)
  const BASE_2D = { translate: [WIDTH / 2, HEIGHT / 2 + 25], scale: 168 };
  const BASE_3D = { scale: 220 };

  // Per-projection state — preserved when switching back
  // 2D: zoom transform {k, x, y}. 3D: rotation + zoom factor k
  const state2d = { k: 1, x: 0, y: 0 };
  const state3d = { rotate: [0, -10, 0], k: 1 };

  // Reactive projection: rebuilt when projectionType (or its state) changes
  let projection;
  let pathGenerator;
  // Unclipped variant of the projection — used for trajectory endpoints so an
  // arc remains visible even when one endpoint sits on the back of the globe.
  let projectionUnclipped;
  let dragTick = 0;

  $: {
    dragTick; // re-run when state mutates
    if (projectionType === '3d') {
      projection = d3.geoOrthographic()
        .scale(BASE_3D.scale * state3d.k)
        .translate([WIDTH / 2, HEIGHT / 2])
        .rotate(state3d.rotate)
        .clipAngle(90);
      projectionUnclipped = d3.geoOrthographic()
        .scale(BASE_3D.scale * state3d.k)
        .translate([WIDTH / 2, HEIGHT / 2])
        .rotate(state3d.rotate);
      // no clipAngle → projects back-hemisphere points too
    } else {
      // d3.zoom transform applied to base translate
      const tx = BASE_2D.translate[0] * state2d.k + state2d.x;
      const ty = BASE_2D.translate[1] * state2d.k + state2d.y;
      projection = d3.geoNaturalEarth1()
        .scale(BASE_2D.scale * state2d.k)
        .translate([tx, ty]);
      projectionUnclipped = projection;
    }
    pathGenerator = d3.geoPath().projection(projection);
  }

  // Sphere outline (used as ocean for the globe)
  const SPHERE = { type: 'Sphere' };

  // Colour map per type — vivid against white background
  const TYPE_COLOR = {
    birth: '#2563eb',
    death: '#dc2626',
    education: '#16a34a',
  };

  onMount(async () => {
    const topo = await d3.json('countries-110m.json');
    countriesFeature = topojson.feature(topo, topo.objects.countries);
  });

  // Attach drag & zoom — only re-runs when projection mode or svg element changes
  let attachedFor = null;
  $: if (svgEl && attachedFor !== projectionType) {
    attachedFor = projectionType;
    const sel = d3.select(svgEl);
    sel.on('.drag', null);
    sel.on('.zoom', null);

    if (projectionType === '3d') {
      const zoom = d3.zoom()
        .scaleExtent([0.5, 5])
        .filter((e) => e.type === 'wheel' || e.type === 'touchstart' || e.type === 'touchmove')
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
      // Sync zoom transform with current state
      sel.call(zoom.transform, d3.zoomIdentity.scale(state3d.k));
    } else {
      const zoom = d3.zoom()
        .scaleExtent([0.5, 8])
        .on('zoom', (e) => {
          state2d.k = e.transform.k;
          state2d.x = e.transform.x;
          state2d.y = e.transform.y;
          dragTick++;
        });

      sel.call(zoom).style('cursor', 'grab');
      sel.call(zoom.transform, d3.zoomIdentity.translate(state2d.x, state2d.y).scale(state2d.k));
    }
  }

  function project(lon, lat) {
    const pt = projection([lon, lat]);
    return pt ? { x: pt[0], y: pt[1] } : null;
  }

  // For orthographic, hide bubbles on the back hemisphere
  function isVisibleOnGlobe(lon, lat) {
    if (projectionType !== '3d') return true;
    const [λ, φ] = state3d.rotate;
    const center = [-λ, -φ];
    return d3.geoDistance(center, [lon, lat]) < Math.PI / 2;
  }

  function onBubbleEnter(event, bubble) {
    hoveredBubbleId = bubble.id;
    dispatch('bubblehover', { bubble, x: event.clientX, y: event.clientY });
  }

  function onBubbleLeave() {
    hoveredBubbleId = null;
    dispatch('bubbleleave');
  }

  $: visibleBubbles = bubbles.filter(b => activeTypes.has(b.type));

  // Project bubbles to (x0, y0) target positions. The simulation will then
  // gently push them apart via collision while pulling toward the target.
  $: projectedTargets = (() => {
    void projection; void dragTick;
    return visibleBubbles
      .map(b => {
        const pt = project(b.lon, b.lat);
        const shown = isVisibleOnGlobe(b.lon, b.lat);
        return pt && shown ? { bubble: b, x0: pt.x, y0: pt.y } : null;
      })
      .filter(Boolean);
  })();

  // One-shot collision relax: applies a single iteration of d3.forceCollide
  // to gently nudge overlapping bubbles apart, without running a continuous sim.
  $: positionedBubbles = (() => {
    const nodes = projectedTargets.map(t => ({ bubble: t.bubble, x: t.x0, y: t.y0 }));
    const collide = d3.forceCollide(BUBBLE_RADIUS + 0.5).strength(0.7);
    collide.initialize(nodes, () => Math.random());
    collide(1); // single iteration
    return nodes;
  })();

  // Project trajectory segments to SVG paths (parabolic Bézier arcs).
  // Uses the unclipped projection so segments remain visible even if an endpoint
  // is on the back hemisphere of the globe — only the user filters hide them.
  $: positionedTrajectories = (() => {
    void projection; void dragTick;
    const proj = projectionUnclipped;
    const out = [];
    for (const t of trajectories) {
      for (const seg of t.segments) {
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
        const cx = mx + (-dy / dist) * offset;
        const cy = my + (dx / dist) * offset;
        out.push({
          id: `${seg.from.id}__${seg.to.id}`,
          kind: seg.kind,
          fromId: seg.from.id,
          toId: seg.to.id,
          d: `M${ax},${ay} Q${cx},${cy} ${bx},${by}`,
        });
      }
    }
    return out;
  })();

  // Hover highlight: when hovering a bubble, find its trajectory and highlight
  // related bubbles + segments. A bubble's row index is the suffix of its id.
  let hoveredBubbleId = null;
  $: hoveredRowIdx = hoveredBubbleId ? hoveredBubbleId.split('-').pop() : null;
  $: highlightedBubbleIds = (() => {
    if (!hoveredBubbleId) return null;
    const ids = new Set();
    for (const t of trajectories) {
      // any segment that touches the hovered bubble?
      const touches = t.segments.some(s => s.from.id === hoveredBubbleId || s.to.id === hoveredBubbleId);
      if (touches) {
        for (const s of t.segments) {
          ids.add(s.from.id);
          ids.add(s.to.id);
        }
      }
    }
    // Always include the hovered bubble itself (even with no trajectory)
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
</script>

<svg
  bind:this={svgEl}
  viewBox="0 0 {WIDTH} {HEIGHT}"
  class="world-map"
  class:world-map--globe={projectionType === '3d'}
  aria-label="Mapa interativo de criadores"
>
  {#if projectionType === '3d'}
    <!-- Sphere as ocean -->
    <path d={pathGenerator(SPHERE)} class="ocean-sphere" />
  {:else}
    <rect width={WIDTH} height={HEIGHT} class="ocean" />
  {/if}

  {#if countriesFeature}
    <g class="countries">
      {#each countriesFeature.features.filter(f => +f.id !== 10) as feature, i (feature.id ?? i)}
        <path d={pathGenerator(feature)} class="country" />
      {/each}
    </g>
  {/if}

  <!-- Trajectories (drawn beneath bubbles) -->
  <g class="trajectories" class:is-hovering={hoveredBubbleId}>
    {#each positionedTrajectories as seg (seg.id)}
      <path
        d={seg.d}
        class="trajectory trajectory--{seg.kind}"
        class:trajectory--highlight={highlightedSegmentIds && highlightedSegmentIds.has(seg.id)}
      />
    {/each}
  </g>

  <!-- Bubbles -->
  <g class="bubbles" class:is-hovering={hoveredBubbleId}>
    {#each positionedBubbles as { bubble, x, y } (bubble.id)}
      <circle
        cx={x}
        cy={y}
        r={BUBBLE_RADIUS}
        class="bubble bubble--{bubble.type}"
        class:bubble--highlight={highlightedBubbleIds && highlightedBubbleIds.has(bubble.id)}
        style="fill: {TYPE_COLOR[bubble.type]}"
        role="img"
        aria-label="{bubble.creator} — {bubble.type}"
        on:mouseenter={(e) => onBubbleEnter(e, bubble)}
        on:mouseleave={onBubbleLeave}
      />
    {/each}
  </g>
</svg>

<style lang="scss">
  .world-map {
    width: 100%;
    height: 100%;
    display: block;
    touch-action: none; /* prevent native gestures interfering with drag */
  }

  .ocean {
    fill: #ffffff;
  }

  .ocean-sphere {
    fill: #f4f6f8;
    stroke: #202020;
    stroke-width: 0.6;
  }

  .country {
    fill: #202020;
    stroke: #ffffff;
    stroke-width: 0.5;
  }

  .world-map--globe .country {
    stroke: #f4f6f8;
  }

  .trajectory {
    fill: none;
    stroke: rgba(32, 32, 32, 0.35);
    stroke-width: 0.6;
    pointer-events: none;
    transition: stroke 0.12s ease, stroke-width 0.12s ease, opacity 0.12s ease;
  }

  .world-map--globe .trajectory {
    stroke: rgba(32, 32, 32, 0.5);
  }

  /* Dim non-related elements while hovering */
  .trajectories.is-hovering .trajectory {
    opacity: 0.15;
  }
  .trajectories.is-hovering .trajectory--highlight {
    opacity: 1;
    stroke: #f59e0b;
    stroke-width: 1.6;
  }
  .bubbles.is-hovering .bubble {
    opacity: 0.25;
  }
  .bubbles.is-hovering .bubble--highlight {
    opacity: 1;
    stroke: #f59e0b;
    stroke-width: 1.8;
  }

  .bubble {
    opacity: 0.85;
    stroke: rgba(255, 255, 255, 0.7);
    stroke-width: 1;
    cursor: pointer;
    transition: opacity 0.12s ease;

    &:hover {
      opacity: 1;
      stroke-width: 2;
      stroke: #202020;
    }
  }
</style>

