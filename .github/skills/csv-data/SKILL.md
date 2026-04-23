---
name: csv-data
description: 'Trabalha com o dataset CSV do Meta-Acervo (`source/resultado_geolocalizado.csv`). USE PARA: medir cobertura de coordenadas (lat/lon) em colunas existentes, validar dados geolocalizados, decidir se uma nova coordenada (ex: lat_burial) vale ser integrada na app, adicionar nova coluna geocodificada como bubble no mapa, listar criadores com escola sem coordenada de estudo, ou auditar consistência de campos. INVOCA: script de cobertura parametrizado em ./assets/check_coverage.js (Node.js). NÃO USE PARA: alterações visuais no mapa, estilos SCSS, ou criar novos componentes UI sem dados novos.'
---

# CSV Data Workflow

Procedimentos para inspecionar, validar e integrar dados do CSV principal do projeto.

## Quando usar

- "Verifique a cobertura da coluna X"
- "Adicione marcadores de Y no mapa" (onde Y depende de coordenadas no CSV)
- "Quantos criadores têm sepultura geocodificada?"
- "Liste os criadores com escola informada mas sem coordenada"
- Antes de prometer uma nova feature baseada em dados — sempre medir cobertura primeiro

## Arquivo de dados

`source/resultado_geolocalizado.csv` — dataset principal. Trios de coordenadas atuais:

| Prefixo | Colunas |
|---|---|
| nascimento | `lat_birth`, `lon_birth`, `score_birth` |
| morte | `lat_death`, `lon_death`, `score_death` |
| estudo | `lat_estudou`, `lon_estudou`, `score_estudou` |

Colunas de contexto úteis: `creator`, `educated at`, `onde estudou`, `nome da escola`, `place of birth`, `place of death`, `country of citizenship`, `acervo`, `museum_json`.

## Procedimento

### 1. Medir cobertura

```bash
node .github/skills/csv-data/assets/check_coverage.js --lat lat_estudou --lon lon_estudou --context "educated at" "onde estudou"
```

Argumentos:
- `--lat` (obrigatório) — nome da coluna de latitude
- `--lon` (obrigatório) — nome da coluna de longitude
- `--context` (opcional, múltiplos) — colunas que indicam que o campo "deveria" ter coordenada (lista os gaps)
- `--csv` (opcional) — caminho alternativo ao CSV (padrão: `source/resultado_geolocalizado.csv`)

Saída: total de linhas, % com coordenada, gaps (contexto preenchido mas sem coord), órfãos (coord sem contexto).

### 2. Decidir integração

Threshold sugerido: **≥ 30% de cobertura** para valer a pena integrar como bubble visível. Abaixo disso, considerar enriquecer dados antes (geocodificação manual, Wikidata, etc.).

### 3. Integrar no `dataUtils.js`

Replicar o padrão dos blocos existentes em [src/lib/dataUtils.js](../../../src/lib/dataUtils.js):

```js
const latNovo = parseFloat(row['lat_NOVO']);
const lonNovo = parseFloat(row['lon_NOVO']);
if (!isNaN(latNovo) && !isNaN(lonNovo)) {
  bubbles.push({
    id: `TIPO-${i}`,
    creator,
    lat: latNovo,
    lon: lonNovo,
    type: 'TIPO',
    place: row['NOME_DA_COLUNA_DE_LUGAR']?.trim() ?? '',
    acervo: museum_json || acervo,
    educatedAt,
    nationality,
    score: parseFloat(row['score_NOVO']) || 0,
  });
}
```

### 4. Propagar nos componentes consumidores

Ver checklist em [.github/copilot-instructions.md](../../copilot-instructions.md) → "Ao adicionar novo tipo de bubble".

### 5. Validar manualmente

- Rodar `npm run dev`
- Confirmar marcadores aparecem para criadores com coordenada
- Confirmar filtro liga/desliga
- Confirmar tooltip mostra o lugar correto

## Notas

- O CSV tem **BOM UTF-8** — o asset já trata. Se você criar outro parser, lembre de remover o BOM (`raw.replace(/^\uFEFF/, '')`).
- Campos com pipe (`|`) são listas: `educated at`, `onde estudou`. Usar `splitPipe()` (ver `dataUtils.js`).
- O CSV usa vírgula como separador e aspas duplas para escapar. Campos podem conter aspas duplicadas (`""`) dentro de aspas.
