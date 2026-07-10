# Meta-Acervo Map — Instruções do projeto

Mapa interativo de criadores da base **Meta-Acervos** (FAU-USP). Plota nascimento, morte e local de estudo dos criadores sobre um mapa-múndi, com filtros por acervo, escola e nacionalidade.

## Stack

| Tecnologia | Versão |
|---|---|
| Svelte | 5 (uso em **modo legado** — `export let`, `$:`, `on:event`, `createEventDispatcher`) |
| Vite | 6 |
| D3.js | 7 |
| topojson-client | 3 |
| Sass | 1 |

**Sem TypeScript. Sem testes automatizados.** Idioma da UI e dos comentários: **PT-BR**.

## Estrutura

```
source/
  atlas_ma_0501_v2.csv          # dataset principal
  educated_at_geolocated.csv    # geolocalização de instituições de ensino
  countries-110m.json           # mapa-base (Natural Earth 110m TopoJSON)
src/
  App.svelte                    # estado global, carrega dados, conecta filtros
  main.js                       # bootstrap
  lib/
    constants.js                # fonte de verdade: TYPE_COLOR, TYPE_LABEL, BUBBLE_RADIUS, CENTRAL_ROTATION, REF_W, REF_H
    dataUtils.js                # loadData() — CSV → bubbles[] + trajectories[]
    filterModel.js              # applyFilters() + applyTrajectoryFilter() — predicados puros, testáveis em isolamento
  components/
    WorldMap.svelte             # SVG/Canvas D3 + projeção Natural Earth (2D e globo 3D)
    Tooltip.svelte              # tooltip flutuante por hover
    FilterControls.svelte       # filtro por tipo (birth/death/education)
    AcervoFilter.svelte         # filtro por acervo (usa ToggleGroup)
    GenderFilter.svelte         # filtro por gênero (usa ToggleGroup)
    ToggleGroup.svelte          # pills alternáveis reutilizáveis — layout 'wrap' ou 'list'
    ProjectionToggle.svelte     # alterna projeção 2D ↔ globo 3D
    AutocompleteSelect.svelte   # input de autocomplete reutilizável
    Sidebar.svelte              # composição dos filtros
  styles/global.scss            # variáveis CSS (--bg, --bg-l, --txt, --accent)
```

## Modelo de dados — "bubble"

`loadData()` em `src/lib/dataUtils.js` lê o CSV e gera um array de bubbles e um array de trajetórias. Cada linha do CSV pode produzir até 3 bubbles (uma por tipo) e um objeto `trajectory` com segmentos `from → to`.

```js
{
  id: 'birth-42' | 'death-42' | 'education-42',
  creator: string,
  lat: number,
  lon: number,
  type: 'birth' | 'death' | 'education',
  place: string,
  acervos: string[],
  educatedAt: string[],
  nationality: string,
  gender: string,           // 'male' | 'female' | 'non-binary' | 'unknown'
  score: number,
  confidence: 'alta' | 'médio' | 'baixo' | null,
  dxBase: number,           // offset de colisão pré-computado
  dyBase: number,
  schoolName?: string,      // só em type === 'education'
}
```

Trajetória:
```js
{
  creator: string,
  segments: [{ from: bubble, to: bubble, kind: string }],
}
```

Cores canônicas por tipo — definidas em `src/lib/constants.js` (`TYPE_COLOR`) e importadas por todos os módulos que as usam. **Não duplicar hex strings nos componentes.** Paleta do tema escuro (referência Figma).

| type | cor | hex |
|---|---|---|
| `birth` | amarelo | `#f5e51c` |
| `death` | verde água | `#2ec09c` |
| `education` | rosa | `#e89bd3` |
| `acervo` | branco | `#ffffff` |

## Convenções

