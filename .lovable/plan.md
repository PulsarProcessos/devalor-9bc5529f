## Contexto verificado

- Na importação (`public/tool.html`), o Passo 1 já tem dois cards (`impSrcFatura` / `impSrcExtrato`) e `chooseImportTipo()` avança direto para o Passo 2, sem nenhuma confirmação.
- A aba **Lançadas** usa `renderDespesasLancadas()` (linha ~3011), que renderiza **todas** as linhas filtradas de uma vez em `lancTbody` — sem paginação (diferente da importação, que já tem `_importPage` + `importPager`).

## O que será feito

### 1. Mensagem de confirmação do tipo de arquivo
- Ao clicar em **Fatura de cartão de crédito** ou **Extrato bancário**, abre um modal de confirmação no padrão visual do sistema (mesmo estilo dos modais já existentes), com o texto:
  - Fatura: “Você está importando uma **fatura de cartão de crédito**?” — subtexto lembrando que todos os lançamentos da fatura viram despesa.
  - Extrato: “Você está importando um **extrato bancário**?” — subtexto lembrando que apenas saídas/débitos são importados.
- Botões **Cancelar** (não seleciona nada) e **Sim, confirmar** (segue para o Passo 2, comportamento atual).
- A mesma confirmação também é reforçada no Passo 3: o rótulo acima da área de upload passa a exibir o tipo escolhido junto ao banco (ex.: “Fatura de cartão · Nubank”), para o cliente conferir antes de enviar o arquivo.

### 2. Paginação de 25 lançamentos na aba Lançadas
- `renderDespesasLancadas()` passa a exibir no máximo **25 lançamentos por página**.
- Rodapé de paginação abaixo da tabela, no mesmo padrão da importação: `←` / `Página X de Y · N lançamento(s)` / `→`.
- O **Total** continua somando **todos** os lançamentos filtrados (não só a página visível).
- Ao trocar qualquer filtro (Mês, Categoria, Banco, Forma de pagamento, ocultar projetadas) ou atualizar/excluir, a página volta para a 1.

## Detalhes técnicos
Tudo em `public/tool.html`: novo modal `modalConfirmImportTipo` + wrapper `askImportTipo(t)` chamado pelos botões do Passo 1 (mantendo `chooseImportTipo` como executor); nova variável `_lancPage` com constante `LANC_PAGE_SIZE = 25`, fatiamento do array `filtered` em `renderDespesasLancadas()`, novo `<div id="lancPager">` e função `gotoLancPage(p)`; reset de `_lancPage=1` nos handlers de filtro/carregamento. Sem alterações no banco de dados nem na lógica de cálculo.