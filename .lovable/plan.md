# Plano: corrigir login e migrar tudo para tabelas próprias

## Problema 1 — "Sessão expirada" ao cadastrar cliente

Causa: a sessão atual no navegador foi criada antes do novo sistema de token HMAC, então `localStorage.dv_tk` está vazio. Quando o frontend envia `createCliente` sem `Authorization: Bearer ...`, o backend responde 401 "Sessão expirada".

Correção:
- No frontend, ao detectar que `_user` existe mas `dv_tk` não, forçar logout silencioso já no boot (em vez de só no 401), levando direto para a tela de login.
- Tornar `gPost/gGet` mais claros: se receber 401, limpar sessão e mostrar a tela de login imediatamente (já faz parcialmente).
- Após o usuário relogar com `alansilveira@pulsarprocessos.com.br` (ou outro consultor), o token é gerado e o cadastro funciona.

## Problema 2 — Tudo passar pela base de dados própria (fim do "sheets")

Hoje várias telas ainda usam a tabela genérica `entries` (jsonb), herdada da época em que o backend era Google Sheets. Vamos mover cada fluxo para uma tabela dedicada e renomear o endpoint.

### Novas tabelas

```text
perfil_cliente   (1 linha por cliente)
  cliente_id PK, nome, email, telefone, clt, filhos, rede,
  gastos_mensais, reserva_meses, reserva_valor, ano, updated_at

renda_planejamento (1 linha por cliente/ano)
  cliente_id, ano, salario, outras, updated_at  (PK: cliente_id+ano)

sonhos (Vida Rica) — N linhas
  id, cliente_id, descricao, prazo, valor, prioridade, created_at

painel_mensal (cache opcional — não criar agora; calcular on-the-fly via despesas + extraordinario + renda_planejamento)
```

As tabelas dedicadas já existentes (`despesas`, `dividas`, `extraordinario`, `plano_acao`, `reserva_ideal`) continuam.

Todas com GRANT só para `service_role`, RLS deny `anon`/`authenticated` (mesmo padrão atual). Acesso somente via `/api/data` com token HMAC.

### Backend (`src/routes/api/sheets.ts` → renomear para `src/routes/api/data.ts`)

Remover ações legadas baseadas em `entries`/`sheet`:
- `savePerfil`, `saveRenda`, `appendRows`, `getRows`, `getPainel` (versão entries)

Adicionar ações dedicadas:
- `getPerfil` / `savePerfil` → tabela `perfil_cliente`
- `getRenda` / `saveRenda` → tabela `renda_planejamento`
- `getSonhos` / `addSonhos` / `deleteSonho` → tabela `sonhos`
- `getPainel` reescrito para somar de `despesas` + `extraordinario` + `renda_planejamento`
- `getDividas` / `saveDivida` / `deleteDivida` (já existem) — passar a ser o único caminho
- `addDespesas` / `getDespesas` (já existem) — único caminho para Despesas
- `saveExtraordinario` / `getExtraordinario` (já existem) — único caminho
- `savePlanoAcao` / `getPlanoAcao` / `deletePlanoAcao` (já existem)

Apagar dados antigos: opcionalmente migrar `entries` → tabelas dedicadas em uma migration única (best-effort). Depois `DROP TABLE entries`.

### Frontend (`public/tool.html`)

- Trocar `CFG.GAS = '/api/sheets'` por `'/api/data'`.
- Remover `CFG.SH` (nomes de planilhas).
- Reescrever as chamadas:
  - `apiSavePerfil(d)` → `gPost('savePerfil',{data:d})`
  - `apiSaveRenda(d)` → `gPost('saveRenda',{data:d})`
  - Sonhos: `gPost('addSonhos',{rows})` e `gGet('getSonhos')`
  - Dívidas (form atual envia rows via `apiRows`): trocar por `gPost('saveDivida',{data:r})` em loop ou um único `saveDividas` que recebe array
  - Plano de Ação (form atual envia via `apiRows`): trocar por `saveAcoes` (array) → grava em `plano_acao`
  - Despesas (manual e importação): `gPost('addDespesas',{rows:[{data,descricao,valor,categoria,grupo,mes,ano,banco,forma_pagamento,origem}]})` — já existe, mapear os campos corretos
  - Extraordinário: `gPost('saveExtraordinario',{rows:[{mes,categoria,valor_planejado,ano}]})`
  - `getPainel(mes)` continua igual (mesma assinatura), mas backend lê das tabelas novas

### Migrations
1 migration criando `perfil_cliente`, `renda_planejamento`, `sonhos` com GRANTs e RLS deny.
1 migration opcional copiando `entries` antigas para as novas tabelas.

### Compatibilidade
- Manter rota `/api/sheets` por enquanto redirecionando para `/api/data` para não quebrar abas abertas — remover em passo seguinte.

## Resultado
- O erro "Sessão expirada" desaparece após relogin (e o app já manda relogar quando o token está faltando).
- Nenhum fluxo passa mais pelo conceito de "sheet"; cada entidade tem sua tabela própria no banco.
- A tabela `entries` pode ser removida com segurança.