- **Componentes Svelte**: continuar no padrão legado (`export let prop`, blocos `$:` para reatividade, `createEventDispatcher` + `on:event`). Não introduzir runes (`$state`, `$props`) sem migrar o resto do projeto junto.
- **SCSS**: use as variáveis CSS já definidas (`var(--bg)`, `var(--txt)`, etc.) em vez de hardcoded.
- **Acesso ao CSV**: sempre via `d3.csv()` em `dataUtils.js`. Componentes não leem o arquivo diretamente.
- **Filtros**: dispatcham eventos `change` com um `Set` no `event.detail`. O estado mestre vive em `App.svelte`. Os **predicados de filtragem** vivem em `src/lib/filterModel.js` (`applyFilters`, `applyTrajectoryFilter`) — adicionar um novo filtro requer apenas estender o parâmetro e o predicado nesse módulo.
- **Constantes compartilhadas**: `TYPE_COLOR`, `TYPE_LABEL`, `BUBBLE_RADIUS`, `CENTRAL_ROTATION`, REF_W`, `REF_H` vivem em `src/lib/constants.js`. Importar de lá; nunca redefinir inline.
- **Pills alternáveis**: usar `ToggleGroup.svelte` com `items: { value, label }[]` e `active: Set`. Não duplicar lógica de toggle em novos filtros.
- **Não criar arquivos markdown de documentação** sobre mudanças, salvo pedido explícito.

## Constantes e Magic Numbers — `src/lib/constants.js`

**Princípio**: Nenhum valor hardcoded deve estar espalhado nos componentes. Cores, durations, dimensões, URLs e textos imutáveis pertencem a `constants.js`.

### O que vai em `constants.js`

✅ **Valores imutáveis que podem ser alterados globalmente:**
- Cores (TYPE_COLOR, TRAJECTORY_FLOW_COLOR_NORMAL, etc.)
- Rótulos/labels (TYPE_LABEL, CONFIDENCE_LABEL, etc.)
- Dimensões fixas (BUBBLE_RADIUS, ARTWORK_STRIP_HEIGHT_EXPANDED, etc.)
- Durations de animação (TRANSITION_FAST, ARTWORK_STRIP_TRANSITION_DURATION, etc.)
- URLs, paths, endpoints
- Valores sentinela (UNDATED_YEAR = 9999)
- Fatores de escala (PROJECTION_3D_SCALE_FACTOR, etc.)
- Breakpoints (BREAKPOINT_MOBILE, etc.)
- Flags de features (TRAJECTORY_FLOW_ENABLED, PROJECTION_MORPH_ENABLED, etc.)

❌ **O que NÃO vai em constants.js:**
- State reativo (use `export let` em Svelte ou stores)
- Valores computados dinamicamente (altura do canvas, posições, etc.)
- State transitório (hover, seleção atual, etc.)

### Estrutura de constants.js

Constantes organizadas por seção (comentários `// ─── Seção ───`), com documentação de propósito:

```javascript
// ─── Cores e rótulos por tipo de bubble ──────────────────────────────────────
export const TYPE_COLOR = { ... };
export const TYPE_LABEL = { ... };

// ─── Trajetórias: animação de fluxo ──────────────────────────────────────────
export const TRAJECTORY_FLOW_ENABLED = true;
export const TRAJECTORY_FLOW_SPEED_PX = 0.06;
// ... etc
```

### Como usar constantes

**Importar:**
```svelte
<!-- Em World.svelte, por exemplo -->
<script>
  import { 
    TYPE_COLOR, 
    TRAJECTORY_FLOW_SPEED_PX,
    ARTWORK_STRIP_HEIGHT_EXPANDED 
  } from '../lib/constants.js';
</script>
```

**Usar:**
```javascript
// Em componente Svelte
const color = TYPE_COLOR.birth;
const speed = TRAJECTORY_FLOW_SPEED_PX;

// Em CSS (se variável CSS)
fill: var(--accent);

// Em lógica
if (height > ARTWORK_STRIP_HEIGHT_EXPANDED) { ... }
```

### Como adicionar nova constante

1. **Identificar** se é realmente uma constante (valor imutável? será alterado globalmente?)
2. **Adicionar a constants.js** na seção apropriada (ou criar seção se necessário):
   ```javascript
   // ─── Nova Seção ───────────────────────────────────────────────────────
   /** Descrição do propósito e contexto. */
   export const NEW_CONSTANT_NAME = value;
   ```
3. **Documenting**: adicionar comentário explicativo
4. **Importar e usar** nos componentes

### Exemplo: Mudar cor do fluxo de trajetória

**Antes** (sem constantes): vasculhar WorldMap.svelte, achar `const FLOW_COLOR_HIGHLIGHT = '#e68d0c'`, mudar, esperar que não haja outra cópia em outro arquivo.

