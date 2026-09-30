# CS Copilot Commercial Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make CS Copilot produce practical, structured sales guidance for CRM and pasted conversations while giving the chat a wider, collapsible, responsive interface.

**Architecture:** Extend the existing JSONB analysis contract with a response mode and presentation fields, add deterministic request guidance before the model call, and render the same structured response with or without a CRM contact. Keep the current Edge Function, history, memory, and context compression; update only the prompt contract and client presentation.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Tailwind CSS, Supabase Edge Functions, Node test runner, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-30-cs-copilot-commercial-chat-design.md`

## Global Constraints

- Preserve current conversations, CRM actions, commercial memory, and long-message context management.
- Do not add a database migration or a second chat backend.
- Meeting suggestions are optional and must stop after a clear refusal.
- Never invent prices, interest, urgency, scarcity, budget, timing, or CRM facts.
- Keep unrestricted composer input, Enter to send, and Shift+Enter for a line break.
- Use test-first red-green-refactor for every behavior change.

---

### Task 1: Commercial Response Contract And Parser

**Files:**
- Modify: `src/types/autopilot.ts`
- Modify: `src/utils/copilotCRM.ts`
- Modify: `src/utils/autopilot.ts`
- Modify: `tests/autopilot-parser.test.mjs`
- Modify: `src/utils/copilotCRM.test.mjs`

**Interfaces:**
- Produces: `CommercialResponseMode`, extended `LeadAnalysis`, backward-compatible `parseLeadAnalysis(value)`, and `parseAutoPilotResponse(rawContent)` accepting `<commercial_response>` and `<lead_analysis>`.
- Consumes: Existing `autopilot_messages.analysis` JSONB storage without schema changes.

- [ ] **Step 1: Write failing parser and compatibility tests**

```js
test('parses a commercial response with presentation fields', () => {
  const result = parseAutoPilotResponse('<commercial_response>{"mode":"quick_reply","interest":"Moderado","stage":"Interesse","evidence":"Perguntou o preço","objection":"Não identificada","risk":"Responder sem preço","summary":"O lead gostou e perguntou o valor.","next_action":"Responder à pergunta","reason":"Evita atrito","strategy":"Informar e avançar","suggested_message":"O investimento é R$ 500.","next_step":"Aguardar a resposta","follow_up_at":null}</commercial_response>')
  assert.equal(result.analysis.mode, 'quick_reply')
  assert.equal(result.analysis.risk, 'Responder sem preço')
})

test('legacy analysis receives safe defaults', () => {
  const result = parseLeadAnalysis({ interest: 'Alto', stage: 'Negociação', evidence: 'Pediu proposta', objection: '', summary: 'Resumo', next_action: 'Enviar', suggested_message: 'Mensagem', follow_up_at: null })
  assert.equal(result.mode, 'analysis')
  assert.equal(result.risk, 'Não identificado')
})
```

- [ ] **Step 2: Run focused tests and verify expected failures**

Run: `node --test tests/autopilot-parser.test.mjs src/utils/copilotCRM.test.mjs`

Expected: FAIL because the new tag and fields are not recognized.

- [ ] **Step 3: Extend types, validation, and tag parsing minimally**

```ts
export type CommercialResponseMode = 'quick_reply' | 'analysis' | 'objection' | 'follow_up'

const mode = ['quick_reply', 'analysis', 'objection', 'follow_up'].includes(String(row.mode))
  ? row.mode as CommercialResponseMode
  : 'analysis'
```

Parse both tags with one regular expression, preserve readable content around malformed blocks, and keep the action marker flow unchanged.

- [ ] **Step 4: Run focused tests and verify green**

Run: `node --test tests/autopilot-parser.test.mjs src/utils/copilotCRM.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit the contract change**

```bash
git add src/types/autopilot.ts src/utils/copilotCRM.ts src/utils/autopilot.ts tests/autopilot-parser.test.mjs src/utils/copilotCRM.test.mjs
git commit -m "feat: extend Copilot commercial response contract"
```

