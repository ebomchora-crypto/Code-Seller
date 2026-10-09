# Abrir estruturas arbitrárias

Correção solicitada pelo usuário: o fluxo principal deve abrir uma pasta como uma IDE, sem exigir React/HTML nem copiar o projeto.

- `Abrir pasta`: seletor Windows com fallback para caminho completo; API registra a pasta original como workspace genérico.
- O registro persiste `folderPath`; terminal e Git resolvem o mesmo diretório após reinício.
- Abrir não altera os arquivos nem executa código. Salvar/renomear/excluir/restaurar são operações nos arquivos originais.
- Pastas vazias são aceitas. Templates são opcionais para projetos novos; duplicações/importações continuam produzindo cópias locais.
- Uma pasta indisponível gera erro, sem reconstruir snapshots no diretório original automaticamente.
- Identificação de ferramentas serve para orientar execução; não restringe os nomes, extensões ou disposição do código.
- Preview rápido React/HTML continua restrito aos templates correspondentes. Workspaces genéricos usam os servidores e compiladores próprios pelo terminal.
- Confiança explícita antes de terminal e escrita Git permanece. Limites atuais de leitura de texto e exclusão de credenciais/dependências permanecem documentados no README.

Isso substitui a restrição anterior de operar exclusivamente em `.code-makers/workspaces/<id>` quando o usuário escolhe explicitamente `Abrir pasta`.
