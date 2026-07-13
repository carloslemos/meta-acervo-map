# Exploração: Sistema de Temas (Claro/Escuro) — Meta-Acervo Map

## 1. Detecção e Controle do Tema

### Fonte de Verdade: `App.svelte`

```javascript
// Constantes do localStorage
const LS_THEME_KEY = 'meta-acervo:theme';  // importado de constants.js

// Lê preferência do localStorage (fallback 'dark')
function readTheme() {
  try {
    const v = localStorage.getItem(LS_THEME_KEY);
    return v === 'light' ? 'light' : 'dark';
  } catch { return 'dark'; }
}

// Persiste preferência
function saveTheme(val) {
  try { localStorage.setItem(LS_THEME_KEY, val); } catch { /* silencioso */ }
}

// Reactive binding com localStorage
let theme = readTheme();
$: saveTheme(theme);

// Aplica atributo data-theme no <html>
$: if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-theme', theme);
}
```

**Fluxo:**
1. `App.svelte` lê `localStorage.getItem('meta-acervo:theme')` na inicialização
2. Se inválido ou ausente, padrão é `'dark'`
3. Valor reativo é armazenado em variável local `let theme`
4. `$: saveTheme(theme)` persiste mudanças
5. `$: document.documentElement.setAttribute('data-theme', theme)` aplica no DOM raiz

### Valores Válidos
- `'dark'` — tema escuro (padrão)
- `'light'` — tema claro

---

## 2. Variáveis CSS — Estrutura em `global.scss`

### Padrão: Tokens Brutos + Aliases Semânticos

```scss
:root {
  /* ─── Tokens brutos (não referenciar diretamente) ─── */
  --color-white:  #ffffff;
  --color-black:  #121212;
  --color-yellow: #f0e442;   /* birth — Nascimento */
  --color-pink:   #cc79a7;   /* education — Estudos */
  --color-green:  #009e74;   /* death — Morte */

  /* Escala neutra (10 → 100) */
  --neutral-10:  #e8e8e8;  /* mais claro */
  --neutral-20:  #d2d2d2;
  /* ... */
  --neutral-100: #272727;  /* mais escuro */

  /* ─── ALIASES SEMÂNTICOS (referenciar nos componentes) ─── */
  --bg:    var(--color-black);      /* fundo principal (#121212) */
  --bg-l:  var(--neutral-100);      /* superfície elevada (#272727) */
  --bg-c:  rgba(18, 18, 18, 0.8);   /* cards em overlay */
  --bg-m:  var(--neutral-100);      /* fundo de inputs */
  --bg-hl: var(--neutral-90);       /* bordas e separadores */

  --txt:    var(--neutral-10);      /* texto primário (#e8e8e8) */
  --txt-l:  var(--neutral-30);      /* texto secundário (#bbbbbb) */
  --txt-hl: var(--neutral-60);      /* texto muted (#787878) */

  /* Cores de bubbles (espelham TYPE_COLOR em constants.js) */
  --birth-color: var(--color-yellow);
  --death-color: var(--color-green);
  --edu-color:   var(--color-pink);
  --accent:      var(--color-yellow);

  /* Pills de acervo (claro sobre escuro em dark mode) */
  --pill-neutral:       var(--neutral-10);   /* #e8e8e8 */
  --pill-neutral-hover: var(--neutral-30);   /* #bbbbbb */

  /* Chrome (sidebar + header) — gradiente quente escuro */
  --chrome-bg: linear-gradient(180deg, var(--color-black) 13.94%, #686868 100%);
  --chrome-txt:   var(--neutral-10);  /* #e8e8e8 */
  --chrome-txt-l: var(--neutral-30);  /* #bbbbbb */
}

/* ─── TEMA CLARO — [data-theme="light"] ─── */
[data-theme="light"] {
  --bg:    var(--color-white);       /* #ffffff */
  --bg-l:  var(--neutral-10);        /* #e8e8e8 */
  --bg-c:  rgba(255, 255, 255, 0.85);
  --bg-m:  var(--neutral-10);
  --bg-hl: var(--neutral-20);        /* #d2d2d2 */

  --txt:    var(--color-black);      /* #121212 */
  --txt-l:  var(--neutral-70);       /* #616161 */
  --txt-hl: var(--neutral-40);       /* #a5a5a5 */

  /* Pills ficam escuras sobre fundo claro */
  --pill-neutral:       var(--color-black);  /* #121212 */
  --pill-neutral-hover: var(--neutral-80);   /* #4b4b4b */

  /* Chrome — gradiente frio (neutro-escuro) para contrastar com mapa claro */
  --chrome-bg: linear-gradient(180deg, var(--neutral-100) 13.94%, var(--neutral-70) 100%);
  --chrome-txt:   var(--neutral-10);  /* #e8e8e8 — claro sobre escuro */
  --chrome-txt-l: var(--neutral-30);  /* #bbbbbb */
}
```

