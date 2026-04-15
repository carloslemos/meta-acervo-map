<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import * as d3 from 'd3';
  import * as topojson from 'topojson-client';

  export let bubbles = [];
  export let activeTypes = new Set(['birth', 'death']);

  const dispatch = createEventDispatcher();

  const WIDTH = 960;
  const HEIGHT = 500;
  const BUBBLE_RADIUS = 2.5;

  let svgEl;
  let pathGenerator;
  let countriesFeature = null;
  let projection = d3.geoNaturalEarth1()
    .scale(168)
    .translate([WIDTH / 2, HEIGHT / 2 + 25]);

  pathGenerator = d3.geoPath().projection(projection);

  // Colour map per type — vivid against white background
  const TYPE_COLOR = {
    birth: '#2563eb',
    death: '#dc2626',
    education: '#16a34a',
  };

  onMount(async () => {
    const topo = await d3.json('/countries-110m.json');
    countriesFeature = topojson.feature(topo, topo.objects.countries);
  });

  function project(lon, lat) {
    const pt = projection([lon, lat]);
    return pt ? { x: pt[0], y: pt[1] } : null;
  }

  function onBubbleEnter(event, bubble) {
    dispatch('bubblehover', { bubble, x: event.clientX, y: event.clientY });
  }

  function onBubbleLeave() {
    dispatch('bubbleleave');
  }

  $: visibleBubbles = bubbles.filter(b => activeTypes.has(b.type));
</script>

<svg
  bind:this={svgEl}
  viewBox="0 0 {WIDTH} {HEIGHT}"
  class="world-map"
  aria-label="Mapa interativo de criadores"
>
  <!-- Sphere / ocean background -->
  <rect width={WIDTH} height={HEIGHT} class="ocean" />

  {#if countriesFeature}
    <g class="countries">
      {#each countriesFeature.features.filter(f => +f.id !== 10) as feature, i (feature.id ?? i)}
        <path d={pathGenerator(feature)} class="country" />
      {/each}
    </g>
  {/if}

  <!-- Bubbles -->
  <g class="bubbles">
    {#each visibleBubbles as bubble (bubble.id)}
      {@const pt = project(bubble.lon, bubble.lat)}
      {#if pt}
        <circle
          cx={pt.x}
          cy={pt.y}
          r={BUBBLE_RADIUS}
          class="bubble bubble--{bubble.type}"
          style="fill: {TYPE_COLOR[bubble.type]}"
          role="img"
          aria-label="{bubble.creator} — {bubble.type}"
          on:mouseenter={(e) => onBubbleEnter(e, bubble)}
          on:mouseleave={onBubbleLeave}
        />
      {/if}
    {/each}
  </g>
</svg>

<style lang="scss">
  .world-map {
    width: 100%;
    height: 100%;
    display: block;
  }

  .ocean {
    fill: #ffffff;
  }

  .country {
    fill: #202020;
    stroke: #ffffff;
    stroke-width: 0.5;
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
