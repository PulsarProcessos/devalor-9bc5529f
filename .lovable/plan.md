## Diagnóstico

A tela do print é a **versão antiga da página** ainda em cache no navegador:

- O passo "2 Selecione o banco" não aparece na sua tela, mas ele **já existe** no arquivo servido pelo servidor (verificado agora: `id="importBancoWrap"` com o rótulo "2 Selecione o banco" está lá).
- A mensagem de erro "Selecione o arquivo novamente." **não existe mais** no código atual — ela era do fluxo antigo (em que a fonte só podia ser escolhida depois de enviar o arquivo). Ou seja, seu navegador está executando a versão anterior de `tool.html`.

Resultado: ao clicar em "Fatura de cartão de crédito", o código antigo exige um arquivo já carregado, dispara o erro e nunca libera o envio.

## O que fazer

### 1. Evitar que o navegador sirva versão velha (causa raiz)
- Adicionar cabeçalhos anti-cache / parâmetro de versão ao carregar `/tool.html` (o redirecionamento em `src/routes/index.tsx` passa a incluir um marcador de versão), para que toda atualização chegue imediatamente ao usuário sem precisar de "hard refresh".

### 2. Blindar o fluxo de importação contra estados inválidos
- `chooseImportTipo` nunca depende de arquivo previamente selecionado: apenas marca a fonte, destaca o card e revela o passo 2.
- Se a lista de bancos vier vazia, preencher com a lista padrão (Bradesco, Nubank, Banco do Brasil, Caixa Econômica, Itaú, Santander, Inter, C6 Bank, Outro) antes de mostrar o passo 2.
- Ao abrir a aba "Importar arquivo", resetar o fluxo para o passo 1 limpo (sem fonte/banco/arquivo pendentes).
- Envolver a leitura/parse do arquivo em `try/catch` e exibir a mensagem real do erro (ex.: "Não foi possível ler o PDF: ...") em vez de mensagens genéricas.

### 3. Validar
- Recarregar a página e testar: escolher fonte → aparecer passo 2 → escolher banco → área de envio liberada → importar um CSV/XLSX e conferir a prévia.

## Observação
Se depois desses ajustes ainda aparecer erro, preciso do texto exato da nova mensagem (ou do print pós-atualização) para tratar o caso específico do arquivo.

## Arquivos alterados
- `public/tool.html` (fluxo de importação)
- `src/routes/index.tsx` (versionamento/anti-cache do redirecionamento)
