---
name: implementar
description: 'Implementa o trabalho descrito em uma spec ou conjunto de tickets do GitHub Issues (carloslemos/meta-acervo-map). Use quando o usuário passa um número de issue, URL ou título de ticket e quer que o trabalho seja feito — lê o issue, entende o contexto do codebase, implementa fatia a fatia, roda testes e faz review antes do commit.'
disable-model-invocation: true
---

# Implementar

Implemente o trabalho descrito pelo usuário na spec ou nos tickets.

**Argumento esperado:** número de issue (`#42`), URL (`https://github.com/carloslemos/meta-acervo-map/issues/42`) ou descrição breve do que implementar.

## Processo

### 1. Leia o ticket ou spec

Se o usuário forneceu uma referência de issue:
- Use o GitHub MCP (`mcp_github_mcp_se_issue_read`) para buscar o issue completo no repositório `carloslemos/meta-acervo-map`
- Leia o corpo, comentários e issues bloqueantes (campo "Bloqueado por")
- Se for uma spec (`[spec]`), verifique se há tickets filhos já criados pelo `/para-tickets` antes de começar a implementar diretamente

Se não houver referência de issue, trabalhe com o que está na conversa atual.

**Pré-condição:** todos os tickets que bloqueiam este devem estar concluídos. Se não estiverem, sinalize quais estão pendentes e pare.

### 2. Explore o codebase

Use o subagente `Explore` para entender o estado atual do código na área relevante. Leia:
- Os módulos que serão modificados (identificados nos critérios de aceitação)
- Os testes existentes em `src/lib/__tests__/` como prior art
- As constantes relevantes em `src/lib/constants.js`
- Quaisquer ADRs em `.github/adr/` que cubram a área

**Mapeie as costuras** onde o trabalho toca — use o vocabulário do `/design-de-modulos` (costura, interface, módulo) para nomear as mudanças que serão feitas.

### 3. Planeje antes de codificar

Descreva brevemente o plano de implementação antes de começar:

- Quais arquivos serão modificados e por quê
- Qual costura (seam) será usada para os testes
- Ordem das mudanças (pré-fatorações primeiro se necessário)

Se o plano divergir significativamente da spec, sinalize e confirme com o usuário antes de continuar.

### 4. Implemente fatia a fatia

Para cada fatia do trabalho:

1. **Implemente** as mudanças nos arquivos corretos, seguindo as convenções do projeto:
   - Svelte 5 em modo legado (`export let`, `$:`, `createEventDispatcher`, `on:event`)
   - Constantes novas vão em `src/lib/constants.js` na seção apropriada
   - Novos predicados de filtro vão em `filterModel.js`
   - Novos tipos de bubble: seguir o padrão de `birth`/`death`/`education` em `dataUtils.js`
   - SCSS: usar variáveis CSS (`var(--bg)`, `var(--txt)`) em vez de hex hardcoded
   - Sem TypeScript — JavaScript puro

2. **Rode os testes** depois de cada mudança em módulos JS puros:
   ```bash
   npx jest src/lib/__tests__/<arquivo>.test.js
   ```
   Para rodar a suite completa ao final:
   ```bash
   npx jest
   ```

3. **Rode o build** para verificar que o Svelte e o Vite não têm erros:
   ```bash
   npm run build
   ```

4. Só avance para a próxima fatia quando os testes e o build estiverem verdes.

### 5. Verifique os critérios de aceitação

Após implementar, revise cada critério de aceitação do ticket:

```
- [ ] Critério 1  → implementado? como verificar?
- [ ] Critério 2  → implementado? como verificar?
```

Se algum critério não estiver coberto, implemente antes de continuar.

### 6. Revise o trabalho

Execute o `/code-review-plus` (se disponível) ou faça uma revisão manual:

- As mudanças estão consistentes com as convenções do projeto?
- Alguma constante foi hardcoded em vez de ir para `constants.js`?
- Algum componente está lendo CSV diretamente em vez de via `dataUtils.js`?
- A lógica de filtro foi colocada em `filterModel.js` ou vazou para um componente?
- O vocabulário de domínio foi mantido (bubble, trajetória, acervo, filtro)?

### 7. Faça o commit

Use o `/commit-message` (se disponível) ou siga o padrão Conventional Commits:

```
feat(filtro): adiciona filtro por escola de formação

fix(bubble): corrige offset de colisão para tipo education

refactor(constants): extrai BUBBLE_RADIUS_MOBILE para constants.js

data(csv): atualiza caminho do dataset para atlas_ma_0630_v3.csv
```

**Escopo recomendado:** `bubble`, `filtro`, `mapa`, `projecao`, `acervo`, `sidebar`, `tooltip`, `csv`, `constants`, `dados`

Faça commits atômicos — um por fatia significativa, não um commit gigante no final.

### 8. Atualize o issue no GitHub

Após o commit, atualize o issue no GitHub:
- Adicione um comentário com o resumo do que foi implementado
- Feche o issue se todos os critérios de aceitação foram satisfeitos
- Use `mcp_github_mcp_se_add_issue_comment` e `mcp_github_mcp_se_issue_write` para isso

## Regras de implementação

- **Não introduza TypeScript** — o projeto não usa TypeScript
- **Não introduza runes do Svelte** (`$state`, `$props`) — use o padrão legado
- **Não duplique constantes** — extraia para `constants.js` se o valor aparecer mais de uma vez
- **Não leia CSV em componentes** — sempre via `loadData()` em `dataUtils.js`
- **Não crie arquivos markdown de documentação** sobre as mudanças, salvo pedido explícito
- **Não quebre testes existentes** sem justificativa explícita

## Sequência com outras skills

```
/refinar-com-docs   ← afinar o plano com entrevista e ADRs
       ↓
/para-spec          ← publicar spec no GitHub
       ↓
/para-tickets       ← quebrar spec em tickets tracer-bullet
       ↓
/implementar        ← você está aqui: implementar ticket a ticket
       ↓
/melhorar-arquitetura ← (opcional) identificar fricção residual
```

Trabalhe a fronteira: implemente sempre o próximo ticket cujos bloqueadores estão todos concluídos. Limpe o contexto entre tickets.
