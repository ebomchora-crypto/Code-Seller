# Biblioteca Comercial Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar uma Biblioteca Comercial utilizavel na Area do Aluno, integrada ao CRM e CS Copilot.

**Architecture:** Catalogo tipado e estatico, organizado por categoria. Estado do usuario em `academy_progress`; IA pela Edge Function existente; Copilot recebe apenas ID validado do material e ID opcional de lead.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind, Supabase, Node test, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-29-commercial-library-design.md`

## Global Constraints

- Preservar Kit de execucao, CRM e autenticacao.
- Nao inventar preco, urgencia, escassez ou interesse.
- Evitar nova tabela e novas dependencias.

---

### Task 1: Catalogo e busca

**Files:** Create `src/data/commercial-library/{types,index,scripts,objections,follow-ups,copies,prompts,universal}.ts`; test `tests/commercial-library.test.mjs`.

**Interfaces:** `CommercialMaterial` com `id`, `category`, `title`, `stage`, `tags`, `strategy`, `body` e campos opcionais de objecao. Exportar `COMMERCIAL_MATERIALS`, `getCommercialMaterial(id)` e `searchCommercialMaterials(query, category, stage)`.

- [ ] Escrever teste de unicidade, categorias, cenarios obrigatorios, busca sem acento e ausencia de conteudo vazio.
- [ ] Executar `node --test tests/commercial-library.test.mjs` e observar falha.
- [ ] Implementar conteudo por categoria e funcoes puras.
- [ ] Executar teste novamente, ajustar ate passar e revisar texto comercial.

### Task 2: Favoritos e pagina

**Files:** Modify `src/pages/academy/index.tsx`, `src/router/index.tsx`; create `src/pages/academy/library.tsx` e `src/hooks/useCommercialFavorites.ts`; use `src/services/supabase/academy.ts`.

**Interfaces:** IDs salvos como `favorite:commercial:<id>`, carregados por `getAcademyProgress` e alterados por `setAcademyItems`. Rota `/aluno/biblioteca`.

- [ ] Testar chave de favorito e estados de erro/carregamento por funcoes isoladas.
- [ ] Implementar link na Area do Aluno e pagina com categorias, busca, filtros, detalhe, copia e favorito.
- [ ] Verificar desktop/mobile, navegacao por teclado e regressao do Kit.

### Task 3: IA e Copilot

**Files:** Modify `src/integrations/ai.ts`, `src/pages/autopilot/index.tsx`, `src/pages/academy/library.tsx`; create utilitario de prompt para material e testes.

**Interfaces:** `personalizeCommercialMaterial(input): Promise<string>` chama `ai-chat`; `commercialMaterialPrompt(material)` fornece tecnica ao `useAutoPilot`; URL leva somente IDs.

- [ ] Testar construcao do prompt, IDs invalidos e ausencia de dados de lead na URL.
- [ ] Implementar seletor de lead, personalizacao com controles e resultado copiavel.
- [ ] Implementar handoff Copilot e confirmar uso do snapshot do lead.
- [ ] Verificar erro da IA e impedir envios duplicados.

### Task 4: Verificacao e publicacao

**Files:** somente os arquivos acima e ajustes de teste.

- [ ] Rodar `npm run build`, `npm run lint` e testes do projeto; corrigir falhas introduzidas.
- [ ] Testar fluxo real e capturas desktop/mobile.
- [ ] Revisar diff, commitar, enviar branch e publicar no projeto Vercel existente.
- [ ] Verificar que `https://codesellers.vercel.app` serve a nova Biblioteca.
