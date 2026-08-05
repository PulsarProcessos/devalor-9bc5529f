# Corrigir soma errada dos valores no Planejamento Mensal

## O que está acontecendo

Confirmei a causa no código. Os campos de dinheiro têm duas coisas ligadas ao ato de digitar:

1. a formatação automática do valor (transforma os dígitos em "10,00");
2. o recálculo do total.

Hoje o recálculo roda **antes** da formatação. Quando você digita 10,00, o total é calculado em cima do texto ainda cru daquele instante ("1,000"), que é lido como R$ 1,00. Por isso o subtotal aparece como R$ 1,00 mesmo com 10,00 no campo. Se você clicar fora e voltar a digitar em outro campo, o valor "se conserta" sozinho — sinal clássico desse atraso de um passo.

Os mesmos campos de renda (planejado/recebido) e os simuladores de aposentadoria e investimento têm exatamente a mesma falha de ordem, então o total pode ficar defasado neles também.

## O que será feito

- Garantir que o valor seja formatado **antes** de qualquer cálculo, em todos os campos de dinheiro do sistema: planejamento mensal, renda, simulador de aposentadoria e simulador de investimentos.
- Recalcular subtotais, total, consolidado e resumo já com o valor correto do campo.
- Manter o comportamento visual atual (digitação em centavos, separador de milhar), sem mudar layout.

## Verificação

Digitar 10,00 em uma categoria deve mostrar subtotal e total R$ 10,00 na hora; digitar 1.234,56 deve somar R$ 1.234,56; apagar deve voltar a zero.

## Detalhes técnicos

- `public/tool.html`: a máscara é registrada via `initMasks` com `addEventListener('input', ...)`, enquanto o cálculo está no atributo inline `oninput`. O handler inline dispara primeiro, então `pMoney(input.value)` lê o texto pré-máscara.
- Correção: chamar `mMask(this)` antes do cálculo nos handlers inline (`updatePlanTotal`, `updateRendaFonte`, `calcAposDebounced`, `calcInvestDebounced`). `mMask` é idempotente (reparse dos dígitos), então a máscara registrada por `initMasks` continua sem efeito colateral.
- Nenhuma mudança em banco de dados, API ou lógica de negócio — apenas ordem de execução na camada de interface.
