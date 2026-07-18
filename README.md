# Atlas dos acervos digitais do Brasil

Mapa interativo de criadores vinculados à base de dados do **Meta-Acervos**, desenvolvido como parte do [Projeto Temático Acervos Digitais e Pesquisa](https://www.acervosdigitais.fau.usp.br/) da FAU-USP.

A ferramenta visualiza dados geoespaciais sobre criadores (artistas, arquitetos, designers e outros) presentes na base [Meta-Acervos — Navegador para Museus em Rede](https://www.acervosdigitais.fau.usp.br/meta-acervos-navegador-para-museus-em-rede/), plotando sobre um mapa-múndi os locais de nascimento, estudo e morte de cada pessoa, com filtros por acervo, instituição de formação e nacionalidade.

## Funcionalidades

- Mapa-múndi interativo com duas projeções alternáveis: **2D** (Equal Earth) e **Globo** (Orthographic), com zoom, pan e rotação
- Marcadores por criador para **nascimento** (azul), **estudo** (verde) e **morte** (vermelho)
- **Trajetórias** ligando os pontos de cada criador (nascimento → estudo → morte) com pulso animado indicando a direção do percurso
- Filtro por **tipo** (nascimento / estudo / morte) no cabeçalho
- Filtro por **acervo** — botões de seleção múltipla na barra lateral; um criador com obras em mais de um acervo aparece quando qualquer um deles está ativo
- Filtro por **escola/instituição de formação** — autocomplete
- Filtro por **nacionalidade** — autocomplete
- Tooltip com informações do criador ao passar o cursor (desktop) ou tocar (mobile), incluindo um **badge de confiança do dado** quando disponível

## Dados

Os dados de entrada são fornecidos pelo arquivo `source/atlas_ma_0426_v1.csv`, gerado a partir da base Meta-Acervos. Cada linha representa um criador com coordenadas geográficas de nascimento, estudo e/ou morte, campos de formação (`educated at`, `onde estudou`), nacionalidade (`country of citizenship`) e um ou mais acervos de origem (separados por `;`).

O mapa base é o arquivo TopoJSON `source/countries-110m.json` (Natural Earth 110m).

## Stack

| Tecnologia | Versão |
|---|---|
| [Svelte](https://svelte.dev/) | 5 (modo legado) |
| [Vite](https://vitejs.dev/) | 6 |
| [D3.js](https://d3js.org/) | 7 |
| [topojson-client](https://github.com/topojson/topojson-client) | 3 |
| Sass | 1 |

## Desenvolvimento

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview   # pré-visualização do build de produção
```

## Testes e Performance

### Executar testes

```bash
# Todos os testes
npm test

# Apenas testes de filtro e dados
npm run test:unit

# Apenas testes de layout e acessibilidade
npm run test:layout

# Apenas testes de performance
npm test -- src/lib/__tests__/performance.test.js
```

### Performance

O projeto é otimizado para **60 FPS** e segue padrões rigorosos de evitar **forced reflows** (alternância leitura/escrita no DOM que força recálculo de layout).

#### Padrões de performance implementados

- **`updateCanvasOffset()`** — Chamado apenas em contextos layout-safe:
  - `onMount` (pós-layout)
  - ResizeObserver callback (pós-layout)
  - **Nunca** em hot path (mousemove, click, wheel)
  
- **`applyCanvasDims()`** — Batch de escritas sem leitura intermediária:
  - Escreve `canvasEl.width`, `canvasEl.height`, `bgCanvasEl.width`, `bgCanvasEl.height`
  - Sem `getBoundingClientRect()` entre elas

- **Hot path (mouse handlers)** — Usa cache:
  - `canvasLeft`, `canvasTop` são lidos uma vez e cacheados
  - Mouse move handlers usam cache em vez de chamar `getBoundingClientRect()`

- **Constantes centralizadas** — `src/lib/constants.js`:
  - Cores, durações de animação, dimensões de bubbles
  - Uma mudança global sem varrer múltiplos arquivos

#### Medir performance com Chrome DevTools

1. Abra DevTools (`F12`)
2. **Performance** tab → clique em **Record** (círculo vermelho)
3. Interaja com o mapa:
   - Hover sobre bubbles
   - Zoom, pan, rotação
   - Toggle entre 2D/3D
   - Ative/desative filtros
4. Clique em **Stop** e analise:
   - 🔴 **Red triangles** = forced reflows (indesejável)
   - **Frame rate** debe ser **≥ 60 fps**
   - Procure por `getBoundingClientRect()` fora de pós-layout

Para diagnosticar repaints em tempo real:
- **DevTools** → **More tools** → **Rendering**
- ☑ **Paint flashing** (pisca em verde cada repaint)
- ☑ **Rendering stats** (mostra FPS em tempo real)

#### Utilitários de teste

Em `src/lib/performanceUtils.js`, funções para detectar regressões:

```javascript
import { detectForcedReflow, comparePerformance } from '../lib/performanceUtils.js';

// Comparar baseline vs refatoração
const result = comparePerformance(
  () => oldFunction(),
  () => newFunction(),
  'Function refactor'
);

if (result.regressionDetected) {
  console.warn('⚠️ Regressão detectada:', result.improvement);
}
```

Disponível também em testes (`src/lib/__tests__/performance.test.js`):
- `detectForcedReflow(fn, label)` — Detecta reflows ao executar função
- `analyzeLayoutThrashing(fn)` — Detecta ciclos write-then-read
- `comparePerformance(beforeFn, afterFn, label)` — Compara baseline vs refatoração

## Deploy


O projeto é publicado em GitHub Pages sob o caminho `/atlas-acervos-digitais/` (configurado em `vite.config.js` via `base`). Para hospedar em outro caminho, ajuste essa propriedade antes do build.

## Vinculação institucional

Este projeto integra o **Projeto Temático Acervos Digitais e Pesquisa** da Faculdade de Arquitetura e Urbanismo da Universidade de São Paulo (FAU-USP).

- Site do projeto: <https://www.acervosdigitais.fau.usp.br/>
- Base Meta-Acervos: <https://www.acervosdigitais.fau.usp.br/meta-acervos-navegador-para-museus-em-rede/>
