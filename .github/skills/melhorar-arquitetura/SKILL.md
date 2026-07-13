---
name: melhorar-arquitetura
description: 'Varre o Meta-Acervo Map em busca de oportunidades de aprofundamento arquitetural e apresenta os candidatos como relatório HTML visual, depois refina o escolhido. Use quando o usuário quer identificar fricção arquitetural, melhorar testabilidade, ou tornar o código mais navegável por IA.'
disable-model-invocation: true
---

# Melhorar Arquitetura

Identifique fricção arquitetural e proponha **oportunidades de aprofundamento** — refatorações que transformam módulos rasos em profundos. O objetivo é testabilidade e navegabilidade por IA.

Esta skill usa o vocabulário do `/design-de-modulos` (módulo, interface, profundidade, costura, adaptador, alavancagem, localidade). Use esses termos exatamente em todas as sugestões.

## Processo

### 1. Explorar

Leia o glossário do projeto em `.github/CONTEXT.md` (se existir) e quaisquer ADRs em `.github/adr/` antes de explorar.

Use o subagente `Explore` para percorrer o código. Não siga heurísticas rígidas — explore organicamente e anote onde você sente fricção:

- Onde entender um conceito exige saltar entre muitos arquivos pequenos?
- Onde módulos são **rasos** — interface quase tão complexa quanto a implementação?
- Onde funções puras foram extraídas só para testabilidade, mas os bugs reais se escondem em como elas são chamadas (sem **localidade**)?
- Onde módulos fortemente acoplados vazam através das suas costuras?
- Quais partes são difíceis de testar pela interface atual?

**Módulos a examinar no Meta-Acervo Map:**
- `src/App.svelte` — estado global, tende a acumular lógica
- `src/components/WorldMap.svelte` — renderização complexa D3/Canvas
- `src/lib/dataUtils.js` — parsing CSV, transformações de dados
- `src/lib/filterModel.js` — predicados de filtragem
- `src/lib/constants.js` — constantes compartilhadas
- Componentes em `src/components/` — acoplamento com estado global

Aplique o **teste de deleção** a qualquer coisa que você suspeite ser rasa: deletar concentraria a complexidade, ou apenas a moveria? "Sim, concentra" é o sinal que você quer.

### 2. Apresentar candidatos como relatório HTML

Escreva um arquivo HTML autocontido no diretório temporário do sistema. Resolva o temp dir de `$TMPDIR`, recaindo para `/tmp`, e escreva em `<tmpdir>/arquitetura-meta-acervo-<timestamp>.html`. Abra para o usuário com `open <path>` (macOS) e informe o caminho absoluto.

O relatório usa **Tailwind via CDN** para layout e **Mermaid via CDN** para diagramas. Para cada candidato, renderize um card com:

- **Arquivos** — quais arquivos/módulos estão envolvidos
- **Problema** — por que a arquitetura atual causa fricção
- **Solução** — descrição em linguagem simples do que mudaria
- **Benefícios** — explicados em termos de localidade e alavancagem, e como os testes melhorariam
- **Diagrama Antes/Depois** — lado a lado, ilustrando a rasidão e o aprofundamento
- **Força da recomendação** — `Forte`, `Vale explorar` ou `Especulativo`, renderizado como badge

Finalize o relatório com uma seção **Recomendação principal**: qual candidato atacar primeiro e por quê.

Use o vocabulário de domínio do projeto (ex: "bubble", "trajetória", "acervo", "filtro") para os módulos. **Não invente interfaces ainda.**

Após salvar o arquivo, pergunte ao usuário: "Qual desses você quer explorar?"

### 3. Loop de refinamento

Após o usuário escolher um candidato, execute o `/refinar-com-docs` para percorrer a árvore de decisões — restrições, dependências, o formato do módulo aprofundado, o que fica por trás da costura, quais testes sobrevivem.

Efeitos colaterais acontecem inline conforme as decisões se cristalizam:

- **Nomeou um módulo aprofundado com conceito não no glossário?** Adicione o termo a `.github/CONTEXT.md`.
- **Usuário rejeitou o candidato com razão estrutural?** Ofereça um ADR.
- **Quer explorar interfaces alternativas para o módulo aprofundado?** Execute o `/design-de-modulos` e use o padrão de sub-agentes paralelos para projetar duas versões.

### 4. Publicar no GitHub Issues (opcional)

Se o usuário aprovar um candidato para trabalhar, use o `/para-spec` para especificar e o `/para-tickets` para quebrar em issues no repositório `carloslemos/meta-acervo-map`.

## Contexto do projeto

- Stack: **Svelte 5 (modo legado)**, Vite 6, D3.js 7, Sass — sem TypeScript
- Testes: Jest em `src/lib/__tests__/` — apenas módulos JS puros, sem testes de componentes
- Idioma: PT-BR em comentários, UI e documentação
