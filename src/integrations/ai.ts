import type { AutoPilotContext, ProposalGenerationPayload } from '@/types'
import { supabase } from '@/lib/supabaseClient'
import { formatCurrency } from '@/utils/deals'
import { serializeContext } from '@/utils/autopilot'

// ============================================================================
// ARQUITETURA
// ============================================================================
// A chamada para api.experientiallabs.ai não pode ser feita direto do
// navegador: o provedor não envia cabeçalho Access-Control-Allow-Origin, e o
// browser bloqueia por CORS (confirmado em produção — erro "blocked by CORS
// policy" + 404 na resposta do preflight). Por isso o request passa por uma
// Supabase Edge Function (supabase/functions/ai-chat), que chama o provedor
// servidor-a-servidor (CORS não se aplica) e devolve a resposta. Bônus: a
// API key (EXPERIENTIAL_API_KEY) fica só no secret da function, nunca no
// bundle do cliente.
//
// PROVEDOR: experientiallabs.ai é um agregador/comparador de modelos de
// terceiros (não é Anthropic/OpenAI/Google diretamente) — a resposta da API
// identifica "provider":"openai", ou seja, o agregador está repassando a
// chamada para a OpenAI por trás.
// ============================================================================

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
  choices?: { message: { role: string; content: string } }[]
  error?: string
}

async function chatCompletion(messages: ChatCompletionMessage[]): Promise<string> {
  const { data, error } = await supabase.functions.invoke<ChatCompletionResponse>('ai-chat', {
    body: { messages },
  })

  if (error) {
    throw new Error(`Falha ao consultar a IA: ${error.message}`)
  }

  if (data?.error) {
    throw new Error(`Falha ao consultar a IA: ${data.error}`)
  }

  const text = data?.choices?.[0]?.message?.content

  if (!text) {
    throw new Error('A IA não retornou nenhum conteúdo de texto.')
  }

  return text
}

export async function generateProposal(payload: ProposalGenerationPayload): Promise<string> {
  return chatCompletion([{ role: 'user', content: buildProposalPrompt(payload) }])
}

// ============================================================================
// CS Copilot — assistente de IA integrado ao sistema
// ============================================================================

const AUTOPILOT_SYSTEM_PROMPT = `Você é o CS Copilot, o assistente de IA integrado ao Code Sellers.

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

// ============================================================================
// Buyers Hunter — primeira mensagem de abordagem
// ============================================================================

export interface OutreachPayload {
  business_name: string
  category: string | null
  city: string | null
  website_situation: string
  reviews: number
  rating: number | null
  offer_label: string
  user_name: string
  company_name: string | null
}

export async function generateOutreachMessage(payload: OutreachPayload): Promise<string> {
  const prompt = `Você ajuda freelancers brasileiros que vendem sites e sistemas a fazer o primeiro contato com empresas locais pelo WhatsApp.

Escreva UMA mensagem curta (no máximo 5 frases, até 600 caracteres), em português do Brasil, tom humano e respeitoso, sem parecer spam, sem emojis em excesso e sem prometer resultados.

Dados:
- Quem envia: ${payload.user_name}${payload.company_name ? ` (${payload.company_name})` : ''}
- O que oferece: ${payload.offer_label}
- Empresa: ${payload.business_name}
- Ramo: ${payload.category ?? 'não informado'}
- Cidade: ${payload.city ?? 'não informada'}
- Presença online: ${payload.website_situation}
- Avaliações públicas: ${payload.reviews}${payload.rating ? `, nota média ${payload.rating.toFixed(1)}` : ''}

Use só essas informações — não invente fatos sobre a empresa. Termine com uma pergunta simples que convide a responder. Responda apenas com o texto da mensagem, sem aspas nem comentários.`

  return (await chatCompletion([{ role: 'user', content: prompt }])).trim()
}

// ============================================================================
// Contrato de prestação de serviço
// ============================================================================

export interface ContractPayload {
  provider_name: string
  provider_company: string | null
  provider_document: string | null
  client_name: string
  client_document: string | null
  client_address: string | null
  service: string
  scope: string
  value: number | null
  payment_terms: string
  deadline: string
  support: string | null
  city: string | null
}

export async function generateContract(payload: ContractPayload): Promise<string> {
  const value = payload.value !== null ? formatCurrency(payload.value) : 'a combinar'
  const prompt = `Você redige contratos simples de prestação de serviços digitais (sites, landing pages, sistemas e automações) para freelancers brasileiros.

Escreva um CONTRATO DE PRESTAÇÃO DE SERVIÇOS em português do Brasil, em Markdown, com linguagem clara e objetiva, com as cláusulas numeradas:
1. Das partes
2. Do objeto
3. Do escopo (o que está incluído e o que não está)
4. Do prazo
5. Do valor e forma de pagamento
6. Das obrigações do contratado
7. Das obrigações do contratante (enviar conteúdos, aprovar etapas, acessos)
8. Das alterações de escopo
9. Da propriedade e entrega dos arquivos
10. Do suporte e ajustes após a entrega
11. Da rescisão
12. Do foro
Termine com local, data em branco (____/____/______) e linhas de assinatura das duas partes.

Dados (use só estes; onde faltar dado, deixe um espaço em branco "__________" para preencher):
- Contratado: ${payload.provider_name}${payload.provider_company ? ` (${payload.provider_company})` : ''}${payload.provider_document ? `, documento ${payload.provider_document}` : ''}
- Contratante: ${payload.client_name}${payload.client_document ? `, documento ${payload.client_document}` : ''}${payload.client_address ? `, endereço ${payload.client_address}` : ''}
- Serviço: ${payload.service}
- Escopo informado: ${payload.scope || 'não detalhado'}
- Valor total: ${value}
- Forma de pagamento: ${payload.payment_terms || 'a combinar'}
- Prazo de entrega: ${payload.deadline || 'a combinar'}
- Suporte/ajustes após a entrega: ${payload.support || 'não informado'}
- Cidade do foro: ${payload.city || '__________'}

Não invente valores, prazos ou dados pessoais. Não inclua comentários fora do contrato.`

  return (await chatCompletion([{ role: 'user', content: prompt }])).trim()
}
