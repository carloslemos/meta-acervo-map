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
  resultado_geolocalizado.csv   # dataset principal
  countries-110m.json           # mapa-base (Natural Earth 110m TopoJSON)
src/
  App.svelte                    # estado global, carrega dados, conecta filtros
  main.js                       # bootstrap
  lib/dataUtils.js              # loadData() — CSV → bubbles[]
  components/
    WorldMap.svelte             # SVG D3 + projeção Natural Earth
    Tooltip.svelte              # tooltip flutuante por hover
    FilterControls.svelte       # filtro por tipo (birth/death/education)
    AcervoFilter.svelte         # filtro por acervo
    AutocompleteSelect.svelte   # input de autocomplete reutilizável
    Sidebar.svelte              # composição dos filtros
  styles/global.scss            # variáveis CSS (--bg, --bg-l, --txt, --accent)
```

## Modelo de dados — "bubble"

`loadData()` em `src/lib/dataUtils.js` lê o CSV e gera um array de bubbles. Cada linha do CSV pode produzir até 3 bubbles (uma por tipo).

```js
{
  id: 'birth-42' | 'death-42' | 'education-42',
  creator: string,
  lat: number,
  lon: number,
  type: 'birth' | 'death' | 'education',
  place: string,
  acervo: string,
  educatedAt: string[],
  nationality: string,
  score: number,
  schoolName?: string,   // só em type === 'education'
}
```

Cores canônicas por tipo (definidas em `WorldMap.svelte` e `Tooltip.svelte`):

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
- **Não criar arquivos markdown de documentação** sobre mudanças, salvo pedido explícito.

## Fluxo de dados

1. `App.svelte` chama `loadData()` no `onMount`
2. Deriva listas únicas de acervos / escolas / nacionalidades
3. Passa `bubbles` + filtros ativos para `WorldMap`
4. `WorldMap` filtra por `activeTypes` e renderiza um `<circle>` por bubble visível
5. Hover dispara evento que atualiza `Tooltip`

## Ao adicionar novo tipo de bubble (ex: `burial`)

1. Adicionar bloco `if (!isNaN(lat) && !isNaN(lon))` em `loadData()` seguindo o padrão de `birth`/`death`/`education`
2. Adicionar entrada em `TYPE_COLOR` (em `WorldMap.svelte` **e** `Tooltip.svelte`) e em `TYPE_LABEL` (`Tooltip.svelte`)
3. Adicionar entrada em `FILTERS` (`FilterControls.svelte`) com `disabled: false` se houver dados
4. Verificar cobertura dos dados antes — ver skill `/csv-data`
