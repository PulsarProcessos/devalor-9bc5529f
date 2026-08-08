# Reorganização do menu: fim da aba Cadastros

## Como o menu fica

```text
👤 Perfil & Reserva        (aba própria — etapa 1)
🌟 Vida Rica               (aba própria — etapa 2, cadastro de sonhos no card)
📆 Vencimentos de Contas   (aba própria — etapa 3)
📈 Acompanhamento
     Plano de Ação
     Inventário de Dívidas
     Quitação de Dívidas
     Despesas
     Planejamento Mensal
     Categorias
     Painel
🧮 Simuladores
     Aposentadoria
     Investimentos
```

O grupo "Cadastros" deixa de existir. Perfil, Vida Rica e Vencimentos passam a ser abas
diretas no topo do menu, sem precisar abrir um grupo.

## Telas e fluxo progressivo

Cada uma das três abas iniciais recebe sua própria tela, com visual distinto e um
indicador de etapas no topo (1 Perfil · 2 Vida Rica · 3 Vencimentos), mostrando o que já
foi preenchido:

1. **Perfil & Reserva** — formulário atual + cálculo da reserva. Botão "Salvar & avançar"
   leva para Vida Rica.
2. **Vida Rica** — vira a tela de cadastro dos sonhos: um card em branco no grid abre o
   formulário (Quem, Objetivo, Motivo, Valor, Prazo com o tipo calculado automaticamente),
   e os sonhos já cadastrados continuam editáveis nos cards. Botão "Salvar & avançar"
   leva para Vencimentos.
3. **Vencimentos de Contas** — tela atual, com botão de conclusão que encerra o
   preenchimento inicial e leva ao Acompanhamento.

As etapas concluídas ficam marcadas (✓) no indicador e no menu, como já acontece hoje.
Todas as abas continuam acessíveis a qualquer momento; o indicador só mostra o progresso.

## O que sai

- A aba "Sonhos & Objetivos" é removida do menu; o painel dedicado deixa de existir e o
  formulário passa a viver dentro da Vida Rica.
- "Vida Rica" sai do bloco Acompanhamento (passa a ser aba principal).
- "Inventário de Dívidas" e "Categorias" passam para o bloco Acompanhamento.

## Detalhes técnicos

- `public/tool.html`: reescrita do bloco da sidebar (linhas ~541-584) — remoção do
  `nav-group` "cadastros", criação de itens `nav-item` soltos no topo para `perfil`,
  `vidarica` e `vencimentos`, e movimentação de `dividas` e do botão de Categorias para
  o grupo `acompanhamento`.
- Painel `#panel-sonhos` removido; seu formulário migra para dentro de `#panel-vidarica`
  (card "novo sonho" que abre o mesmo formulário usado no `editSonhoModal`), reaproveitando
  `addSonhoPreview`, `submitSonhos`, `updateTipoPrazoBadge` e `loadSonhosFromSheets`.
- Encadeamento de etapas: `submitPerfil` → `goPanel('vidarica')`, salvar sonho →
  `goPanel('vencimentos')`, concluir vencimentos → `goPanel('painel')`. Chamadas antigas a
  `goPanel('sonhos')` (inclusive no wrapper `__goPanelWrapped` e em `submitDividas`) são
  redirecionadas para `vidarica`.
- Novo componente de "stepper" no topo dos três painéis, alimentado pelo estado já usado
  por `markNavDone`.
- Sem alteração de banco de dados: as tabelas `perfil_cliente`, `sonhos` e `vencimentos`
  continuam iguais.