### Task 2: Request Intent And Commercial Prompt

**Files:**
- Create: `src/utils/copilotGuidance.ts`
- Create: `tests/copilot-commercial-guidance.test.mjs`
- Modify: `src/integrations/ai.ts`
- Modify: `tests/copilot-edge.test.mjs`

**Interfaces:**
- Produces: `inferCommercialResponseMode(message: string): CommercialResponseMode` and `commercialRequestGuidance(message: string): string`.
- Consumes: `CommercialResponseMode` from Task 1 and the existing `sendAutoPilotMessage` flow.

- [ ] **Step 1: Write failing tests for all seven required scenarios**

```js
test('a direct reply request is message-first', () => {
  assert.equal(inferCommercialResponseMode('O que eu respondo?'), 'quick_reply')
})

test('a detailed conversation request uses full analysis', () => {
  assert.equal(inferCommercialResponseMode('Analisa essa conversa detalhadamente'), 'analysis')
})

test('meeting refusal guidance forbids another call push', () => {
  assert.match(commercialRequestGuidance('Não quero reunião, manda o valor.'), /não insista em reunião/i)
  assert.match(commercialRequestGuidance('Não quero reunião, manda o valor.'), /responda.*preço/i)
})

test('price objection guidance avoids immediate discount', () => {
  assert.match(commercialRequestGuidance('Está caro.'), /não ofereça desconto/i)
})
```

Add equivalent assertions for first price request, prototype silence after three days, and long-history analysis.

- [ ] **Step 2: Run the new test and verify expected failure**

Run: `node --test tests/copilot-commercial-guidance.test.mjs`

Expected: FAIL because `copilotGuidance.ts` does not exist.

- [ ] **Step 3: Implement intent inference and guidance**

Use accent-insensitive matching with quick-reply intent taking priority over the quoted objection. The guidance states the requested output mode but leaves factual interpretation to the model.

- [ ] **Step 4: Replace the generic system prompt contract**

Update `AUTOPILOT_SYSTEM_PROMPT` so the base methodology always applies, optional playbooks only change emphasis, digital services are the primary domain, and every sales request emits `<commercial_response>` with all contract fields. Append `commercialRequestGuidance(userMessage)` to the system message while keeping the literal user request last.

- [ ] **Step 5: Run guidance and Edge Function tests**

Run: `node --test tests/copilot-commercial-guidance.test.mjs tests/copilot-edge.test.mjs`

Expected: PASS, including the long-message and current-request-last assertions.

- [ ] **Step 6: Commit prompt behavior**

```bash
git add src/utils/copilotGuidance.ts tests/copilot-commercial-guidance.test.mjs src/integrations/ai.ts tests/copilot-edge.test.mjs
git commit -m "feat: make Copilot sales guidance intent-aware"
```

### Task 3: Adaptive Commercial Response Renderer

**Files:**
- Modify: `src/components/autopilot/LeadAnalysisCard.tsx`
- Modify: `src/components/autopilot/MessageBubble.tsx`
- Create: `src/components/autopilot/commercialResponseView.ts`
- Create: `src/components/autopilot/commercialResponseView.test.mjs`

**Interfaces:**
- Produces: `commercialResponseSections(analysis: LeadAnalysis)` returning ordered visible section keys.
- Consumes: Extended `LeadAnalysis`; optional `Contact` only for CRM actions and WhatsApp.

- [ ] **Step 1: Write failing tests for adaptive section order**

