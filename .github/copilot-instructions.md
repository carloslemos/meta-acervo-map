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

Cores canônicas por tipo — definidas em `src/lib/constants.js` (`TYPE_COLOR`) e importadas por todos os módulos que as usam. **Não duplicar hex strings nos componentes.**

| type | cor | hex |
|---|---|---|
| `birth` | azul | `#2563eb` |
| `death` | vermelho | `#dc2626` |
| `education` | verde | `#16a34a` |

## Convenções

- **Componentes Svelte**: continuar no padrão legado (`export let prop`, blocos `$:` para reatividade, `createEventDispatcher` + `on:event`). Não introduzir runes (`$state`, `$props`) sem migrar o resto do projeto junto.
- **SCSS**: use as variáveis CSS já definidas (`var(--bg)`, `var(--txt)`, etc.) em vez de hardcoded.
- **Acesso ao CSV**: sempre via `d3.csv()` em `dataUtils.js`. Componentes não leem o arquivo diretamente.
- **Filtros**: dispatcham eventos `change` com um `Set` no `event.detail`. O estado mestre vive em `App.svelte`.
- **Constantes compartilhadas**: `TYPE_COLOR`, `TYPE_LABEL`, `BUBBLE_RADIUS`, `CENTRAL_ROTATION`, `REF_W`, `REF_H` vivem em `src/lib/constants.js`. Importar de lá; nunca redefinir inline.
- **Pills alternáveis**: usar `ToggleGroup.svelte` com `items: { value, label }[]` e `active: Set`. Não duplicar lógica de toggle em novos filtros.
- **Não criar arquivos markdown de documentação** sobre mudanças, salvo pedido explícito.

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
