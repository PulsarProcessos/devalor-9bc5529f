# Plano de implementação

## 1. Menu lateral colapsável (estilo da referência)

Hoje os 4 blocos (Cadastro, Acompanhamento, Simuladores, Configurações) já existem no `public/tool.html`, mas todos os itens ficam expostos o tempo todo. Vou transformar cada bloco em um item "pai" clicável (com seta `>` / `v`) que expande/colapsa os itens-filhos, exatamente como nas imagens enviadas.

- Renomear os blocos para: **Cadastros**, **Acompanhamento**, **Simuladores**, **Configurações**.
- Cada bloco vira um botão com ícone + label + chevron (`›` colapsado, `⌄` aberto).
- Apenas um bloco aberto por vez (acordeão). Ao abrir, mostra os sub-itens já existentes (Perfil, Sonhos, Dívidas, Renda, Vida Rica, Plano de Ação, Reserva Ideal, Quitação, Despesas, Extraordinário, Painel, Aposentadoria, Investimentos, Categorias).
- O bloco que contém o painel ativo abre automaticamente.
- Mantém visual atual (tipografia/cores Dê Valor) — só muda a estrutura de navegação.

## 2. Isolamento de dados entre clientes (urgente)

Hoje o backend (`src/routes/api/sheets.ts`) confia no `clienteId` que vem no body. Um cliente logado pode trocar o `clienteId` no `fetch` e ler dados de outro. Vou corrigir:

- Após login, o backend emite um **token de sessão** (assinado, HMAC com `SUPABASE_SERVICE_ROLE_KEY` como segredo) contendo `{ userId, role, clienteId, exp }`.
- Frontend guarda em `localStorage` e envia em todo request (`Authorization: Bearer ...`).
- Toda ação que recebe `clienteId` valida no servidor:
  - **role `cliente`** → ignora o `clienteId` do body e usa **o do token**. Não consegue ler/escrever dados de outro cliente, ponto.
  - **role `consultor`** → pode passar `clienteId` (acesso a todos os clientes — comportamento atual do painel do consultor).
- Sem token válido → 401.

Isso fecha a brecha sem mudar o fluxo de UI.

## 3. Novas tabelas no banco (uma linha por cliente, isoladas)

Hoje quase tudo é gravado de forma genérica em `entries (cliente_id, sheet, data jsonb)`. Funciona, mas o usuário pediu bases dedicadas para Acompanhamento. Vou criar tabelas tipadas, todas com `cliente_id` + políticas RLS de negação para `anon`/`authenticated` (acesso só via service role nas rotas server, como já é o padrão):

- `plano_acao` — id, cliente_id, titulo, descricao, prazo, status, prioridade, created_at
- `reserva_ideal` — cliente_id (PK), valor_alvo, meses_cobertura, valor_atual, observacoes, updated_at
- `despesas` — id, cliente_id, data, descricao, categoria, grupo (obrigatórias/não-obrigatórias/investimentos), valor, forma_pagamento, banco, mes, ano, origem (manual/import)
- `dividas` — id, cliente_id, credor, tipo, saldo_devedor, taxa_juros, parcelas_restantes, valor_parcela, status, created_at
- `extraordinario` — id, cliente_id, mes, ano, categoria, grupo, valor_planejado, descricao

Todas com `cliente_id` indexado e GRANTs corretos (`service_role` ALL, deny `anon`/`authenticated`). As telas existentes passam a ler/gravar nessas tabelas via `/api/sheets` (sempre filtrando pelo `clienteId` do token — ver item 2).

## 4. Importação de extratos bancários — só saídas

Adicionar um botão **"Importar extrato"** na tela de Despesas, aceitando `.csv`, `.xlsx`, `.xls` e `.pdf`. Regras:

- **Apenas linhas com valor de saída/débito** entram. Entradas/créditos são ignoradas.
- Detecção automática do layout pelo header:
  - **C6 Bank (XLSX)**: header na linha que contém `Data Lançamento | Data Contábil | Título | Descrição | Entrada(R$) | Saída(R$) | Saldo do Dia(R$)`. Importa quando `Saída(R$) > 0`.
  - **Bradesco (XLS)**: header `Data | Lançamento | Dcto. | Crédito (R$) | Débito (R$) | Saldo (R$)`. Importa quando `Débito` está preenchido (valores vêm negativos no arquivo — uso o módulo).
  - **Genérico CSV/XLSX**: tenta achar colunas chamadas `Saída`, `Débito`, `Debit`, `Valor` (com sinal negativo). Mostra preview antes de confirmar.
- **PDF**: faço o parse no servidor com `pdf-parse` (texto). Para extratos comuns (C6, Bradesco, Itaú, Nubank), uso regex por linha (`dd/mm/aaaa  descrição  -1.234,56`) e mantenho só valores negativos. Se o PDF for imagem escaneada (sem texto), aviso o usuário que não é suportado.
- Cada linha importada vira um registro em `despesas` com `origem='import'`, `mes`/`ano` derivados da data, descrição vinda do extrato, categoria/grupo em branco (usuário classifica depois). Deduplicação por `(cliente_id, data, valor, descricao)` para não duplicar reimportações.
- Preview na tela antes de salvar: o usuário vê a lista, pode desmarcar linhas e confirmar.

## 5. Detalhes técnicos

- Frontend: `public/tool.html` (HTML/JS standalone). Sidebar acordeão com `data-section`/`data-panel`, CSS para chevron rotacionar.
- Importação: SheetJS (já carregado) lê XLSX/XLS; PapaParse (já carregado) lê CSV; PDF é enviado para `/api/sheets` action `importPdf` (servidor usa `pdf-parse`).
- Backend: novo helper `getAuthContext(request)` que valida o Bearer token e retorna `{ userId, role, clienteId }`; todas as actions passam por ele.
- Migração SQL única criando as 5 tabelas + GRANTs + RLS deny + índices.
- Sem mudança nos demais fluxos visuais; o sistema continua exatamente como está nas outras telas.

```text
sidebar
├─ Cadastros           ▸ (click) ⌄
│   ├─ Perfil & Reserva
│   ├─ Sonhos & Objetivos
│   ├─ Inventário de Dívidas
│   └─ Renda & Planejamento
├─ Acompanhamento      ▸
│   ├─ Vida Rica
│   ├─ Plano de Ação
│   ├─ Reserva Ideal
│   ├─ Quitação de Dívidas
│   ├─ Despesas         ← botão "Importar extrato"
│   ├─ Extraordinário
│   └─ Painel Comparativo
├─ Simuladores         ▸
│   ├─ Aposentadoria
│   └─ Investimentos
└─ Configurações       ▸
    └─ Categorias
```
