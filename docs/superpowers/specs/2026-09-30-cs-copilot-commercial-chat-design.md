# CS Copilot Commercial Chat Design

## Objective

Make the CS Copilot behave like an experienced sales assistant for digital services while giving long analyses, scripts, and ready-to-send messages enough room to be read and reused comfortably.

The change must preserve current conversations, CRM actions, commercial memory, and long-message context management. It must not rebuild the rest of Code Sellers or add a new chat backend.

## Current Problems And Root Causes

1. The system prompt contains useful sales rules, but the default `none` playbook explicitly turns the conversation into a free mode. That weakens the core sales method and permits generic advice.
2. Structured analysis is requested only when a CRM lead is selected. A pasted conversation in the general chat receives free Markdown, so the interface cannot reliably distinguish analysis from a ready-to-send message.
3. `LeadAnalysisCard` is rendered only when both `contact` and `message.analysis` exist. The highlighted response block and CRM actions are therefore coupled even though only the CRM actions actually require a contact.
4. The conversation and composer are constrained to `max-w-3xl`. The 270 px conversation sidebar and 300 px lead panel are fixed on desktop, reducing the useful chat width further.
5. Existing quick prompts focus on pipeline administration rather than the most common conversation workflows requested for the Copilot.
6. The composer already supports long text, automatic growth, Enter, and Shift+Enter, and the Edge Function already condenses long context. These working behaviors should be preserved rather than replaced.

## Recommended Architecture

Extend the existing structured response contract and renderer. Do not create a second endpoint or a parallel conversation model.

The AI will emit a `<commercial_response>` JSON block for every request concerning a lead, pasted sales conversation, objection, reply, or follow-up. The parser will continue accepting the legacy `<lead_analysis>` block so saved conversations and transitional responses remain compatible. Both formats are stored in the existing `autopilot_messages.analysis` JSONB column.

General questions, CRM administration, and non-sales requests may remain normal Markdown. This keeps the Copilot useful outside a specific negotiation without forcing every answer into a sales template.

## Commercial Response Contract

The structured payload will use the existing analysis fields and add presentation guidance:

```ts
type CommercialResponseMode = 'quick_reply' | 'analysis' | 'objection' | 'follow_up'

interface LeadAnalysis {
  mode: CommercialResponseMode
  interest: 'Baixo' | 'Moderado' | 'Alto' | 'Indeterminado'
  stage: string
  evidence: string
  objection: string
  risk: string
  summary: string
  next_action: string
  reason: string
  strategy: string
  suggested_message: string
  next_step: string
  follow_up_at: string | null
}
```

The parser will supply safe defaults for new fields when reading old payloads. No database migration is required.

The modes control presentation:

- `quick_reply`: show the ready message first, followed by one short strategy line.
- `analysis`: show situation, lead reading, risk, next action, short rationale, ready message, and next step.
- `objection`: show objection reading, response objective, ready response, and next step.
- `follow_up`: show elapsed/context reading, exact action timing, ready message, and the next follow-up rule.

Unknown information must be represented as `Indeterminado`, `Não identificado`, or `Não informado`; it must never be invented.

## Sales Intelligence

The base methodology applies even when no optional playbook is selected:

`generate interest -> present preview when relevant -> invite to a meeting when useful -> diagnose need -> establish value -> discuss price -> follow up -> close`

Optional playbooks alter emphasis; they do not enable or disable sales judgment.

The system prompt will explicitly prioritize sites, landing pages, systems, automation, SaaS, design, marketing, development, and related digital services. It will still adapt when CRM data identifies another legitimate service.

The prompt will distinguish user intent before formatting the answer:

- Short reply requests prioritize the message and avoid long analysis.
- Detailed analysis requests use the complete structure.
- Objections identify likely causes without claiming certainty.
- Follow-ups use the actual elapsed time and last known event.

