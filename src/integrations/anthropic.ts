import type { AutoPilotContext, ProposalGenerationPayload } from '@/types'
import { formatCurrency } from '@/utils/deals'
import { serializeContext } from '@/utils/autopilot'

// ============================================================================
// ATENÇÃO — SEGURANÇA
// ============================================================================
// Esta integração chama a API da Anthropic diretamente do navegador usando
// VITE_ANTHROPIC_API_KEY. Qualquer variável VITE_* é embutida no bundle e fica
// visível a qualquer pessoa que inspecionar o código do site.
//
// Isso é aceitável APENAS para este MVP/desenvolvimento local. Antes de colocar
// o Code Sellers em produção, esta chamada DEVE ser movida para uma Supabase
// Edge Function (ou outro backend), que guarda a chave como secret do lado do
// servidor e é chamada pelo frontend autenticado — nunca a chave da Anthropic
// diretamente no cliente.
// ============================================================================

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-5'

function buildPrompt(payload: ProposalGenerationPayload): string {
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

interface AnthropicResponse {
  content: { type: string; text?: string }[]
}

export async function generateProposal(payload: ProposalGenerationPayload): Promise<string> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

  if (!apiKey) {
    throw new Error(
      'VITE_ANTHROPIC_API_KEY não configurada. Adicione a chave no arquivo .env para usar a geração de propostas com IA.',
    )
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2000,
      messages: [{ role: 'user', content: buildPrompt(payload) }],
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Falha ao gerar proposta (${response.status}): ${errorBody}`)
  }

  const data = (await response.json()) as AnthropicResponse
  const text = data.content.find((block) => block.type === 'text')?.text

  if (!text) {
    throw new Error('A IA não retornou nenhum conteúdo de texto.')
  }

  return text
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

const AUTOPILOT_MODEL = 'claude-sonnet-5'

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
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

  if (!apiKey) {
    throw new Error(
      'VITE_ANTHROPIC_API_KEY não configurada. Adicione a chave no arquivo .env para usar o AutoPilot.',
    )
  }

  const systemPrompt = AUTOPILOT_SYSTEM_PROMPT.replace('{context}', serializeContext(context))

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: AUTOPILOT_MODEL,
      max_tokens: 2000,
      system: systemPrompt,
      // Histórico enviado à API: apenas role e content limpo — sem actions
      // nem qualquer outro metadado.
      messages: [...messages, { role: 'user', content: userMessage }],
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Falha ao consultar o AutoPilot (${response.status}): ${errorBody}`)
  }

  const data = (await response.json()) as AnthropicResponse
  const text = data.content.find((block) => block.type === 'text')?.text

  if (!text) {
    throw new Error('O AutoPilot não retornou nenhum conteúdo de texto.')
  }

  return text
}
