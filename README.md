# Atlas dos acervos digitais do Brasil

Mapa interativo de criadores vinculados à base de dados do **Meta-Acervos**, desenvolvido como parte do [Projeto Temático Acervos Digitais e Pesquisa](https://www.acervosdigitais.fau.usp.br/) da FAU-USP.

A ferramenta visualiza dados geoespaciais sobre criadores (artistas, arquitetos, designers e outros) presentes na base [Meta-Acervos — Navegador para Museus em Rede](https://www.acervosdigitais.fau.usp.br/meta-acervos-navegador-para-museus-em-rede/), plotando sobre um mapa-múndi os locais de nascimento e morte de cada pessoa, com filtros por acervo, instituição de formação e nacionalidade.

## Funcionalidades

- Mapa-múndi interativo com projeção Natural Earth (D3.js)
- Marcadores de **nascimento** (azul) e **morte** (vermelho) por criador
- Filtro por **acervo** — botões de seleção múltipla na barra lateral
- Filtro por **escola/instituição de formação** — autocomplete
- Filtro por **nacionalidade** — autocomplete
- Tooltip com informações do criador ao passar o cursor

## Dados

Os dados de entrada são fornecidos pelo arquivo `source/resultado_geolocalizado.csv`, gerado a partir da base Meta-Acervos. Cada linha representa um criador com coordenadas geográficas de nascimento e/ou morte, campos de formação (`educated at`, `onde estudou`), nacionalidade (`country of citizenship`) e acervo de origem.

O mapa base é o arquivo TopoJSON `source/countries-110m.json` (Natural Earth 110m).

## Stack

| Tecnologia | Versão |
|---|---|
| [Svelte](https://svelte.dev/) | 5 |
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

## Vinculação institucional

Este projeto integra o **Projeto Temático Acervos Digitais e Pesquisa** da Faculdade de Arquitetura e Urbanismo da Universidade de São Paulo (FAU-USP).

- Site do projeto: <https://www.acervosdigitais.fau.usp.br/>
- Base Meta-Acervos: <https://www.acervosdigitais.fau.usp.br/meta-acervos-navegador-para-museus-em-rede/>
