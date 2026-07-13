---
name: para-tickets
description: 'Quebra um plano, spec ou conversa em um conjunto de tickets tracer-bullet para o GitHub Issues do Meta-Acervo Map (carloslemos/meta-acervo-map), cada um declarando suas dependências de bloqueio. Use quando o usuário quer transformar uma ideia ou spec em tarefas acionáveis, publicar issues no GitHub, ou planejar o trabalho de implementação em fatias verticais.'
disable-model-invocation: true
---

# Para Tickets

Quebre um plano, spec ou conversa em um conjunto de **tickets tracer-bullet** — fatias verticais, cada uma declarando os tickets que a **bloqueiam**.

## Processo

### 1. Reúna o contexto

Trabalhe a partir do que já está no contexto da conversa. Se o usuário passou uma referência (caminho de spec, número ou URL de issue) como argumento, busque e leia seu conteúdo completo e comentários.

### 2. Explore o codebase (opcional)

Se você ainda não explorou o codebase, faça isso para entender o estado atual do código. Títulos e descrições de tickets devem usar o vocabulário de domínio do projeto e respeitar ADRs em `.github/adr/` na área que você está tocando.

Procure oportunidades de pré-fatoração para facilitar a implementação. "Facilite a mudança, depois faça a mudança fácil."

**Módulos frequentemente envolvidos em novas funcionalidades:**
- `src/lib/dataUtils.js` — para novas colunas CSV ou tipos de bubble
- `src/lib/filterModel.js` — para novos predicados de filtro
- `src/lib/constants.js` — para novas constantes, cores ou labels
- `src/App.svelte` — para novo estado global ou fluxo de dados
- `src/components/` — para novos componentes de UI

### 3. Elabore fatias verticais

Quebre o trabalho em tickets **tracer-bullet**.

**Regras de fatia vertical:**
- Cada fatia corta um caminho estreito mas COMPLETO por todas as camadas (dados, lógica, UI) — vertical, NÃO uma fatia horizontal de uma camada
- Uma fatia completada é demonstrável ou verificável por si só
- Cada fatia é dimensionada para caber em uma única janela de contexto fresco
- Qualquer pré-fatoração deve ser feita primeiro

Dê a cada ticket suas **dependências de bloqueio** — os outros tickets que devem ser concluídos antes que ele possa começar. Um ticket sem bloqueadores pode começar imediatamente.

**Refatorações amplas são a exceção à fatia vertical.** Uma refatoração ampla é uma mudança mecânica única — renomear uma constante, retipar um símbolo compartilhado — cujo **raio de explosão** se espalha por todo o codebase. Nesse caso, use **expandir–contrair**:
1. Expandir: adicionar a nova forma ao lado da antiga
2. Migrar: mover os sites de chamada em lotes
3. Contrair: deletar a forma antiga

### 4. Consulte o usuário

Apresente a divisão proposta como uma lista numerada. Para cada ticket, mostre:

- **Título**: nome descritivo curto
- **Bloqueado por**: quais outros tickets (se houver) devem ser concluídos primeiro
- **O que entrega**: o comportamento de ponta a ponta que este ticket faz funcionar

Pergunte ao usuário:
- A granularidade está certa? (muito grossa / muito fina)
- As dependências de bloqueio estão corretas — cada ticket só depende de tickets que genuinamente o bloqueiam?
- Algum ticket deve ser mesclado ou dividido?

Itere até o usuário aprovar a divisão.

### 5. Publique os tickets no GitHub Issues

Publique os tickets aprovados. Use a ferramenta GitHub MCP (`mcp_github_mcp_se_issue_write`) para criar um issue por ticket no repositório `carloslemos/meta-acervo-map`, em ordem de dependência (bloqueadores primeiro), para que as dependências possam referenciar identificadores reais.

Use o relacionamento nativo de bloqueio/sub-issue do GitHub onde disponível; caso contrário, defina o campo "Bloqueado por" de cada ticket para os issues bloqueantes. Aplique o label `ready-for-agent` a menos que instruído de outra forma — os tickets são capturáveis por agente por construção.

**Não feche nem modifique nenhum issue pai.**

## Template de issue

```markdown
## Pai

Referência ao issue pai no rastreador (se a fonte foi um issue existente, omita esta seção).

## O que construir

O comportamento de ponta a ponta que este ticket faz funcionar, da perspectiva do usuário — não uma lista de implementação camada por camada.

## Critérios de aceitação

- [ ] Critério 1
- [ ] Critério 2

## Bloqueado por

- Referência a cada ticket bloqueante, ou "Nenhum — pode começar imediatamente".
```

Evite caminhos de arquivo específicos ou trechos de código nos tickets — eles ficam desatualizados rapidamente.

_Exceção_: se um protótipo produziu um trecho que codifica uma decisão com mais precisão do que a prosa pode (formato de bubble, predicado de filtro, shape de constante), inclua-o inline e note brevemente que veio de um protótipo.

## Configuração do rastreador

- **Repositório GitHub:** `carloslemos/meta-acervo-map`
- **Labels disponíveis:** `ready-for-agent`, `enhancement`, `bug`, `data`, `design`, `spec`
- **Formato do título do ticket:** `[feat]` / `[fix]` / `[refactor]` / `[data]` + título descritivo curto

## Trabalhar a fronteira

Trabalhe a fronteira um ticket por vez com `/melhorar-arquitetura` ou implementação direta, limpando o contexto entre os tickets.
