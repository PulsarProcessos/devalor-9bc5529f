## Contexto verificado

- O final de `public/tool.html` está corrompido: depois do `</script>` (linha 3317) existe texto solto e uma **segunda cópia** do bloco `fixBanco` como texto visível na página. Isso quebra o comportamento dos selects/botões de banco.
- Os selects `despBanco` e `impBanco` são preenchidos com a opção `+ Novo banco…` (funções `fillBancoSelect` / `fillImpBancoSelect`), e o botão `＋` chama `addBancoPrompt()`.
- A tabela de Vencimentos (linha 706) tem a coluna **"Próx. venc."** e já existe `editVencimento`, mas a coluna de ação hoje mostra status/Editar/Interromper.
- O Planejamento (`panel-extraordinario`) tem grade horizontal de categorias, botão fixo "Replicar mês anterior" e não mostra resumo consolidado nem renda.
- Renda é um painel separado (`panel-renda`) com `_rendaFontes`, `loadRendaPanel()` e `submitRenda()`.
- Existe painel `Cartões de Crédito` no menu (linha 498) e painel `panel-cartoes`.

## O que será feito

### 1. Limpeza do arquivo (causa raiz do botão de banco)
- Remover todo o conteúdo duplicado/solto após o `</script>`, deixando o arquivo terminar corretamente com `</script></body></html>`.

### 2. Banco (Despesas · manual e importação)
- Remover a opção `+ Novo banco…` dos dois selects (`despBanco`, `impBanco`); a lista passa a conter apenas bancos reais.
- Manter/garantir o botão `＋` ao lado de cada select (incluindo o da importação) abrindo o modal "Novo banco".
- Simplificar `onBancoSelectChange` (sem tratamento de `__novo__`) e garantir repopulação ao abrir os painéis.

### 3. Cadastros
- Remover o item de menu "Cartões de Crédito" e o painel `panel-cartoes` (e a rota `goPanel('cartoes')`), mantendo as funções internas de banco intactas.

### 4. Planejamento (layout vertical + renda + resumo)
- Reorganizar a grade de categorias em **layout vertical** (uma linha por categoria: rótulo à esquerda, campo de valor à direita), agrupado por grupo.
- Inserir no topo do Planejamento um bloco **Renda do mês**, com as mesmas fontes de renda do cadastro (adicionar/remover/valor), salvando pelo mesmo fluxo já existente.
- Adicionar a **barra consolidada** no padrão da imagem: `CONSOLIDADO DO MÊS | Mês/Ano · Receitas · Despesas Totais · Investimentos · Saldo Final`, calculada com os dados do mês selecionado.
- Trocar "Replicar mês anterior" por **"Replicar mês…"**: abre um seletor de mês/ano de origem e copia os valores desse mês para o mês atual.

### 5. Vencimento de contas
- Remover a coluna **"Próx. venc."**; manter a coluna **Dia do vencimento**.
- Deixar o botão **Editar** explícito em cada linha (com rolagem até o formulário e botão "Salvar alterações" ao editar).

## Detalhes técnicos
Todas as mudanças ficam em `public/tool.html` (HTML dos painéis + funções `fillBancoSelect`, `fillImpBancoSelect`, `onBancoSelectChange`, `openPlanejamentoPanel`, `savePlanejamentoMes`, `replicarPlanejamentoAnterior`, `renderVencimentos`, `editVencimento`). Sem alterações de banco de dados; a renda continua salva via `apiSaveRenda`.