**Depois** (com constantes): 
1. Mudar `constants.js`: `export const TRAJECTORY_FLOW_COLOR_HIGHLIGHT = '#ffffff'` (branco)
2. Rebuildar/recarregar. Feito.

### Exemplo: Trocar arquivo CSV de criadores

**Antes** (sem constantes): encontrar `d3.dsv(';', 'atlas_ma_0522_v2.csv')` em `dataUtils.js`, mudar para `atlas_ma_0530_v3.csv`, testar.

**Depois** (com constantes):
1. Mudar `constants.js`: `export const CSV_CREATORS_PATH = 'atlas_ma_0530_v3.csv'`
2. Todos os carregamentos de dados (teste, build, dev) usam a versão nova automaticamente.

## Fluxo de dados

1. `App.svelte` chama `loadData()` no `onMount` — retorna `{ bubbles, trajectories }`
2. Deriva listas únicas de acervos / gêneros / escolas / nacionalidades
3. Computa reativamente `bubblesForMap` e `trajectoriesForMap` aplicando todos os filtros ativos
4. Passa os dados filtrados + estado de filtros para `WorldMap` e `Sidebar`
5. `WorldMap` renderiza bubbles e trajetórias em canvas (camada estática + dinâmica)
6. Hover dispara evento `bubblehover` que atualiza `Tooltip`

## Ao adicionar novo tipo de bubble (ex: `burial`)

1. Adicionar bloco `if (!isNaN(lat) && !isNaN(lon))` em `loadData()` seguindo o padrão de `birth`/`death`/`education`
2. Adicionar entrada em `TYPE_COLOR` e `TYPE_LABEL` em **`src/lib/constants.js`** (única fonte de verdade)
3. Adicionar entrada em `FILTERS` (`FilterControls.svelte`) com `disabled: false` se houver dados
4. Verificar cobertura dos dados antes — ver skill `/csv-data`

## Gerenciamento de projeto — GitHub Issues

O rastreador oficial do projeto é o **GitHub Issues** no repositório [`carloslemos/meta-acervo-map`](https://github.com/carloslemos/meta-acervo-map).

### Labels canônicos

| Label | Uso |
|---|---|
| `spec` | Issue é uma especificação completa (PRD), gerada pela skill `/para-spec` |
| `ready-for-agent` | Ticket pronto para ser implementado por um agente de IA |
| `enhancement` | Nova funcionalidade ou melhoria |
| `bug` | Comportamento incorreto |
| `data` | Relacionado ao dataset CSV ou geolocalização |
| `design` | Relacionado à UI, visual ou projeção do mapa |
| `refactor` | Melhoria interna sem mudança de comportamento visível |

### Workflow de planejamento

Use as skills de engenharia nesta ordem:

1. **`/refinar-com-docs`** — Afiar a ideia com entrevista e criar ADRs/glossário
2. **`/para-spec`** → publica issue com label `spec` no GitHub
3. **`/para-tickets`** → quebra a spec em issues de implementação com label `ready-for-agent`
4. **`/melhorar-arquitetura`** — Identificar fricção arquitetural antes de implementar
5. **`/design-de-modulos`** — Vocabulário compartilhado para projetar interfaces durante a implementação

### Convenções de issues

- **Título de spec:** `[spec] <título descritivo>`
- **Título de ticket:** `[feat]` / `[fix]` / `[refactor]` / `[data]` + título descritivo curto
- **Relações de bloqueio:** usar campo "Blocked by" ou sub-issues nativos do GitHub quando disponível
- **Caminhos de arquivo** não devem aparecer em issues — eles ficam desatualizados; use o vocabulário de domínio
- **Vocabulário de domínio obrigatório em issues:** "bubble", "trajetória", "acervo", "criador", "filtro", "projeção", "costura"

### Skills disponíveis

| Skill | Descrição curta |
|---|---|
| `/csv-data` | Auditoria e cobertura do dataset CSV |
| `/design-de-modulos` | Vocabulário para projetar módulos profundos |
| `/refinar-com-docs` | Entrevista para afiar planos e criar ADRs |
| `/melhorar-arquitetura` | Varredura de fricção arquitetural com relatório HTML |
| `/para-spec` | Converte conversa em spec publicada no GitHub |
| `/para-tickets` | Quebra spec/plano em tickets tracer-bullet no GitHub |
