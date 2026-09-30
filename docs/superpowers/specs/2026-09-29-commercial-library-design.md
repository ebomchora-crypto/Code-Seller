# Biblioteca Comercial - design

## Objetivo

Adicionar uma biblioteca pratica na Area do Aluno para que prestadores de servicos encontrem uma resposta comercial por situacao, copiem, salvem, personalizem com IA e levem a tecnica ao CS Copilot com contexto de um lead.

## Limites e metodo

O Kit de execucao atual permanece intacto, inclusive os modelos de proposta usados em outras telas. A Biblioteca e uma secao independente em `/aluno/biblioteca`, acessivel pela pagina da Area do Aluno. O conteudo segue interesse, previa quando pertinente, reuniao quando util, diagnostico, valor, preco, follow-up e fechamento. Reuniao nao e obrigatoria; preco insistido recebe resposta direta. Nao ha urgencia ou escassez inventada, promessas de resultado ou pressuposto de interesse.

## Conteudo

Catalogo versionado no frontend, dividido por scripts, objecoes, follow-ups, copys, prompts e scripts universais, com IDs estaveis, categoria, etapa, palavras-chave, orientacao e texto copiavel. As objecoes trazem significado possivel, o que evitar, objetivo, resposta principal, curta, consultiva e proxima acao. Cobrir pelo menos as 48 situacoes de objecao explicitadas no pedido, todos os cenarios obrigatorios e os cinco prompts longos. Texto reutilizavel usa placeholders para dados nao conhecidos. Busca ignora acentos e inclui titulos, situacoes e palavras-chave. Filtros de reuniao e fechamento atravessam categorias.

## Interface e estado

Pagina responsiva com busca persistente na URL, categorias, lista de materiais e leitura detalhada sem despejar o catalogo inteiro. Cada material permite copiar, favoritar, personalizar e usar no Copilot. Favoritos sao registros `favorite:commercial:<id>` na tabela RLS `academy_progress`, usando o servico existente da Area do Aluno; falha de persistencia desfaz a mudanca e mostra erro. O aluno pode escolher um lead do CRM ou trabalhar sem lead. Nao criar sistema de templates paralelo.

## IA e Copilot

Personalizar abre formulario curto para tom, tamanho, idioma e contexto do projeto. A chamada usa a Edge Function `ai-chat` existente, com material, intencao estrategica e dados confirmados do lead quando houver; dados ausentes continuam placeholders. Resultado pode ser copiado e, apos revisao, enviado ao Copilot. `Usar no CS Copilot` navega com ID de material e ID opcional de lead; a pagina valida o ID contra o catalogo e envia a tecnica via `useAutoPilot`, que ja monta contexto e historico do lead. Nenhum texto comercial arbitrario ou dado privado vai na URL. A IA nunca envia mensagem ao cliente automaticamente.

## Qualidade

Testar integridade e cobertura do catalogo, busca e filtros, favoritos com servico real, passagem ao Copilot, fluxo de personalizacao e estados de erro. Rodar typecheck, lint, testes e verificacao visual desktop/mobile; preservar CRM, autenticacao e Kit. Publicar no projeto Vercel existente e confirmar `codesellers.vercel.app` quando verificacoes passarem.
