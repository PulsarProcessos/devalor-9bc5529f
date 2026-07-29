## Contexto verificado

- `submitDividas()` (linha ~1724 de `public/tool.html`) chama `goPanel('extraordinario')` nos dois caminhos (com e sem dívidas na fila) — por isso o "Salvar & avançar →" não leva para Vencimentos de Contas. O painel de vencimentos existe com a chave `vencimentos` (nav na linha 549).
- Na tabela de importação, `updateImportRow(id,'parc',val)` (linha ~2886) define `parcN=2` ao marcar, mas ao desmarcar apenas desabilita o campo — o valor 2 (ou outro) continua no objeto e visível no input.

## O que será feito

### 1. Inventário de Dívidas → Vencimentos de Contas
- Em `submitDividas()`, trocar os dois `goPanel('extraordinario')` por `goPanel('vencimentos')`, mantendo o `markNavDone('dividas')` e o restante do fluxo (salvar, limpar fila, toast).

### 2. Desmarcar "Parc." volta o nº para 1
- Em `updateImportRow`, quando `parc` for desmarcado: definir `r.parcN = 1`, limpar/atualizar o input numérico da linha para `1` (além de desabilitá-lo), garantindo que nenhum lançamento seja gerado como parcelado.
- Ao marcar novamente, continua sugerindo 2 parcelas como hoje.

## Detalhes técnicos
Alterações apenas em `public/tool.html`, em duas funções JS (`submitDividas`, `updateImportRow`). Sem mudanças de banco de dados nem de layout.