### Estrutura em Cascata

1. **Tokens Brutos** (`:root`)
   - Valores primitivos: cores Figma, escala neutra
   - Não mudam entre temas
   - Raro uso direto em componentes

2. **Aliases Semânticos** (`:root` + `[data-theme="light"]`)
   - Nomes descritivos: `--bg`, `--txt`, `--accent`
   - Remapeados por tema
   - **Padrão: referenciar sempre via aliases** em SCSS/componentes

3. **Mediaqueries**
   - Sidebar: 365px (desktop) → 302px (tablet) → 0px (mobile)
   - Header: 98px (desktop) → 90px (mobile)

---

## 3. Constantes de Cor em `constants.js`

### Paleta de Bubbles (Tipo)

```javascript
export const TYPE_COLOR = {
  birth:     '#f0e442',   // amarelo
  death:     '#009e74',   // verde
  education: '#cc79a7',   // rosa
  acervo:    '#ffffff',   // branco
};

export const TYPE_COLOR_HOVER = {
  birth:     '#f5e51c',   // amarelo saturado
  death:     '#2ec09c',   // verde-água
  education: '#e89bd3',   // rosa claro
  acervo:    '#bbbbbb',   // neutro-30
};

export const TYPE_LABEL = {
  birth:     'Nascimento',
  death:     'Morte',
  education: 'Estudos',
  acervo:    'Acervo',
};
```

**Nota importante:**
- `TYPE_COLOR` usadas **diretamente em canvas** (WorldMap.svelte), **não via CSS variables**
- **Não há variantes `_LIGHT`** para bubbles no constants.js
- Bubbles mantêm a mesma cor em ambos os temas (cores suficientemente saturadas)

### Trajetórias: Cores com Variantes `_LIGHT`

```javascript
// ─── Trajetórias: animação de fluxo ──────────────────────────────────────

/** Cor do ponto de fluxo em repouso (branco-gelo) — tema escuro */
export const TRAJECTORY_FLOW_COLOR_NORMAL = '#f4f6f8';

/** Cor do ponto de fluxo destacado (branco puro) — tema escuro */
export const TRAJECTORY_FLOW_COLOR_HIGHLIGHT = '#ffffff';

/** Cor do ponto de fluxo em repouso (cinza escuro) — tema claro */
export const TRAJECTORY_FLOW_COLOR_NORMAL_LIGHT = '#4b4b4b';

/** Cor do fio/ponto de destaque de trajetória (preto) — tema claro */
export const TRAJECTORY_FLOW_COLOR_HIGHLIGHT_LIGHT = '#121212';
```

**Padrão de Variantes:**
- `TRAJECTORY_FLOW_COLOR_NORMAL` (escuro)
- `TRAJECTORY_FLOW_COLOR_NORMAL_LIGHT` (claro)
- `TRAJECTORY_FLOW_COLOR_HIGHLIGHT` (escuro)
- `TRAJECTORY_FLOW_COLOR_HIGHLIGHT_LIGHT` (claro)

