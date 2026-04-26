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

## Deploy

O projeto é publicado em GitHub Pages sob o caminho `/atlas-acervos-digitais/` (configurado em `vite.config.js` via `base`). Para hospedar em outro caminho, ajuste essa propriedade antes do build.

## Vinculação institucional

Este projeto integra o **Projeto Temático Acervos Digitais e Pesquisa** da Faculdade de Arquitetura e Urbanismo da Universidade de São Paulo (FAU-USP).

- Site do projeto: <https://www.acervosdigitais.fau.usp.br/>
- Base Meta-Acervos: <https://www.acervosdigitais.fau.usp.br/meta-acervos-navegador-para-museus-em-rede/>
