## Contexto verificado

- O painel de Planejamento (`panel-extraordinario`, título "Planejamento") hoje só tem **uma coluna de valor planejado** por categoria (`renderPlanejamentoMes`), agrupada por grupo de categorias, mais a barra "Consolidado do mês" e o bloco "Renda do mês".
- As despesas lançadas (manuais + importadas) já ficam em `despesas` com `categoria`, `grupo`, `mes_pagamento` — é a base natural do **realizado** das despesas.
- A renda (`_rendaFontes`) hoje guarda apenas um valor por fonte (planejado), sem campo de recebido.
- O menu tem "Painel Resumo" (`panel-painel`), hoje só uma tabela anual + 4 cards. Não há nenhum gráfico no sistema.

## O que será feito

### 1. Aba "Planejamento Mensal" (módulo Acompanhamento)
- Renomear no menu lateral e no título da seção: **Planejamento Mensal**.
- Estrutura em duas colunas de valores, no formato da planilha:

```text
RECEITA
Agrupamento | Categorias      | Planejado | Realizado
RECEITA     | Salário         | 20.000,00 | 20.000,00
            | RECEITA TOTAL   | 31.558,28 | 32.158,28

DESPESAS
Agrupamento          | Categorias | Planejado | Realizado | % Real
Obrigatórias Fixa    | Aluguel    |  2.550,84 |         – |   0%
Não Obrig. Variáveis | Mercado    |  1.000,00 |    214,14 |  21%
```

- **Receitas**: cada fonte de renda passa a ter Planejado e Realizado (recebido), com linha de RECEITA TOTAL.
- **Despesas**: para cada categoria, ao lado do campo Planejado (editável), uma coluna **Realizado** (somente leitura), calculada a partir das despesas lançadas no mês/ano selecionado, mais uma coluna **% Real** (realizado ÷ planejado) com cor: verde dentro do planejado, âmbar perto do limite, vermelho quando estoura.
- Cada grupo mostra subtotal Planejado/Realizado; a barra Consolidado do mês passa a mostrar as duas colunas (Receitas, Despesas, Investimentos e Saldo — planejado e realizado).

### 2. Resumo no padrão da segunda imagem
Abaixo do planejamento, um bloco **Resumo** com:
- Tabela Planejado × Realizado por linha: Receita, Obrigatórias, Não Obrigatórias, Investimentos e **SALDO** (destacado).
- Tabela **Cartão de Crédito**: por cartão/banco, valores em "Crédito à vista" e "Parcelado", com linha TOTAL e a linha de **Representatividade** (% de cada coluna), usando a forma de pagamento e as parcelas já registradas nas despesas.

### 3. Painel (ex-"Painel Resumo")
- Renomear menu e título para **Painel**.
- **Gráfico de evolução** dos 12 meses do ano, com barras lado a lado de **Realizado** e **Projetado (planejado)**, com legenda, tooltip por mês e responsivo. Desenhado em SVG puro (sem nova dependência), no padrão visual do sistema.
- **Cards do ano** acima do gráfico: Receita do ano (plan. × real.), Despesa do ano (plan. × real.), Saldo do ano, Aderência ao planejado (%), Investimentos do ano e melhor/pior mês.
- A tabela anual atual permanece abaixo do gráfico.

## Detalhes técnicos
Tudo em `public/tool.html`: novo layout/render em `renderPlanejamentoMes` (linhas com planejado + realizado), agregador de realizado a partir das despesas lançadas por mês, campo `recebido` por fonte de renda persistido junto de `apiSaveRenda`, novo bloco de resumo e resumo de cartões, renomeações no menu (`nav-item` extraordinario/painel), e um renderizador de gráfico SVG em `loadPainelAnual` + cards anuais. Sem alteração de banco de dados (o `recebido` é gravado no JSON de `fontes` já existente).

## Ponto a confirmar
O **Realizado das receitas** será digitado manualmente por fonte (o sistema não tem lançamentos de entrada — a importação de extrato ignora entradas por regra). Se preferir, posso depois habilitar a importação de entradas para preencher isso automaticamente.
