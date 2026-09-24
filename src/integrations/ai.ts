import type { AutoPilotContext, ProposalGenerationPayload } from '@/types'
import { formatCurrency } from '@/utils/deals'
import { serializeContext } from '@/utils/autopilot'

// ============================================================================
// ATENÇÃO — SEGURANÇA
// ============================================================================
// Esta integração chama a API do provedor diretamente do navegador usando
// VITE_EXPERIENTIAL_API_KEY. Qualquer variável VITE_* é embutida no bundle e
// fica visível a qualquer pessoa que inspecionar o código do site.
//
// Isso é aceitável APENAS para este MVP/desenvolvimento local. Antes de
// colocar o Code Sellers em produção, esta chamada DEVE ser movida para uma
// Supabase Edge Function (ou outro backend), que guarda a chave como secret
// do lado do servidor e é chamada pelo frontend autenticado — nunca a chave
// diretamente no cliente.
//
// PROVEDOR: experientiallabs.ai é um agregador/comparador de modelos de
// terceiros (não é Anthropic/OpenAI/Google diretamente) — a resposta da API
// identifica "provider":"openai", ou seja, o agregador está repassando a
// chamada para a OpenAI por trás. O host correto da API é `api.` (não
// `platform.`, que é o dashboard web e redireciona para /signin quando
// chamado sem sessão de navegador). Testado e confirmado em 2026-09-24:
// schema OpenAI-compatible (Bearer token + /v1/chat/completions,
// choices[0].message.content).
// ============================================================================

const AI_API_URL = 'https://api.experientiallabs.ai/v1/chat/completions'
const MODEL = 'gpt-6-luna'

function buildProposalPrompt(payload: ProposalGenerationPayload): string {
  const { deal, contact_name, contact_niche, user_name, additional_context } = payload

  return `Você é um assistente que ajuda freelancers e agências de desenvolvimento web a redigir propostas comerciais.

Gere uma proposta comercial em português, formatada em Markdown, com as seções: Apresentação, Entendimento do problema/necessidade, Solução proposta, Escopo do serviço, Investimento, Próximos passos.

Dados do negócio:
- Freelancer/agência: ${user_name}
- Cliente: ${contact_name}
- Nicho do cliente: ${contact_niche ?? 'não informado'}
- Título do negócio: ${deal.title}
- Serviço sendo vendido: ${deal.service ?? 'não especificado'}
- Valor do negócio: ${formatCurrency(deal.value)}
${additional_context ? `- Contexto adicional informado pelo usuário: ${additional_context}` : ''}

Escreva um texto pronto para ser enviado ao cliente, em tom profissional e direto, sem inventar informações que não foram fornecidas.`
}

interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatCompletionResponse {
  choices: { message: { role: string; content: string } }[]
}

function getApiKey(): string {
  const apiKey = import.meta.env.VITE_EXPERIENTIAL_API_KEY

  if (!apiKey) {
    throw new Error(
      'VITE_EXPERIENTIAL_API_KEY não configurada. Adicione a chave no arquivo .env para usar a IA.',
    )
  }

  return apiKey
}

async function chatCompletion(messages: ChatCompletionMessage[]): Promise<string> {
  const apiKey = getApiKey()

  const response = await fetch(AI_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2000,
      messages,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Falha ao consultar a IA (${response.status}): ${errorBody}`)
  }

  const data = (await response.json()) as ChatCompletionResponse
  const text = data.choices?.[0]?.message?.content

  if (!text) {
    throw new Error('A IA não retornou nenhum conteúdo de texto.')
  }

  return text
}

export async function generateProposal(payload: ProposalGenerationPayload): Promise<string> {
  return chatCompletion([{ role: 'user', content: buildProposalPrompt(payload) }])
}

// ============================================================================
// AutoPilot — assistente de IA integrado ao sistema
// ============================================================================

const AUTOPILOT_SYSTEM_PROMPT = `Você é o AutoPilot, o assistente de IA integrado ao Code Sellers.

O Code Sellers é um CRM para criadores de sites, freelancers e pequenas agências que vendem serviços digitais como sites institucionais, landing pages, lojas virtuais, sistemas e automações.

Você tem acesso aos dados do usuário e pode:
- Responder perguntas sobre o negócio
- Analisar o pipeline de vendas
- Sugerir ações e próximos passos
- Gerar mensagens de abordagem e follow-up
- Criar resumos de contatos e deals
- Propor tarefas e ações no sistema (sempre com confirmação do usuário)

DADOS DO USUÁRIO (snapshot atual):
{context}

REGRAS IMPORTANTES:
1. Seja direto, prático e focado em vendas.
2. Use os dados reais fornecidos — nunca invente informações.
3. Quando propuser uma ação no sistema (criar tarefa, atualizar deal, etc.), use o formato:
   <action>{"type": "...", "label": "...", "description": "...", "payload": {...}}</action>
4. Só proponha ações quando fizer sentido real para o contexto.
5. Nunca execute ações sem propô-las primeiro com a tag <action>.
6. Responda sempre em português brasileiro.
7. Seja conciso — evite respostas longas sem necessidade.
8. Quando o usuário pedir mensagens de abordagem ou follow-up, gere o texto completo pronto para copiar.
9. Quando analisar o pipeline, baseie-se nos dados reais fornecidos.
10. Trate o usuário como um profissional — sem patronizar ou ser excessivamente formal.
`

interface AutoPilotHistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

// TODO: implementar streaming SSE para a resposta aparecer progressivamente
// (UX mais fluida). Neste MVP a resposta é aguardada completa antes de exibir.
export async function sendAutoPilotMessage(
  messages: AutoPilotHistoryMessage[],
  context: AutoPilotContext,
  userMessage: string,
): Promise<string> {
  const systemPrompt = AUTOPILOT_SYSTEM_PROMPT.replace('{context}', serializeContext(context))

  return chatCompletion([
    { role: 'system', content: systemPrompt },
    // Histórico enviado à API: apenas role e content limpo — sem actions nem
    // qualquer outro metadado.
    ...messages,
    { role: 'user', content: userMessage },
  ])
}
