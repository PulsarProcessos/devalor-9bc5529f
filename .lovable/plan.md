# Plano de ajustes

## 1. Cabeçalho da sidebar
- Trocar o texto fixo "Planejamento 2026" pelo padrão "Planejamento {ano atual}", usando `new Date().getFullYear()` no JS que preenche `#navYear` (linha 2038).
- Remover a tag "v3.5 · fBRL fix" da sidebar (linha 467 de `public/tool.html`).

## 2. Importação: Cartão de crédito x Extrato bancário
Na aba **Despesas → Importar arquivo** (linhas 701–731), antes da área de upload aparecer, exibir uma escolha:

```text
[ 💳 Cartão de crédito ]   [ 🏦 Extrato bancário ]
```

Comportamento:
- Ao entrar na aba "Importar arquivo", o drop-zone fica oculto e mostra apenas os 2 botões.
- Ao clicar em uma das opções, a escolha é guardada em `state.importSource` ('cartao' | 'extrato') e o drop-zone aparece.
- Um pequeno header acima da zona de upload mostra a fonte escolhida com um link "Trocar" que volta para a seleção.
- Regras de parsing (já existentes em `handleFileSelect`/parsers):
  - **Extrato bancário**: importar **apenas saídas/débitos** (colunas "Saída", "Débito", ou valores negativos). PDF, CSV, XLSX, XLS suportados.
  - **Cartão de crédito**: importar **todos os lançamentos positivos** da fatura (são todos despesas). Mesmos formatos suportados.
- O texto auxiliar do drop-zone muda conforme a fonte:
  - Cartão: "Suporta .CSV, .XLSX, .XLS e .PDF — fatura do cartão"
  - Extrato: "Suporta .CSV, .XLSX, .XLS e .PDF — apenas saídas/débitos são importadas"
- A `origem` salva em `despesas` passa a ser `import_cartao` ou `import_extrato` (em vez de só `import`), preservando rastreabilidade.

## 3. Nova sub-aba "Despesas lançadas" em Acompanhamento → Despesas
Adicionar uma terceira aba ao lado de "Lançamento manual" e "Importar arquivo":

```text
[ ✏️ Lançamento manual ] [ 📂 Importar arquivo ] [ 📊 Lançadas ]
```

Conteúdo da aba "Lançadas":
- Filtros no topo: Mês, Ano, Origem (Todas / Manual / Cartão / Extrato), busca por descrição.
- Tabela com colunas: Data · Descrição · Categoria · Valor · Forma pgto · Banco · Mês · Origem · Ações (excluir).
- Total geral (soma) no rodapé da tabela.
- Carrega via `action=getDespesas` (já existe no backend) e remove via `action=deleteDespesa` (já existe).
- Ao salvar/importar despesas em qualquer outra aba, esta lista é atualizada automaticamente quando o usuário volta para ela.

## Arquivos a alterar
- `public/tool.html` — única mudança necessária (UI + JS). Nenhuma alteração de backend/DB.
