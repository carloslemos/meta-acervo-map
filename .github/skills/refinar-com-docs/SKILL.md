---
name: refinar-com-docs
description: 'Entrevista implacável para afiar um plano ou design, criando documentação (ADRs e glossário) ao longo do processo. Use quando o usuário quer validar uma decisão técnica, explorar tradeoffs antes de implementar, ou registrar o raciocínio por trás de uma escolha arquitetural no Meta-Acervo Map.'
disable-model-invocation: true
---

# Refinar com Docs

Execute uma sessão de refinamento guiada usando o vocabulário do `/design-de-modulos`. A cada decisão cristalizada, crie documentação persistente.

## Processo

### 1. Prepare o contexto

Leia os arquivos relevantes antes de começar:
- `src/lib/constants.js` — vocabulário de constantes e valores do projeto
- `src/lib/dataUtils.js` — pipeline de dados CSV → bubbles
- `src/lib/filterModel.js` — predicados de filtragem
- Qualquer ADR existente em `.github/adr/` (se existir)

### 2. Execute a entrevista

Faça perguntas de uma por vez. Não faça duas perguntas no mesmo turno. Explore:

**Perguntas sobre o problema:**
- Qual é o comportamento exato que você quer? Em que situação ele falha hoje?
- Quem são os chamadores deste módulo? O que eles precisam saber para usá-lo?
- Se você deletasse este módulo amanhã, onde a complexidade reapareceria?

**Perguntas sobre a costura:**
- Onde você quer colocar a costura (seam)? Quais alternativas existem?
- O que varia de um lado e do outro da costura?
- Um adaptador aqui seria hipotético ou já existe variação real?

**Perguntas sobre testabilidade:**
- Como você testaria isso? Qual seria a asserção mais direta?
- O que precisaria ser mockado? Esse mock seria realista?
- Existe prior art nos testes em `src/lib/__tests__/`?

**Perguntas sobre tradeoffs:**
- O que você está otimizando — alavancagem para novos chamadores ou localidade para mantenedores?
- Qual o custo de mudar de ideia depois? O que ficaria refatorado?

### 3. Atualize a documentação conforme as decisões cristalizam

**Nomeou um módulo aprofundado com um conceito novo?**
→ Adicione o termo ao glossário do projeto em `.github/CONTEXT.md` (crie o arquivo se não existir):

```markdown
## Glossário de Domínio

**[Termo]** — [Definição precisa no contexto do Meta-Acervo Map]
```

**Usuário rejeitou uma abordagem com uma razão estrutural?**
→ Ofereça registrar como ADR:
> "Quer que eu registre isso como uma ADR para que revisões futuras não voltem a sugerir o mesmo?"

Só ofereça quando a razão for load-bearing — não para razões efêmeras ("não vale agora").

**Formato de ADR** (salvar em `.github/adr/NNNN-titulo-curto.md`):

```markdown
# ADR-NNNN: [Título curto]

**Data:** YYYY-MM-DD
**Status:** Aceito | Rejeitado | Substituído por ADR-XXXX

## Contexto

[Situação que gerou a decisão]

## Decisão

[O que foi decidido]

## Consequências

[O que muda, o que fica mais fácil, o que fica mais difícil]
```

### 4. Produza um resumo da decisão

Ao final da sessão, sintetize:
- A decisão tomada em uma frase
- Os principais tradeoffs explorados
- A documentação criada (ADR, glossário)
- O próximo passo recomendado (`/para-spec` para especificar, `/para-tickets` para quebrar em tarefas, ou `/melhorar-arquitetura` para explorar impacto mais amplo)

## Regras da entrevista

- Uma pergunta por vez
- Não assuma — confirme
- Se a resposta abrir uma nova incerteza, explore-a antes de continuar
- Registre decisões _durante_ a conversa, não só no final
- Use o vocabulário do `/design-de-modulos` nos documentos criados
