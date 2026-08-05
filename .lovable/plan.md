# Correção do somatório do Planejamento Mensal + revisão da ferramenta

## O que eu confirmei olhando o banco e o código

Consultei os lançamentos reais e encontrei a origem do somatório errado:

- Em Julho/2026 a categoria "Moradia" soma **R$ 155.413,48**, em Fevereiro **R$ 77.564,13**. Olhando linha a linha, são entradas do extrato importadas como despesa: "RECEBIMENTO PIX ... PIX_CRED" (R$ 60.063,92), "Transferência Recebida - ...", "LIQ.COBRANCA SIMPLES". Ou seja, dinheiro que entrou está sendo somado como gasto.
- Causa: na importação marcada como "Cartão de crédito", o sistema aceita **qualquer valor positivo** do arquivo. Quando o arquivo é um extrato (com créditos e débitos na mesma coluna), os recebimentos entram como despesa. Só o caminho de PDF de extrato tem filtro de crédito (D/C); os caminhos CSV/XLSX de cartão não têm.
- Segunda causa: todo lançamento importado nasce com a **primeira categoria da lista** ("Obrigatórias Fixas · Moradia"). Por isso quase tudo se concentra em Moradia e o Planejado × Realizado fica sem sentido.
- Terceira causa (soma some): o "Realizado" do Planejamento só conta um lançamento quando o par grupo + categoria existe exatamente na lista de categorias atual. Lançamento com categoria antiga/renomeada/vazia desaparece do consolidado, mas continua aparecendo em "Lançadas" — os dois totais não batem.
- Quarta causa (valor desatualizado): a lista de despesas usada pelo Planejamento fica em cache e não é recarregada ao voltar de um lançamento novo, então o Realizado mostra o valor antigo até recarregar a página.
- Também há lançamentos duplicados idênticos no mesmo mês (mesma descrição, mesmo valor, mesma data), o que dobra o realizado.

## O que será feito

1. **Filtrar entradas na importação, sempre.** Em qualquer formato (CSV, XLS, XLSX, PDF) e em qualquer origem (cartão ou extrato), descartar linhas identificadas como entrada: coluna Entrada/Crédito preenchida, marcador C, valor com sinal de crédito, e descrições típicas de recebimento (RECEBIMENTO PIX, PIX_CRED, Transferência Recebida, Depósito, Estorno, Rendimento, Salário). Na pré-visualização mostrar quantas linhas foram descartadas por serem entradas.
2. **Categoria padrão neutra.** Lançamento importado passa a nascer em "Outros" do grupo variável, não em Moradia, e a tela destaca em amarelo os que ainda estão sem classificação para o cliente ajustar antes de confirmar.
3. **Realizado nunca perde lançamento.** O cálculo do Realizado passa a casar por categoria de forma tolerante (ignorando maiúsculas/acentos) e tudo que não casar com nenhuma categoria vai para uma linha "Não classificados" dentro do grupo variável — assim o total do Planejamento passa a bater exatamente com o total de "Lançadas" do mesmo mês.
4. **Fim do cache velho.** Ao entrar no Planejamento Mensal, ao trocar de mês e depois de salvar/excluir/importar despesas, os lançamentos são recarregados do banco antes de recalcular.
5. **Deduplicação.** Bloquear na importação e limpar os duplicados já existentes (mesma data + descrição + valor + mês + cliente), mantendo um registro de cada.
6. **Conferência visível.** Abaixo do Consolidado, um selo "Realizado confere com Lançadas" (ou o aviso da diferença), para o erro nunca mais passar despercebido.

## Revisão geral dos componentes

Depois das correções acima, faço uma passagem de verificação em cada tela, corrigindo o que estiver divergente:

- Cadastros: cliente, perfil, sonhos (prazos curto/médio/longo), categorias, bancos, vencimentos — persistência no banco e recarga ao trocar de cliente.
- Acompanhamento: Despesas (manual, importação, Lançadas com filtros e paginação), Dívidas (progresso e pagamentos), Planejamento Mensal, Painel (gráfico e cards do ano).
- Coerência dos números entre Planejamento, Painel, Painel Anual e Lançadas usando a mesma fonte de cálculo.
- Simuladores e Configurações: navegação, campos e salvamento.

Ao final entrego a lista do que estava errado e do que foi corrigido.

## Detalhes técnicos

- `public/tool.html`: `parseImportFile` (ramo `isCartao` e fallback heurístico) e `processImportPdfLines` passam a usar um filtro único `isEntrada(desc, valor, flags)`; `finishImportRows` deixa de usar `allCats[0]` como padrão.
- `planRealizadoMap` normaliza a chave (`grupo||categoria` sem acento/caixa) e devolve também um balde `__unmatched`; `renderPlanejamentoMes` renderiza a linha "Não classificados"; `planTotais` soma esse balde.
- `loadPlanDespesas(true)` passa a ser chamado em `loadPlanejamentoMes`, após `submitDespesa`, após confirmar importação e após exclusão em Lançadas.
- Deduplicação: reforço da checagem no servidor em `src/lib/sheets-handler.server.ts` (chave data+descricao+valor+mes+cliente_id) e uma migração de limpeza única dos duplicados já gravados em `despesas`.
