## Contexto verificado

- **Causa do botão "＋ Adicionar banco" não abrir nada**: no HTML, o modal `modalCats` (linha ~449) não tem a tag de fechamento da camada `modal-ov`. Com isso o `#modalNovoBanco` ficou **aninhado dentro do modal de categorias**, que está oculto — o modal existe e a função `openNovoBancoModal()` roda, mas nada aparece na tela.
- A lista padrão `BANCOS_DEFAULT` contém a entrada `'Outro'` (linha 2220), que aparece no dropdown.
- `openPagamentoDivida()` (linha 2058) ainda usa o `prompt()` nativo do navegador.
- `openReplicarModal()` monta os 12 meses × todos os anos, sem filtrar pelos meses que realmente têm planejamento salvo (`_planAllRows`).
- Na importação, o passo 2 só tem o campo Banco; a competência é fixada em `finishImportRows()` como o mês/ano atual, sem o usuário poder escolher.

## O que será feito

### 1. Dívidas — modal "Registrar pagamento"
- Novo modal no padrão do sistema (`modal-ov` / `modal-box`) mostrando credor, saldo devedor e valor da parcela sugerido, com campo de valor formatado em R$, mensagem de erro inline e botões Cancelar / Confirmar pagamento.
- `openPagamentoDivida()` passa a abrir esse modal; a confirmação chama a mesma API `registerDividaPagamento` já existente.

### 2. Banco (aba Despesas e Importação)
- Corrigir o HTML do `modalCats` (fechar a camada corretamente) para que o `#modalNovoBanco` volte a ser um modal de primeiro nível — isso faz o botão **＋** funcionar nos dois lugares.
- Melhorar o formulário do modal no padrão do sistema (título, campo, validação, rodapé).
- Remover **"Outro"** de `BANCOS_DEFAULT` para não aparecer no dropdown.

### 3. Planejamento — Replicar mês
- O seletor de origem passa a listar apenas os meses/anos que existem em `_planAllRows` (planejamentos já salvos), em um único select do tipo "Julho/2026", excluindo o mês atualmente aberto.
- Se não houver nenhum mês salvo, o modal informa isso e o botão fica desabilitado.

### 4. Importação — Fatura de cartão
- No passo 2, quando a fonte for **Fatura de cartão de crédito**, exibir, ao lado do Banco, o campo **"Mês de pagamento da fatura"** (conforme a imagem), com os meses a partir do mês atual, começando selecionado no mês atual.
- Para **Extrato bancário** o campo fica oculto (segue o mês vigente).
- O mês escolhido substitui a competência aplicada às linhas importadas e aparece no rótulo "Competência: …".

## Detalhes técnicos
Todas as mudanças ficam em `public/tool.html`: correção da estrutura dos modais, novo `modalPagDivida`, ajustes em `openPagamentoDivida`, `BANCOS_DEFAULT`, `openReplicarModal`/`confirmReplicarMes`, `chooseImportTipo`, `onImportBancoChange`/`refreshImportDropState` e `finishImportRows`. Nenhuma alteração de banco de dados.
