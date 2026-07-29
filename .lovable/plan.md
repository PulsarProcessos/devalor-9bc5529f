## Objetivo
Remover a marcação "PROJETADO" das despesas — na metodologia atual todos os lançamentos são tratados como realizados.

## O que muda
Na aba **Acompanhamento › Despesas › Lançadas**:
- Remover o selo roxo "PROJETADO" que aparece ao lado da descrição de parcelas de meses futuros.
- Remover também o fundo roxo claro que destacava essas linhas, deixando a lista visualmente uniforme.

Nada mais muda: valores, parcelas, filtros, paginação e totais continuam iguais.

## Detalhe técnico
Em `public/tool.html`, dentro de `renderDespesasLancadas` (~linhas 3102-3107): eliminar `projBadge`, `rowStyle` e o cálculo `isFuture` usado apenas para isso.
