# Vida Rica: texto abaixo dos sonhos

## O que muda
- O bloco de texto sai de cima e passa a ficar **abaixo do grid de sonhos**. Como o botão "+ Novo sonho" é o último card do grid, ao adicionar sonhos o grid cresce e o texto é reposicionado para baixo automaticamente.
- Título e subtítulo do bloco passam a ser os da imagem enviada:
  - Título: "O que é Vida Rica para você?"
  - Subtexto (itálico, menor): "Escreva com detalhes o que você deseja usufruir e sentir na sua vida. Mentalize o seu a dia a dia, porque sobre o futuro você já escreveu acima."
- O textarea perde o rótulo "Como está a sua vida hoje?" (substituído pelo título acima) e mantém o botão "Salvar texto".
- O botão "Salvar & avançar" continua sendo o último elemento da tela, depois do bloco de texto.

## Detalhes técnicos
- Em `public/tool.html`, mover o `card-form` com `#vidaRicaTexto` (linhas ~685-693) para depois de `#dreamsGrid`, antes do rodapé "Salvar & avançar".
- Trocar o `label` por um cabeçalho (`h3` + `p` de apoio) com o texto novo; manter `id="vidaRicaTexto"` e `saveVidaRicaTexto()` intactos para não afetar salvamento/validação.
- Nenhuma mudança em banco de dados ou lógica de onboarding.
