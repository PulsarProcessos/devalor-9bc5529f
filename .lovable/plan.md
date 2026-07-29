## Contexto verificado

- A barra de navegação do Planejamento (`public/tool.html`, linhas 931-938) tem hoje: `←`, select de mês, select de ano, `→`, `⎘ Replicar mês…` e o status à direita.
- O botão `✓ Salvar mês` está no cabeçalho da seção (linha 925), sem confirmação.
- As tabelas **Resumo** e **Cartão de Crédito** (`.resumo-wrap`, linhas 984-997) ficam no fim do painel, depois de tudo.
- Na importação, os botões `Limpar / Selecionar todos / Desmarcar todos / Enviar selecionados` estão no rodapé da pré-visualização (linhas 863-868), abaixo da tabela.

## O que será feito

### 1. Navegação de mês (Planejamento Mensal)
Nova barra centralizada, no formato:

```text
   ←        Julho de 2026        →
```

- Um único rótulo central "Julho de 2026" (mês + ano juntos), clicável para abrir os selects de mês/ano quando o usuário quiser pular direto para outro período (os selects atuais ficam ocultos, alimentando o mesmo estado).
- Setas `←` / `→` navegam para mês anterior / próximo, virando o ano automaticamente em janeiro/dezembro.
- O texto de status ("Sem planejamento para este mês" / "Planejamento salvo…") vai para baixo do rótulo, centralizado.

### 2. Replicar mês
- O botão `⎘ Replicar mês…` sai da barra de navegação e passa a ficar **abaixo** dela, alinhado como ação secundária (mesmo comportamento e mesmo modal de hoje).

### 3. Salvar mês com confirmação
- O botão `✓ Salvar mês` sai do cabeçalho e vai para o **rodapé do painel**, junto às ações finais.
- Ao clicar, abre um diálogo de confirmação no padrão do sistema (mesmo estilo dos modais existentes): "Deseja realmente salvar o planejamento de Julho de 2026?" com botões **Cancelar** e **Salvar**. Só após confirmar é que `savePlanejamentoMes()` é executado.

### 4. Posição das tabelas Resumo / Cartão de Crédito
- O bloco `.resumo-wrap` (Resumo + Cartão de Crédito) passa a ficar **logo abaixo da barra "Consolidado do mês"**, antes do bloco de Receita e das categorias — mantendo o mesmo conteúdo e cálculo.

### 5. Importação — botões acima da tabela
- Os botões `Limpar`, `Selecionar todos` e `Desmarcar todos` sobem para **acima do cabeçalho da tabela** de pré-visualização, logo abaixo da caixa de instruções.
- O botão `Enviar selecionados ↗` permanece no rodapé, como ação final.

## Detalhes técnicos
Tudo em `public/tool.html`: reescrita do bloco de navegação (novo `planPeriodoLbl` + selects ocultos alimentando `planMesSel`/`planAnoSel` para não quebrar `loadPlanejamentoMes`/`planNavMes`), atualização do rótulo dentro de `loadPlanejamentoMes`, novo modal `modalSalvarPlan` com wrapper `confirmSavePlanejamentoMes()`, reordenação dos blocos do painel e do rodapé da pré-visualização de importação. Sem alterações de banco de dados nem de lógica de cálculo.
