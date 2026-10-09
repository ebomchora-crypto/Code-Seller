# Code Makers IDE local

Decisão do usuário: aplicação local, sem Supabase. Preservar React, Vite, Monaco e Zustand.

## Arquitetura
- Servidor Node em loopback; API mesma origem via proxy Vite.
- Projetos JSON em `.code-makers/projects`, gravação atômica e revisão otimista.
- Lixeira recuperável e checkpoints antes de restaurar ou aplicar mudanças de IA.
- Editor com abas e salvamento imediato no estado, seguido de persistência serializada.
- Compilador esbuild local para React e HTML/CSS/JS, com arquivos virtuais e lista de bibliotecas permitidas. Execução somente no navegador em iframe sandbox, sem executar comandos no computador.
- IA opcional via endpoint compatível com chat completions; credenciais apenas no servidor.

## Etapas e aceite
1. Reproduzir build quebrado; corrigir configuração. Build deve passar.
2. API local: CRUD, isolamento de caminhos, revisão, histórico, lixeira. Testes em disco real.
3. Dashboard/editor: criar, abrir, renomear, duplicar, excluir/restaurar, editar arquivos, autosave. Testes de regressão de salvamento e UI.
4. Preview real e console com compilação local; exportação/importação ZIP.
5. IA Ask/Plan e propostas de arquivos com revisão e aprovação; falha clara sem configuração.
6. Verificar testes/build, iniciar aplicação e documentar uso e limites.

GitHub, publicação, cobrança e execução Node arbitrária ficam fora deste MVP local. Não mostrar botões que prometam essas funcionalidades.
