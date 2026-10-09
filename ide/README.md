# Code Makers IDE — local

IDE pessoal com Monaco, React, TypeScript, Vite, servidor Node, terminal nativo e Git. Sem Supabase, conta ou banco remoto.

## Abrir

### Aplicativo Windows

Instale `release/Code-Makers-IDE-Setup-1.0.0.exe` e abra **Code Makers IDE** pelo atalho. Também é possível abrir `release/win-unpacked/Code Makers IDE.exe`; mantenha toda essa pasta junta. O aplicativo inclui o Node do servidor e abre uma janela própria, com Monaco, Git e PowerShell. Não precisa iniciar `npm run dev` nem abrir o navegador.

Nesta pasta, **Abrir Code Makers App.cmd** abre diretamente o aplicativo já empacotado. **Iniciar Code Makers.cmd** continua iniciando a versão no navegador.

Os dados do aplicativo instalado ficam em `%APPDATA%/Code Makers IDE/data`. A edição pelo botão **Abrir pasta** continua acontecendo na pasta original. Os projetos da versão de desenvolvimento ficam em `.code-makers`; para abrir seus arquivos no aplicativo, use **Abrir por caminho** e selecione a pasta em `.code-makers/workspaces`. Não há sincronização automática entre esses dois cadastros.

Git, Python, Java, .NET e as demais ferramentas dos seus projetos precisam estar instalados no computador. O Node incluído inicia o servidor da IDE; comandos `node` e `npm` no PowerShell usam a instalação disponível no PATH.

Para desenvolver a versão desktop: `npm run desktop`. Para gerar novamente o instalador: `npm run desktop:package`. O executável ainda não possui certificado de assinatura digital.