---

## 4. Como WorldMap.svelte Renderiza Bubbles e Aplica Cores

### Props de Tema

```javascript
// Em WorldMap.svelte
export let theme = 'dark';  // recebido de App.svelte via data-binding

export let bubbles = [];    // array de bubble objects
export let trajectories = []; // array de trajectory objects
```

### Renderização de Bubbles no Canvas

```javascript
// Em WorldMap.svelte — função redrawDynamic()

function redrawDynamic() {
  if (!ctx || !projection) return;

  // ... trajetórias ...

  // ─── BUBBLES ─────────────────────────────────────────────────
  const fillByColor = new Map(); // color → Path2D
  const highlightArcs = [];      // {x, y, color}

  // Cores adaptáveis ao tema — halo e stroke
  const bubbleHaloColor = theme === 'light' ? '#121212' : '#ffffff';
  const bubbleStrokeColor = theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';

  for (const { bubble, x, y } of positionedBubbles) {
    // TYPE_COLOR importado de constants.js
    const color = TYPE_COLOR[bubble.type];
    if (!color) continue;

    const isHighlightBubble = highlightedBubbleIds && highlightedBubbleIds.has(bubble.id);

    if (isHovering && isHighlightBubble) {
      // Bubble destacada — desenhada individualmente
      highlightArcs.push({ x, y, color });
    } else {
      // Bubble normal — agrupada por cor
      let p = fillByColor.get(color);
      if (!p) { p = new Path2D(); fillByColor.set(color, p); }
      p.moveTo(x + BUBBLE_RADIUS, y);
      p.arc(x, y, BUBBLE_RADIUS, 0, TAU);
    }
  }

  // Desenha fills agrupados
  ctx.globalAlpha = dimAlpha;
  ctx.strokeStyle = bubbleStrokeColor;
  ctx.lineWidth = 0.1;
  for (const [color, path] of fillByColor) {
    ctx.fillStyle = color;  // ← TYPE_COLOR (amarelo/verde/rosa)
    ctx.fill(path);
    ctx.stroke(path);
  }

  // Bubbles destacadas com halo
  if (highlightArcs.length) {
    ctx.globalAlpha = 1;
    for (const a of highlightArcs) {
      // Anel externo — cor adaptável ao tema
      ctx.beginPath();
      ctx.arc(a.x, a.y, BUBBLE_RADIUS + BUBBLE_HIGHLIGHT_RING_WIDTH, 0, TAU);
      ctx.fillStyle = bubbleHaloColor;  // ← tema adaptável
      ctx.fill();
      
      // Fill interno — TYPE_COLOR
      ctx.beginPath();
      ctx.arc(a.x, a.y, BUBBLE_RADIUS, 0, TAU);
      ctx.fillStyle = a.color;  // ← TYPE_COLOR
      ctx.fill();
    }
  }
}
```

### Seleção de Cores por Tema

```javascript
// No redrawDynamic() — adaptação de cores conforme tema

const flowHighlightColor = theme === 'light'
  ? TRAJECTORY_FLOW_COLOR_HIGHLIGHT_LIGHT
  : TRAJECTORY_FLOW_COLOR_HIGHLIGHT;

const flowNormalColor = theme === 'light'
  ? TRAJECTORY_FLOW_COLOR_NORMAL_LIGHT
  : TRAJECTORY_FLOW_COLOR_NORMAL;

const bubbleHaloColor = theme === 'light' ? '#121212' : '#ffffff';
const bubbleStrokeColor = theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
```

### Reatividade: Tema Dispara Redraw

```javascript
// Mudança de tema: repinta ambas as camadas (paleta do canvas muda)
$: { 
  void theme;
  if (bgCtx) markStaticDirty();
  if (ctx) markDynamicDirty(); 
}
```