```js
test('quick replies put the ready message first', () => {
  assert.deepEqual(commercialResponseSections({ ...fixture, mode: 'quick_reply' }), ['message', 'strategy'])
})

test('analysis includes the complete sales reading', () => {
  assert.deepEqual(commercialResponseSections({ ...fixture, mode: 'analysis' }), ['situation', 'reading', 'action', 'reason', 'message', 'next_step'])
})
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `node --test src/components/autopilot/commercialResponseView.test.mjs`

Expected: FAIL because the view helper does not exist.

- [ ] **Step 3: Implement the view helper and renderer**

Make `contact` optional. Render the analysis whenever `message.analysis` exists. Keep the overall response unframed and put only `suggested_message` in a selectable functional block with a clearly labeled copy action.

- [ ] **Step 4: Add all working response actions**

Use the structured suggested message for `Gerar outra`, `Mais curta`, `Mais natural`, `Mais profissional`, and `Mais direta`. `Explicar estratégia` requests only a short explanation. Show `Usar no WhatsApp` and CRM save/schedule actions only when `contact` exists.

- [ ] **Step 5: Run renderer tests and production build**

Run: `node --test src/components/autopilot/commercialResponseView.test.mjs && npm run build`

Expected: PASS.

- [ ] **Step 6: Commit the renderer**

```bash
git add src/components/autopilot/LeadAnalysisCard.tsx src/components/autopilot/MessageBubble.tsx src/components/autopilot/commercialResponseView.ts src/components/autopilot/commercialResponseView.test.mjs
git commit -m "feat: render adaptive Copilot sales responses"
```

### Task 4: Welcome Modes And Composer

**Files:**
- Modify: `src/components/autopilot/QuickPrompts.tsx`
- Modify: `src/components/autopilot/CopilotComposer.tsx`
- Modify: `src/components/autopilot/composer.utils.ts`
- Modify: `src/components/autopilot/composer.test.mjs`
- Modify: `src/types/autopilot.ts`

**Interfaces:**
- Produces: Seven `QuickPrompt` entries with editable `draft` text and `applyQuickPromptDraft(current, draft)`.
- Consumes: Existing composer submission and keyboard behavior.

- [ ] **Step 1: Write failing tests for quick-mode drafts and unrestricted input**

```js
test('quick action replaces an empty composer with its draft', () => {
  assert.equal(applyQuickPromptDraft('', 'Cole a conversa abaixo:\n\n'), 'Cole a conversa abaixo:\n\n')
})

