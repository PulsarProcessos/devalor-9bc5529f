# Primeiro acesso focado + confiabilidade do salvamento

## 1. Menu lateral recolhido no primeiro cadastro

- Enquanto o cliente não concluir as 4 etapas (Perfil · Reserva · Vida Rica · Vencimentos), a barra lateral fica escondida: a tela mostra só o indicador de etapas e o conteúdo da etapa atual, ocupando a largura toda.
- O avanço acontece apenas pelos botões "Salvar & avançar" / "Concluir".
- Ao concluir o cadastro, a barra lateral aparece (com uma pequena animação) e todo o sistema é liberado; nos acessos seguintes ela já vem aberta normalmente.
- Consultor abrindo um cliente que já concluiu: nada muda.

## 2. Progresso do cadastro deixa de se perder

Hoje só ficam salvos "perfil preenchido" e "cadastro concluído". Quem parou na etapa 2 ou 3 volta como se tivesse feito menos. Passa a ser gravada a lista de etapas concluídas junto do perfil, e ao entrar o sistema retoma exatamente na etapa pendente, com o que já foi preenchido no lugar.

## 3. Revisão da comunicação com o banco (o que sumiu e por quê)

Verificado no banco: o perfil, o texto da Vida Rica e os sonhos do cliente Alan estão gravados; a tabela de vencimentos de contas está vazia para todos os clientes. Os pontos frágeis encontrados na sincronização:

- **Falha de leitura é tratada como "não tem nada".** Se a chamada de categorias/bancos/cartões/vencimentos falhar (rede, sessão, servidor), o app assume lista vazia, mostra a tela em branco (o "sumiu tudo") e o próximo salvamento apaga tudo no banco e grava a lista vazia por cima — porque salvar significa "apagar tudo do cliente e reinserir".
- **Erros são engolidos em silêncio** (`catch{}` sem aviso) no carregamento de perfil, sonhos e cadastros: o cliente não percebe que o dado não chegou.
- **Salvamentos disparados sem confirmação** (fire-and-forget): se falharem, ninguém fica sabendo e o dado só existe no navegador.

Correções:

- Separar "falhou" de "vazio": a camada de carregamento passa a devolver o status. Em falha, o app mostra um aviso ("Não foi possível carregar seus dados — tentando de novo") com nova tentativa automática, mantém o que estava e **bloqueia qualquer gravação destrutiva** até a leitura funcionar.
- Salvamento de vencimentos/categorias/bancos/cartões só executa a partir de dados carregados com sucesso; caso contrário avisa e não envia.
- Retorno visível de erro em perfil, texto da Vida Rica, sonhos e vencimentos, com opção de tentar novamente.
- No login, recarregar perfil, sonhos e vencimentos do banco antes de decidir o que exibir, sem depender do espelho do navegador.

## Detalhes técnicos

- `public/tool.html`: classe `onboarding-focus` no `#appWrap` (sidebar `display:none`, conteúdo full-width), aplicada/removida em `applyLocks()` conforme `_onboardingDone`.
- Etapas concluídas gravadas em `perfil_cliente.data.stepsDone` via a ação `savePerfil` já existente; `loadPerfilRemoto` restaura as classes `done` a partir dela.
- `_silent()` passa a devolver `{ok:false}` em erro em vez de `null`; `loadCadastros` distingue erro de vazio e define `_cadastrosLoadFailed`; `pushCategorias/pushBancos/pushCartoes/pushVencimentos` abortam quando essa flag está ativa.
- `loadSonhosFromSheets` e `loadPerfilRemoto` passam a tratar erro com toast + retry.
- Sem migração de banco: as tabelas atuais atendem.