---

## 5. Renderização do Mapa Base por Tema

### Background Canvas (redrawStatic)

```javascript
function redrawStatic() {
  // ...
  const isLight = theme === 'light';
  const isGlobe = morphing || projectionType === '3d';

  bgCtx.clearRect(0, 0, width, height);

  if (isGlobe) {
    /* Gradiente vertical: tema escuro topo preto → cinza; claro neutro → branco */
    const vertGrad = bgCtx.createLinearGradient(0, 0, 0, height);
    if (isLight) {
      vertGrad.addColorStop(0, 'rgba(240, 240, 240, 1)');
      vertGrad.addColorStop(1, 'rgba(248, 248, 248, 1)');
    } else {
      vertGrad.addColorStop(0,    'rgba(0, 0, 0, 1)');
      vertGrad.addColorStop(1,    'rgba(94, 94, 94, 1)');
    }
    bgCtx.fillStyle = vertGrad;
    bgCtx.fillRect(0, 0, width, height);

    /* Glow por trás do globo */
    if (isLight) {
      glow.addColorStop(0,   'rgba(255, 255, 255, 0.55)');
      glow.addColorStop(0.4, 'rgba(255, 255, 255, 0.18)');
      glow.addColorStop(1,   'rgba(255, 255, 255, 0)');
    } else {
      glow.addColorStop(0,   'rgba(94, 94, 94, 1)');
      glow.addColorStop(0.3, 'rgba(94, 94, 94, 0.3)');
      glow.addColorStop(1,   'rgba(94, 94, 94, 0)');
    }
  }

  // Continentes
  if (countriesFeature) {
    bgCtx.beginPath();
    geoPath(countriesFeature);
    if (isLight) {
      bgCtx.fillStyle = isGlobe ? '#4b4b4b' : 'rgba(75, 75, 75, 1)';
    } else {
      bgCtx.fillStyle = isGlobe ? '#404040' : 'rgba(125, 125, 125, 1)';
    }
    bgCtx.fill();

    // Bordas
    if (countriesMesh) {
      bgCtx.beginPath();
      geoPath(countriesMesh);
      if (isLight) {
        bgCtx.strokeStyle = isGlobe ? '#2a2a2a' : '#2a2a2a';
      } else {
        bgCtx.strokeStyle = isGlobe ? '#121212' : '#383838';
      }
      bgCtx.lineWidth = 0.5;
      bgCtx.stroke();
    }
  }

  /* Efeitos 3D (rim/sombra interna + brilho superior) */
  if (isGlobe) {
    // Rim — sombra interna
    if (isLight) {
      rim.addColorStop(0,    'rgba(0,0,0,0)');
      rim.addColorStop(0.7,  'rgba(0,0,0,0.03)');
      rim.addColorStop(1,    'rgba(0,0,0,0.16)');
    } else {
      rim.addColorStop(0,    'rgba(0,0,0,0)');
      rim.addColorStop(0.65, 'rgba(0,0,0,0.10)');
      rim.addColorStop(1,    'rgba(0,0,0,0.58)');
    }
  }
}
```

**Mapa Visual:**
- **Escuro**: fundo preto → cinza, continentes cinza, bordas preto
- **Claro**: fundo cinza-claro → branco, continentes cinza, bordas preto
- **Rim (sombra interna)**: sutil no claro, pronunciada no escuro
- **Brilho (halo)**: só no escuro

---

## 6. Componente ThemeToggle.svelte

### Props e Evento

```javascript
export let theme = 'dark';  // recebido de App.svelte

const dispatch = createEventDispatcher();

function select(value) {
  if (value !== theme) {
    dispatch('themechange', value);  // emite para App.svelte
  }
}
```

### Render

