# Cadastro guiado: Perfil → Reserva → Vida Rica → Vencimentos

## 1. Botão "+ Novo sonho" ao lado dos cards
- O botão sai do cabeçalho e passa a ser o último item do grid de sonhos, como um card "fantasma" (tracejado, mesma altura dos cards).
- Ao criar um sonho, o card novo entra no grid e o botão continua sempre logo depois do último card.
- O formulário de sonho abre num modal (mesmo padrão visual do "Editar Sonho" que já existe), em vez de empurrar a página.

## 2. Texto da Vida Rica
- Novo campo de texto livre no topo da aba Vida Rica: "Como está a sua vida hoje?" (textarea), salvo junto com o perfil do cliente.
- Abaixo do texto, o grid de sonhos.

## 3. Reserva como etapa própria (extensão do Perfil)
- Nova etapa entre Perfil e Vida Rica: "Reserva de Emergência" (aba/painel próprio, mas ligada ao Perfil).
- No primeiro cadastro: o cliente preenche o Perfil, clica em "Salvar & avançar" e cai nessa tela, que mostra meses recomendados, valor ideal e o resumo das respostas — sem precisar apertar "Calcular reserva".
- Depois do cadastro concluído: o cálculo passa a ser automático a cada alteração dos campos do Perfil (gastos, CLT, filhos, rede de apoio), com o resultado atualizando na hora. O botão "Calcular reserva" deixa de existir.
- Stepper passa a ter 4 etapas: 1 Perfil · 2 Reserva · 3 Vida Rica · 4 Vencimentos.

## 4. Avanço obrigatório no primeiro cadastro
- Enquanto o cadastro inicial não estiver concluído, as abas do menu lateral (Acompanhamento, Simuladores, Configurações) e os passos ainda não alcançados ficam bloqueados (visualmente esmaecidos + aviso ao clicar).
- Só se avança pelo botão "Salvar & avançar", e cada etapa valida o mínimo:
  - Perfil: nome, e-mail e gastos fixos preenchidos.
  - Reserva: apenas confirmação (avançar).
  - Vida Rica: texto preenchido e pelo menos 1 sonho cadastrado.
  - Vencimentos: pelo menos 1 conta, ou o botão "Não tenho contas fixas" para seguir.
- Ao concluir Vencimentos, o cadastro é marcado como finalizado: tudo destrava, todas as abas ficam livres e as telas do cadastro passam a modo edição (pode voltar e alterar qualquer coisa, salvando direto).

## Detalhes técnicos
- Tudo em `public/tool.html`.
- Novo painel `panel-reserva` + item de menu, `DV_STEPS` com 4 etapas e `renderSteppers` marcando etapas bloqueadas.
- Estado `onboardingDone` e o texto da vida rica gravados no JSON `data` de `perfil_cliente` via a ação `savePerfil` existente — sem migração de banco.
- `goPanel` ganha um guard: se o cadastro não estiver concluído, redireciona para a etapa pendente.
- `calcReserve()` vira função silenciosa chamada por `input`/`change` nos campos do Perfil (debounce), reaproveitando a fórmula atual; `calcReserveDash` continua igual.
