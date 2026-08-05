# Cadastros que somem: gravar no banco em vez do navegador

## O que está acontecendo

Verifiquei o código da ferramenta. Parte dos cadastros já vai para o banco (clientes, perfil, renda, sonhos, despesas, dívidas, plano de ação, planejamento). Mas quatro cadastros nunca chegam ao banco — eles são gravados apenas na memória do navegador:

- Categorias e subcategorias personalizadas
- Bancos
- Cartões de crédito
- Vencimentos de contas

Por isso eles aparecem normalmente enquanto a aba está aberta, mas somem ao limpar o navegador, trocar de máquina ou usar outro navegador.

## O que será feito

1. Criar no banco as tabelas que faltam, uma por domínio, sempre ligadas ao cliente:
   - categorias (grupo, nome da categoria, ordem)
   - bancos (nome)
   - cartoes (nome, banco vinculado)
   - vencimentos (descrição, dia do vencimento, valor, categoria, status ativo/pausado)
2. Criar as ações de leitura, gravação e exclusão para cada um desses cadastros no mesmo canal de comunicação já usado pelo restante do sistema (com o token do usuário e isolamento por cliente).
3. Trocar, na ferramenta, todas as leituras/gravações locais desses quatro cadastros por chamadas ao banco:
   - carregar do banco ao entrar no cliente;
   - gravar no banco ao adicionar, editar, pausar ou excluir;
   - manter uma cópia em memória só como cache da sessão, para a tela continuar rápida.
4. Migração automática única: ao abrir um cliente pela primeira vez após a mudança, se existirem categorias/bancos/cartões/vencimentos salvos no navegador e o banco estiver vazio para aquele cliente, esses dados são enviados ao banco e marcados como migrados — nada do que você já cadastrou se perde.
5. Ajustar os pontos que dependem desses cadastros (seletores de banco/cartão nas despesas, importação de arquivos, editor de categorias, painel de planejamento) para usar a fonte vinda do banco.

## Detalhes técnicos

- Migração SQL nova: tabelas `categorias`, `bancos`, `cartoes`, `vencimentos` em `public`, com `cliente_id text not null`, `created_at`/`updated_at`, GRANTs para `service_role` e políticas RESTRICTIVE deny-all para `anon`/`authenticated` — mesmo padrão das tabelas existentes, já que todo acesso passa pelo `service_role` na rota `/api/sheets`.
- `src/lib/sheets-handler.server.ts`: novas ações `getCategorias`/`saveCategorias`, `getBancos`/`saveBanco`/`deleteBanco`, `getCartoes`/`saveCartao`/`deleteCartao`, `getVencimentos`/`saveVencimento`/`deleteVencimento`, todas resolvendo `cliente_id` a partir do token, como as demais.
- `public/tool.html`: substituir `CATS_KEY`, `BANCOS_KEY`, `CARTOES_KEY` e `vencKey` por carregamento assíncrono do servidor com cache em memória; `saveCatsStore`, `saveBancos`, `saveCartao`, `saveVencimentos` passam a chamar a API. Uma flag local `dv_migrated_<cliente>` controla a migração única.
- O aviso de virada de mês (`dv_plan_last_seen_*`) continua no navegador — é preferência de exibição, não cadastro.