O acesso ao ChatGPT/Codex pelo celular é um recurso separado do editor. Veja a [configuração oficial de conexões remotas](https://learn.chatgpt.com/docs/remote-connections). A disponibilidade depende da conta e da versão dos aplicativos; o computador precisa estar acordado, online e com o ChatGPT aberto.

### Versão no navegador

No Windows, abra **Iniciar Code Makers.cmd**. Ou execute nesta pasta:

```powershell
npm install
npm run dev
```

Requer Node 22.12+ ou 24+ e Git instalado para o painel Git. As dependências desta IDE já estão instaladas. Abra o endereço `Local` mostrado pelo Vite; normalmente é `http://127.0.0.1:5173`. Portas ocupadas fazem o Vite escolher outra. Mantenha os processos abertos enquanto usa a IDE; Ctrl+C encerra.

## O que está implementado

- **Abrir pasta** diretamente: seleciona uma pasta do Windows e edita seus arquivos originais, sem template e sem cópia. A estrutura pode ser Python, Node, Next, Vue, Java, .NET, Go, Rust ou outra. A execução depende das ferramentas instaladas.
- **Novo projeto** começa com uma pasta vazia; templates React e HTML são opcionais. O workspace identifica ferramentas pelos arquivos encontrados, sem impor um framework.

- Projetos React/TypeScript e HTML/CSS/JavaScript; renomear, duplicar e lixeira recuperável.
- Importação ZIP e cópia de pasta local, sem alterar a pasta original.
- Arquivos reais no disco, árvore de pastas, criar, renomear/mover por caminho e excluir arquivos.
- Monaco empacotado localmente, sem CDN: abas, sugestões TypeScript/React, busca, formatação pelo menu e editor dividido.
- Destaque de sintaxe adicional para Python, PowerShell, Shell, SQL, Java, C++, C#, Go, Rust, XML, YAML e Dockerfile. Isso não instala seus compiladores ou servidores de linguagem.
- Busca literal no projeto e substituição global com checkpoint; abrir arquivos rapidamente e paleta de comandos.
- Preferências de fonte, indentação, quebra de linha, minimapa e tema do Monaco; painel de diagnósticos.
- Autosave serializado, revisão para detectar conflitos e sincronização de alterações externas a cada 2,5 segundos quando não há edições pendentes.
- Dois terminais nativos por projeto, xterm, resize, Ctrl+C, reconexão e execução de scripts npm.
- Git real: inicializar, status/branch, diff, preparar/retirar arquivos, commit e histórico local.
- Preview rápido esbuild em iframe separado: dispositivos, console, erros e nova aba.
- Checkpoints (até 30), comparação e restauração; ZIP do código atual.
- IA opcional com streaming, interrupção, Ask/Plan/Agent/Edit, revisão de diff antes de aplicar e checkpoint.
- Configuração de IA pela interface, lista de modelos quando o endpoint oferece `/models`, conversas no disco.

## Usar o terminal e executar um projeto

1. Crie um projeto React ou importe seu código.
2. Clique no ícone Terminal e leia a mensagem de confiança. O terminal executa comandos reais com suas permissões no computador.
   O painel também aparece ao entrar no editor. O botão **Terminal** no topo e Ctrl+` alternam sua visibilidade. A linguagem do arquivo ativo aparece na barra inferior, ao lado de UTF-8.
3. Clique em **Confiar neste projeto e abrir terminal**.
4. **Instalar dependências** executa `npm install`; dependências podem executar scripts. A primeira instalação usa internet.
5. Escolha `dev` em **Executar script**. Projetos React novos usam Vite. Abra no navegador a URL que aparecer no terminal.
6. Para interromper, use Ctrl+C ou **Interromper**. Fechar a aba do terminal encerra sua sessão. Ocultar o painel mantém a sessão aberta; sair do editor encerra os terminais.

Você também pode digitar `npm run build`, `git status`, `python arquivo.py` ou outros comandos das ferramentas instaladas. O terminal começa em `.code-makers/workspaces/<id>`, mas **não é um sandbox**: comandos podem acessar outros locais do computador. O botão **Revogar confiança** fecha os terminais do projeto e bloqueia operações de escrita do painel Git.

O preview rápido e o servidor Vite do projeto são diferentes: o preview embutido aceita React, React DOM e Lucide da IDE; scripts npm executam seu projeto real e suas dependências instaladas. Plugins Vite, bibliotecas adicionais, processos Node e hot reload completo devem usar o terminal/servidor do projeto.

Projetos React criados na versão anterior podem ter `react-scripts` no package.json. Eles são preservados; projetos novos usam Vite.

## Atalhos

| Atalho | Ação |
| --- | --- |
| Ctrl+S | Salvar / tentar novamente |
| Ctrl+P | Abrir arquivo |
| Ctrl+Shift+P | Paleta de comandos |
| Ctrl+Shift+F | Buscar no projeto |
| Ctrl+` | Alternar terminal |
| Ctrl+Enter no assistente | Enviar mensagem |

O botão `◫` divide o editor; escolha o arquivo na segunda coluna. Use o menu de contexto do Monaco para formatar, localizar símbolos e outras ações disponíveis para a linguagem.

## Git

Ative a confiança no terminal e abra o ícone Git. Inicialize o repositório, prepare cada arquivo com **+ Preparar**, informe a mensagem e crie o commit. Se não houver identidade Git configurada, preencha nome e e-mail na seção opcional; essa identidade vale apenas para o commit e não altera a configuração global.

O painel mostra até 20 commits locais. Não configura remotos nem faz push. Repositórios temporários dos testes ficam em `tests/.tmp`, nunca na raiz da IDE.

## Seus dados

| Local | Conteúdo |
| --- | --- |
| `.code-makers/workspaces/<id>` | Código real e dependências instaladas do projeto |
| `.code-makers/projects/<id>.json` | Metadados, revisão, confiança e checkpoints |
| `.code-makers/projects/conversations/<id>.json` | Conversas persistidas |
| `.code-makers/projects/ai-config.json` | Configuração da IA e eventual chave local |
| Armazenamento do navegador | Preferências do editor/layout e cópia da conversa |

Copie `.code-makers` para fazer backup completo. Uma chave configurada fica em texto no arquivo local, portanto não compartilhe essa pasta. O ZIP exporta o código de texto, sem histórico, credenciais ou node_modules.

Para workspaces abertos por **Abrir pasta**, os arquivos ficam no diretório original, indicado no editor. Faça backup também dessa pasta: `.code-makers` guarda apenas o registro do workspace e os snapshots de texto. **Importar pasta local** continua sendo uma operação separada que cria uma cópia. Remover um workspace da lista/lixeira não exclui sua pasta original.

Projetos antigos guardados só em JSON são materializados no disco ao abrir. Arquivos editados pelo terminal ou por outro programa são reconciliados com um checkpoint anterior. A IDE ignora dependências, `.git`, builds, `.env`, arquivos binários conhecidos e links simbólicos.

Evite editar o mesmo projeto em duas abas simultaneamente. Se aparecer conflito, suas edições permanecem no editor: exporte ZIP antes de recarregar. **Tentar salvar** não sobrescreve silenciosamente a revisão externa.

## IA local

Nenhum modelo foi instalado ou baixado automaticamente. Sem endpoint e modelo configurados, a IA fica desabilitada.

No assistente, abra **Configurar modelo de IA**. Para um Ollama instalado e em execução, use:

```text
Endpoint: http://127.0.0.1:11434/v1
Modelo: nome exato de um modelo que você já instalou
Chave: vazia para o servidor local padrão
```

Salve e, se desejar, use **Listar modelos do endpoint salvo**. Mudanças pela interface entram em vigor sem reiniciar. Compatibilidade documentada em [Ollama: OpenAI compatibility](https://github.com/ollama/ollama/blob/main/docs/api/openai-compatibility.mdx).

Também é possível configurar inicialmente `.env.local` com `AI_BASE_URL`, `AI_MODEL` e `AI_API_KEY`. Reinicie após alterar esse arquivo. Uma configuração salva na interface prevalece sobre essas variáveis. Não use prefixo `VITE_` para segredos.

Um endpoint remoto compatível pode ser configurado por escolha do usuário; nesse caso, o contexto do código e as mensagens serão enviados a esse provedor. Para processamento local, mantenha o endpoint no computador.

Ask explica; Plan prepara um plano; Agent propõe vários arquivos; Edit propõe apenas o arquivo ativo. O diff precisa ser aprovado para alterar o código. A IA não executa comandos, instala dependências ou testa automaticamente. Os testes de streaming usam um endpoint de teste e não demonstram qualidade de inferência de um modelo.

## Limites reais

- Esta é uma IDE própria com Monaco e recursos de desenvolvimento. Não inclui o extension host do VS Code, compatibilidade VSIX, Marketplace, debugger integrado ou todos os recursos do VS Code. [FAQ oficial do Monaco](https://github.com/microsoft/monaco-editor/blob/main/README.md) explica a diferença em relação às extensões.
- Workspace: até 1000 arquivos de texto e 10 MB; ZIP: até 300 arquivos e 5 MB descompactados. Binários e credenciais não aparecem no editor/IA. Pasta importada é uma cópia, não um vínculo com o diretório original.
- Workspaces livres não usam o preview React embutido: execute o servidor/compilador do próprio projeto pelo terminal. Abrir uma estrutura não instala automaticamente suas ferramentas ou adiciona todos os servidores de linguagem.
- Renomear/mover um arquivo não reescreve imports automaticamente. Pastas vazias não aparecem na árvore.
- Diagnósticos do painel são do Monaco; não substituem `npm run build`, testes, ESLint ou ferramentas de outras linguagens.
- Preview rápido recompila e recarrega o iframe, sem preservar estado React. Código do preview usa `sandbox="allow-scripts"`; o terminal é execução nativa e tem permissões normais do usuário.
- Não há publicação automática, contas, pagamentos, deploy, agente autônomo ou sincronização remota.
- API escuta apenas loopback, valida Host/Origin e não deve ser exposta na rede.

## Verificar

```powershell
npm test
npm run build
npm audit
```

Os testes cobrem disco/revisões/checkpoints, proteção de caminhos, importação, PowerShell PTY, política WebSocket, Git real, build do template Vite, preview React/HTML, autosave, ZIP, busca/substituição, propostas e streaming/configuração/conversas de IA.

O Monaco inclui workers grandes; o aviso de tamanho do bundle não significa falha de build. Nesta sessão não havia navegador disponível na ferramenta de automação, portanto a inspeção visual do layout não foi realizada.

Para servir a versão compilada: `npm run server` em um terminal e `npm run preview` em outro. Ambos devem permanecer abertos.
