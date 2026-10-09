# IDE local com terminal e ferramentas de desenvolvimento

O usuário autorizou expandir a IDE local existente para uma experiência próxima do VS Code. Não há Supabase, contas obrigatórias, alterações fora deste projeto ou publicação automática.

## Escolha
Preservar a aplicação React/Monaco e ampliar o servidor Node. Adotar Theia ou embutir um VS Code completo exigiria substituir a aplicação e migrar a persistência; isso não é necessário para entregar terminal, tarefas, Git e busca. Esta expansão não promete compatibilidade com extensões VSIX ou com todos os recursos do VS Code.

## Sistemas
1. Workspace real em `.code-makers/workspaces/<id>`. JSON continua guardando metadados e checkpoints. Gravações no editor sincronizam arquivos reais; alterações feitas pelo terminal são reconciliadas por revisão. Não seguir symlinks, nem importar node_modules, .git, dist ou credenciais para o editor/IA. Registrar checkpoint antes de reconciliar alterações externas.
2. Terminal PTY com PowerShell em Windows, xterm.js e WebSocket. Exigir confiança por projeto, verificar origem, restringir sessões ao workspace escolhido, limitar sessões e limpar processos. Terminal nativo tem os privilégios do usuário e não é um sandbox do sistema operacional. Não transmitir AI_API_KEY nem outras variáveis da plataforma ao processo.
3. Tarefas: instalação explícita de dependências e execução de scripts definidos no package.json pelo terminal. Projetos novos usam Vite; preview rápido esbuild continua disponível e o servidor de desenvolvimento real pode ser aberto pelo usuário. Nenhum comando sugerido pela IA é executado automaticamente.
4. Git local: inicializar repositório, branch/status, diff, stage/unstage e commit com mensagem. Não fazer push nem sobrescrever remotos. Usar execFile e argumentos separados, com caminhos validados e timeout.
5. IDE: barra de atividades, painéis ajustáveis, busca de conteúdo e substituição global com checkpoint, abrir rapidamente arquivos, paleta de comandos, diagnósticos Monaco, preferências de tema/fonte/wrap, abas e execução.
6. IA: preservar streaming e aprovação; adicionar configuração de modelo pela UI sem expor chaves, catálogo quando disponível e conversas persistidas no disco. Sem simular inferência quando não houver provedor.

## Aceite
Testes em arquivos/processos reais devem comprovar reconciliação, proteção de caminhos, terminal PTY, comandos Git, conflitos e streaming. O build deve passar. Recursos dependentes de modelo e inspeção visual devem ser relatados como não verificados se indisponíveis.
