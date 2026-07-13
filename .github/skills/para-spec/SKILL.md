---
name: para-spec
description: 'Transforma a conversa atual em uma spec (PRD) e publica como issue no GitHub do Meta-Acervo Map (carloslemos/meta-acervo-map). Use quando o usuário quer formalizar uma funcionalidade discutida, registrar uma decisão técnica como especificação, ou criar a base para quebrar trabalho em tickets.'
disable-model-invocation: true
---

# Para Spec

Esta skill pega o contexto da conversa atual e o entendimento do codebase e produz uma spec. **Não entreviste o usuário** — apenas sintetize o que você já sabe.

## Processo

1. **Explore o repositório** para entender o estado atual do código, se ainda não fez isso. Use o vocabulário de domínio do projeto ao longo da spec, e respeite quaisquer ADRs em `.github/adr/` na área que você está tocando.

2. **Esboce as costuras** onde você vai testar a funcionalidade. Prefira costuras existentes a novas. Use a costura mais alta possível. Se novas costuras forem necessárias, proponha-as no ponto mais alto que puder. Quanto menos costuras no codebase, melhor — o ideal é uma.

   Verifique com o usuário se essas costuras correspondem às expectativas dele.

3. **Escreva a spec** usando o template abaixo e publique como issue no GitHub. Use a ferramenta GitHub MCP (`mcp_github_mcp_se_issue_write`) para criar o issue no repositório `carloslemos/meta-acervo-map`. Aplique o label `spec` (e `ready-for-agent` se disponível) — não é necessário triagem adicional.

## Template da Spec

```markdown
## Problema

O problema que o usuário enfrenta, da perspectiva do usuário.

## Solução

A solução para o problema, da perspectiva do usuário.

## Histórias de Usuário

Uma lista LONGA e numerada de histórias de usuário. Cada história no formato:

1. Como [ator], quero [funcionalidade], para que [benefício]

Esta lista deve ser extremamente abrangente e cobrir todos os aspectos da funcionalidade.

## Decisões de Implementação

Uma lista de decisões de implementação que foram tomadas. Pode incluir:

- Os módulos que serão construídos/modificados
- As interfaces desses módulos que serão modificadas
- Esclarecimentos técnicos do desenvolvedor
- Decisões arquiteturais
- Mudanças no modelo de dados (bubble, trajetória)
- Contratos de eventos Svelte (dispatch/on:event)
- Interações específicas com D3/Canvas

**Não inclua** caminhos de arquivo específicos ou trechos de código. Eles ficam desatualizados rapidamente.

_Exceção_: se um protótipo produziu um trecho que codifica uma decisão com mais precisão do que a prosa pode (formato de bubble, predicado de filtro, shape de constante), inclua-o inline e note brevemente que veio de um protótipo.

## Decisões de Teste

Uma lista de decisões de teste que foram tomadas. Inclua:

- Uma descrição do que torna um bom teste (só testar comportamento externo, não detalhes de implementação)
- Quais módulos serão testados (preferência: `filterModel.js`, `dataUtils.js` — funções puras)
- Prior art para os testes (ex: testes similares em `src/lib/__tests__/`)

## Fora do Escopo

Uma descrição das coisas que estão fora do escopo desta spec.

## Notas Adicionais

Quaisquer notas adicionais sobre a funcionalidade.
```

## Configuração do rastreador

- **Repositório GitHub:** `carloslemos/meta-acervo-map`
- **Labels disponíveis:** `spec`, `enhancement`, `bug`, `data`, `design`, `ready-for-agent`
- **Formato do título do issue:** `[spec] <título curto descritivo>`

## Notas importantes

- Não feche nem modifique issues pai existentes
- Preserve o vocabulário de domínio: "bubble", "trajetória", "acervo", "criador", "filtro", "projeção"
- Refira-se ao `/para-tickets` para quebrar a spec em issues de implementação individuais