```svelte
<div class="theme-toggle" role="group" aria-label="Tema da interface">
  <!-- Tema escuro — lua -->
  <button
    type="button"
    class="map-btn"
    class:map-btn--active={theme === 'dark'}
    on:click={() => select('dark')}
    title="Tema escuro"
    aria-label="Tema escuro"
    aria-pressed={theme === 'dark'}
  >
    <!-- SVG da lua -->
  </button>

  <!-- Tema claro — sol -->
  <button
    type="button"
    class="map-btn"
    class:map-btn--active={theme === 'light'}
    on:click={() => select('light')}
    title="Tema claro"
    aria-label="Tema claro"
    aria-pressed={theme === 'light'}
  >
    <!-- SVG do sol -->
  </button>
</div>
```

### Estilos

```scss
.theme-toggle {
  display: flex;
  flex-direction: column;
  gap: 2px;
  pointer-events: none;
}

.map-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1.65px solid var(--neutral-10);  // branco (escuro)
  border-radius: 5.28px;
  color: var(--neutral-10);
  cursor: pointer;
  pointer-events: auto;
  transition: color 0.12s, border-color 0.12s, background 0.12s;
  backdrop-filter: blur(3.52px);

  &:hover {
    border-color: var(--neutral-30);
    color: var(--neutral-30);
  }
}

.map-btn--active {
  background: var(--neutral-10);        // branco
  border-color: var(--neutral-10);
  color: var(--color-black);             // preto (texto sobre fundo branco)
  cursor: default;

  &:hover {
    background: var(--neutral-30);
    border-color: var(--neutral-30);
    color: var(--color-black);
  }
}
```

**Comportamento:**
- Botão ativo: fundo branco com ícone preto
- Botão inativo: fundo transparente com ícone branco/cinza
- Blur backdrop para efeito vidro

### Integração em App.svelte

```javascript
// Em App.svelte
let theme = readTheme();

// Event listener no ThemeToggle
on:themechange={e => {
  theme = e.detail;  // atualiza state
  // Automaticamente dispara:
  // 1. $: saveTheme(theme) — persiste no localStorage
  // 2. $: document.documentElement.setAttribute('data-theme', theme)
  // 3. Reatividade em WorldMap.svelte → markDynamicDirty() → redraw
}}

// Passar para ThemeToggle
<ThemeToggle {theme} on:themechange />
```

---

## 7. Fluxo Completo: Mudança de Tema

```
1. Usuário clica botão no ThemeToggle
   ↓
2. ThemeToggle dispatch('themechange', 'light' | 'dark')
   ↓
3. App.svelte recebe event, atualiza `let theme = e.detail`
   ↓
4. $: saveTheme(theme) — localStorage.setItem('meta-acervo:theme', 'light')
   ↓
5. $: document.documentElement.setAttribute('data-theme', 'light')
   ↓
6. CSS aliases remapeiam:
   --bg: #ffffff
   --txt: #121212
   --chrome-bg: linear-gradient(...neutral-100 → neutral-70)
   ↓
7. App.svelte passa `{theme}` para WorldMap
   ↓
8. WorldMap reatividade: $: { void theme; markStaticDirty(); markDynamicDirty(); }
   ↓
9. redrawStatic() usa `const isLight = theme === 'light'`
   → gradientes, continentes, rim/glow adaptativos
   ↓
10. redrawDynamic() usa:
    - bubbleHaloColor = theme === 'light' ? '#121212' : '#ffffff'
    - flowHighlightColor = TRAJECTORY_FLOW_COLOR_HIGHLIGHT_LIGHT ou HIGHLIGHT
    → repainta canvas com paleta nova
```

---

## 8. Sumário: Onde as Cores São Definidas

### Bubbles (3 tipos)

| Onde | O quê | Valor |
|------|-------|-------|
| `constants.js` | `TYPE_COLOR.birth` | `#f0e442` amarelo |
| `constants.js` | `TYPE_COLOR.death` | `#009e74` verde |
| `constants.js` | `TYPE_COLOR.education` | `#cc79a7` rosa |
| `WorldMap.svelte` redrawDynamic | Halo (ring ao redor) | `#ffffff` (escuro) ou `#121212` (claro) |
| `WorldMap.svelte` redrawDynamic | Stroke | `rgba(255,255,255,0.1)` (escuro) ou `rgba(0,0,0,0.1)` (claro) |