test('long input is not truncated', () => {
  const long = 'contexto '.repeat(20000)
  assert.equal(getChatSubmission(long), long.trim())
})
```

- [ ] **Step 2: Run composer tests and verify failure**

Run: `node --test src/components/autopilot/composer.test.mjs`

Expected: FAIL because the draft helper does not exist.

- [ ] **Step 3: Implement seven editable quick actions**

Replace pipeline cards with `Analisar conversa`, `O que respondo?`, `Criar follow-up`, `Quebrar objeção`, `Preparar reunião`, `Recuperar lead`, and `Criar mensagem`. Clicking a card fills and focuses the composer; it does not send automatically.

- [ ] **Step 4: Cap composer growth without limiting content**

Keep the existing minimum heights and submission behavior. Change only the visual cap from 360 px to 240 px and preserve internal scrolling for additional text.

- [ ] **Step 5: Run tests and build**

Run: `node --test src/components/autopilot/composer.test.mjs && npm run build`

Expected: PASS.

- [ ] **Step 6: Commit welcome and composer changes**

```bash
git add src/components/autopilot/QuickPrompts.tsx src/components/autopilot/CopilotComposer.tsx src/components/autopilot/composer.utils.ts src/components/autopilot/composer.test.mjs src/types/autopilot.ts
git commit -m "feat: add Copilot sales workflow starters"
```

### Task 5: Wide Chat And Persistent Collapsible Panels

**Files:**
- Create: `src/utils/copilotLayout.ts`
- Create: `src/utils/copilotLayout.test.mjs`
- Modify: `src/pages/autopilot/index.tsx`
- Modify: `src/components/autopilot/ConversationSidebar.tsx`
- Modify: `src/components/autopilot/MessageList.tsx`
- Modify: `src/components/autopilot/MessageInput.tsx`

**Interfaces:**
- Produces: `readCopilotSidebarCollapsed(storage)` and `writeCopilotSidebarCollapsed(storage, value)` using key `cs-copilot:sidebar-collapsed`.
- Consumes: Browser `localStorage` when available and current mobile overlay state.

- [ ] **Step 1: Write failing persistence tests**

```js
test('sidebar preference round-trips through storage', () => {
  const storage = new MapStorage()
  writeCopilotSidebarCollapsed(storage, true)
  assert.equal(readCopilotSidebarCollapsed(storage), true)
})
```

- [ ] **Step 2: Run the layout utility test and verify failure**

Run: `node --test src/utils/copilotLayout.test.mjs`

Expected: FAIL because the layout utility does not exist.

- [ ] **Step 3: Implement persistent desktop collapse**

Use 270 px expanded and 64 px collapsed widths. Keep icon buttons accessible with labels and titles. Preserve the current mobile overlay and deletion confirmation.

- [ ] **Step 4: Make the lead panel toggle work on desktop**

Remove the unconditional `xl:block` behavior. The existing `leadOpen` state controls desktop and mobile visibility, and the contact header toggle remains visible on desktop.

- [ ] **Step 5: Widen conversation and composer**

Replace `max-w-3xl` with the same `max-w-5xl` constraint in `MessageList` and `MessageInput`, with responsive horizontal padding. Keep assistant content unframed and user bubbles bounded.

- [ ] **Step 6: Run unit tests and build**

Run: `node --test src/utils/copilotLayout.test.mjs && npm run build`

Expected: PASS.

- [ ] **Step 7: Commit layout changes**

```bash
git add src/utils/copilotLayout.ts src/utils/copilotLayout.test.mjs src/pages/autopilot/index.tsx src/components/autopilot/ConversationSidebar.tsx src/components/autopilot/MessageList.tsx src/components/autopilot/MessageInput.tsx
git commit -m "feat: give Copilot chat more workspace"
```

### Task 6: Browser Verification And Production Delivery

**Files:**
- Create: `tests/copilot-browser-smoke.mjs`
- Modify: `tests/mock-crm.ts`

**Interfaces:**
- Consumes: The complete Copilot UI from Tasks 1-5.
- Produces: Repeatable desktop/mobile visual and interaction smoke coverage.

- [ ] **Step 1: Write a browser smoke test before final UI adjustments**

Add one saved general conversation containing a `quick_reply` assistant analysis fixture. Cover 1440x900 and 390x844 viewports. Assert the seven quick actions, composer draft seeding, desktop sidebar width change and local-storage persistence, ready-message controls, composer height cap, and no horizontal overflow.

- [ ] **Step 2: Run the browser test and verify any uncovered UI failure**

Run the isolated Vite smoke entry and then `node tests/copilot-browser-smoke.mjs`.

Expected: Initial failure on any missing selector or layout behavior; fix the production component, not the assertion.

- [ ] **Step 3: Run all verification**

```bash
node --test tests/*.test.mjs src/utils/*.test.mjs src/components/autopilot/*.test.mjs
npm run lint
npm run build
git diff --check
```

Expected: Tests and build pass. Lint has no new warnings in changed files.

- [ ] **Step 4: Review changed files against the seven mandatory scenarios**

Confirm that each scenario has a focused assertion and that no UI action references the full analysis when it should reference only `suggested_message`.

- [ ] **Step 5: Commit browser coverage**

```bash
git add tests/copilot-browser-smoke.mjs tests/mock-crm.ts
git commit -m "test: cover Copilot commercial chat workflows"
```

- [ ] **Step 6: Push and deploy production**

```bash
git push origin codex/cs-copilot
vercel deploy --prebuilt --prod --yes
```

- [ ] **Step 7: Verify production**

Inspect the returned deployment for `READY`, confirm the `https://codesellers.vercel.app` alias, and request the production URL expecting HTTP 200.
