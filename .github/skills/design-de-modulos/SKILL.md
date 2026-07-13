---
name: design-de-modulos
description: 'Vocabulário compartilhado para projetar módulos profundos no Meta-Acervo Map. Use quando o usuário quer projetar ou melhorar a interface de um módulo (dataUtils, filterModel, WorldMap, constants), encontrar oportunidades de aprofundamento, decidir onde vai uma costura (seam), tornar o código mais testável, ou quando outra skill precisa do vocabulário de módulo profundo.'
---

# Design de Módulos

Projete **módulos profundos**: muito comportamento por trás de uma interface pequena, posicionada numa costura limpa, testável por essa interface. Use esta linguagem e estes princípios sempre que código estiver sendo projetado ou reestruturado. O objetivo é **alavancagem** para quem chama, **localidade** para quem mantém, e **testabilidade** para todos.

## Glossário

Use estes termos exatamente — não substitua por "component", "service", "API" ou "boundary". Linguagem consistente é o ponto central.

**Módulo** — qualquer coisa com uma interface e uma implementação. Deliberadamente agnóstico em escala: uma função, classe, arquivo `.js`, componente `.svelte` ou fatia que atravessa camadas. _Evite_: unit, componente, service.

**Interface** — tudo que um chamador precisa saber para usar o módulo corretamente: a assinatura, mas também invariantes, restrições de ordem, modos de erro, configuração necessária e características de performance. _Evite_: API, assinatura (muito restrito — refere-se só à superfície de tipos).

**Implementação** — o que está dentro do módulo. Distinto de **Adaptador**: algo pode ser um adaptador pequeno com implementação grande (um carregador CSV) ou um adaptador grande com implementação pequena (um mock em memória).

**Profundidade** — alavancagem na interface: a quantidade de comportamento que um chamador (ou teste) pode exercer por unidade de interface que precisa aprender. Um módulo é **profundo** quando muito comportamento fica por trás de uma interface pequena; **raso** quando a interface é quase tão complexa quanto a implementação.

**Costura** _(Michael Feathers)_ — um lugar onde você pode alterar o comportamento sem editar naquele lugar; a _localização_ onde a interface de um módulo vive. _Evite_: boundary.

**Adaptador** — uma coisa concreta que satisfaz uma interface numa costura. Descreve _papel_ (que slot preenche), não substância (o que está dentro).

**Alavancagem** — o que os chamadores ganham com a profundidade: mais capacidade por unidade de interface aprendida.

**Localidade** — o que os mantenedores ganham com a profundidade: mudanças, bugs, conhecimento e verificação se concentram num único lugar.

## Módulos-chave do Meta-Acervo Map

| Módulo | Interface principal | Profundidade atual |
|---|---|---|
| `dataUtils.js` | `loadData()` → `{ bubbles, trajectories }` | Alta — esconde todo o parsing CSV |
| `filterModel.js` | `applyFilters(bubbles, params)` | Alta — predicados puros, testáveis em isolamento |
| `constants.js` | Named exports imutáveis | Alta — única fonte de verdade para valores globais |
| `WorldMap.svelte` | Props + eventos D3/Canvas | Média — renderização complexa exposta via props |
| `App.svelte` | Estado global + reatividade | Baixa — orquestra tudo, tende a crescer |

## Profundo vs Raso

**Módulo profundo** = interface pequena + muita implementação:
```
┌─────────────────────┐
│  Interface Pequena  │  ← Poucos métodos, params simples
├─────────────────────┤
│                     │
│  Implementação      │  ← Lógica complexa escondida
│  Profunda           │
└─────────────────────┘
```

**Módulo raso** = interface grande + pouca implementação (evitar):
```
┌─────────────────────────────────┐
│       Interface Grande          │  ← Muitos params, lógica exposta
├─────────────────────────────────┤
│  Implementação Fina             │  ← Apenas repassa
└─────────────────────────────────┘
```

## Princípios

- **Profundidade é propriedade da interface, não da implementação.** Um módulo profundo pode ser internamente composto de partes pequenas — elas simplesmente não fazem parte da interface.
- **O teste de deleção.** Imagine deletar o módulo. Se a complexidade some, era um repasse. Se a complexidade reaparece em N chamadores, o módulo estava se pagando.
- **A interface é a superfície de teste.** Chamadores e testes cruzam a mesma costura. Se você quer testar _além_ da interface, o módulo provavelmente tem formato errado.
- **Um adaptador significa costura hipotética. Dois adaptadores significa costura real.** Não introduza uma costura a menos que algo varie efetivamente através dela.

## Projetando para testabilidade

No contexto do projeto (Jest + módulos JS puros):

1. **Aceite dependências, não as crie.**
   ```js
   // Testável — filterModel.js
   export function applyFilters(bubbles, params) { ... }

   // Difícil de testar — acoplado a estado global
   function applyFilters() { return globalBubbles.filter(...) }
   ```

2. **Retorne resultados, não produza efeitos colaterais.**
   ```js
   // Testável
   export function applyFilters(bubbles, params) { return bubbles.filter(...) }

   // Difícil de testar
   export function filterInPlace(bubblesRef, params) { bubblesRef.length = 0; ... }
   ```

3. **Superfície pequena.** Menos métodos = menos testes necessários. Menos params = setup mais simples.

## Relações

- Um **Módulo** tem exatamente uma **Interface** (a superfície que apresenta a chamadores e testes).
- **Profundidade** é propriedade de um **Módulo**, medida contra sua **Interface**.
- Uma **Costura** é onde a **Interface** de um **Módulo** vive.
- Um **Adaptador** fica numa **Costura** e satisfaz a **Interface**.
- **Profundidade** produz **Alavancagem** para chamadores e **Localidade** para mantenedores.