### Trajetórias

| Onde | O quê | Escuro | Claro |
|------|-------|--------|-------|
| `constants.js` | `TRAJECTORY_FLOW_COLOR_NORMAL` | `#f4f6f8` | — |
| `constants.js` | `TRAJECTORY_FLOW_COLOR_NORMAL_LIGHT` | — | `#4b4b4b` |
| `constants.js` | `TRAJECTORY_FLOW_COLOR_HIGHLIGHT` | `#ffffff` | — |
| `constants.js` | `TRAJECTORY_FLOW_COLOR_HIGHLIGHT_LIGHT` | — | `#121212` |
| `WorldMap.svelte` redrawDynamic | Seleção condicional | `flowHighlightColor = theme === 'light' ? LIGHT : NORMAL` | |

### Mapa Base

| Onde | O quê | Escuro | Claro |
|------|-------|--------|-------|
| `WorldMap.svelte` redrawStatic | Fundo globo/mapa | gradiente (preto → cinza) | gradiente (cinza → branco) |
| `WorldMap.svelte` redrawStatic | Continentes | `#404040` | `#4b4b4b` |
| `WorldMap.svelte` redrawStatic | Bordas | `#121212` | `#2a2a2a` |
| `WorldMap.svelte` redrawStatic | Rim (sombra) | `rgba(0,0,0,0.58)` | `rgba(0,0,0,0.16)` |

### CSS (Chrome/UI)

| Onde | O quê | Tokens |
|------|-------|--------|
| `global.scss` `:root` | Fundo | `--bg: #121212`, `--bg-l: #272727` |
| `global.scss` `:root` | Texto | `--txt: #e8e8e8`, `--txt-l: #bbbbbb` |
| `global.scss` `:root` | Chrome | `--chrome-bg: linear-gradient(black → #686868)` |
| `global.scss` `[data-theme="light"]` | Fundo | `--bg: #ffffff`, `--bg-l: #e8e8e8` |
| `global.scss` `[data-theme="light"]` | Texto | `--txt: #121212`, `--txt-l: #616161` |
| `global.scss` `[data-theme="light"]` | Chrome | `--chrome-bg: linear-gradient(#272727 → #616161)` |

---

## 9. Pontos Importantes

1. **Bubbles NÃO têm variantes `_LIGHT`**
   - `TYPE_COLOR.birth`, `TYPE_COLOR.death`, `TYPE_COLOR.education` são invariantes
   - Mantêm mesma cor em ambos os temas (saturação suficiente)
   - Só o halo (ring) e stroke são adaptáveis

2. **Trajetórias SIM têm variantes `_LIGHT`**
   - Padrão: `*_NORMAL` e `*_NORMAL_LIGHT`
   - Razão: pontos de fluxo precisam de contraste sobre fundo claro/escuro

3. **Canvas é atualizado no rAF**
   - `markStaticDirty()` + `markDynamicDirty()` coalesce múltiplas mudanças
   - Uma única chamada de `redrawStatic()` + `redrawDynamic()` por frame

4. **localStorage é resiliente**
   - Try-catch em `readTheme()` e `saveTheme()` para modo privado / quota
   - Fallback seguro: sempre `'dark'`

5. **Reatividade via `$: void theme`**
   - Dependência explícita força redraw quando tema muda
   - WorldMap recalcula cores no canvas em tempo real

6. **CSS Variables usam aliases semânticos**
   - Componentes SCSS referenciam `var(--bg)`, `var(--txt)`, nunca `var(--color-black)`
   - Centraliza adaptação em `:root` e `[data-theme="light"]`