Meeting suggestions remain optional. A refusal of a meeting overrides meeting-oriented playbooks. A repeated price request receives a direct answer when a real price exists. Explicit lack of interest is respected.

Calls to action should invite useful information or offer concrete positive alternatives. Avoid default yes/no closes when a more productive open question is available.

## CRM And Conversation Context

The existing `buildAutoPilotContext`, `leadContextForAI`, commercial memory, history compaction, and long-message chunking remain the source of context.

The structured response contract also applies when there is no selected CRM lead but the user pastes a conversation. CRM-only actions such as saving a summary, scheduling a task, or opening WhatsApp are shown only when a real contact is available.

The current request remains the final literal user message sent to the provider. Earlier long sections may be condensed, but refusal of meetings, stated prices, timing, objections, and commitments must be preserved.

## Interface

### Conversation Area

Increase the readable conversation and composer width from `max-w-3xl` to a shared maximum near 1024 px. Assistant responses use the full readable width; user bubbles remain narrower for conversational distinction.

Avoid nesting the complete response inside another decorative card. The analysis sections remain an unframed layout, while only the ready-to-send message is a distinct functional block.

### Ready Message Block

The ready message block has clear copy affordance and text selection. Its primary actions are:

- Copy message
- Generate another
- Make shorter
- Make more natural
- Make more professional
- Make more direct
- Explain strategy
- Use in WhatsApp when a CRM contact exists

Actions send a precise variation instruction based on the structured suggested message, never the entire analysis.

### Conversation Sidebar

On desktop, the sidebar can switch between 270 px expanded and 64 px collapsed. The collapsed state keeps the Copilot mark, new-conversation icon, and conversation icons with accessible labels/tooltips. The choice is stored in local storage. Mobile keeps the existing overlay behavior.

### Lead Panel

The lead panel remains available but gains a desktop toggle. Closing it releases the 300 px area for the conversation. Its state does not alter CRM data.

### Composer

Keep unrestricted text length, automatic growth, Enter to send, Shift+Enter for a line break, and text selection. Use a comfortable minimum height and cap growth around 240 px so the composer does not occupy half the viewport. Longer input scrolls internally.

### Welcome Actions

Replace the current generic cards with:

- Analisar conversa
- O que respondo?
- Criar follow-up
- Quebrar objeção
- Preparar reunião
- Recuperar lead
- Criar mensagem

Selecting an action seeds the composer with a useful editable scaffold. It does not spend an AI request merely to ask the user for the missing conversation.

## Error Handling And Compatibility

- Malformed structured output must not make the visible answer disappear.
- Legacy `<lead_analysis>` output and saved analysis JSON remain readable.
- Clipboard failures show the existing toast error.
- Variation controls disable while a response is being generated.
- Sidebar persistence failures fall back to expanded desktop state without breaking chat.
- CRM-only buttons are omitted when no contact is selected.

## Testing

Automated tests cover:

1. "Gostei, quanto custa?" preserves interest, recognizes a price request, and allows a meeting suggestion without hiding a known price.
2. "Não quero reunião, manda o valor." forbids another meeting push and requests a direct answer.
3. "Está caro." avoids immediate discounting and asks whether the issue is budget or perceived value using an open question.
4. A prototype sent three days ago produces a short follow-up and a later next step.
5. Long pasted conversations preserve relevant earlier facts and keep the current request last.
6. "O que eu respondo?" selects `quick_reply` and renders the ready message first.
7. "Analisa essa conversa." selects `analysis` and renders the complete commercial reading.

Browser verification covers desktop and mobile widths, sidebar collapse persistence, quick-action drafting, composer growth, ready-message copy controls, and absence of overlapping or clipped content.

## Delivery

Run focused tests after every red-green cycle, then the complete Node test suite, lint, production build, and Playwright desktop/mobile smoke checks. Commit and push the completed change to `codex/cs-copilot`, deploy the linked Vercel project to production, and verify `https://codesellers.vercel.app` returns successfully.
