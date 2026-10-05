// Revisor da mensagem sugerida pelo CS Copilot. Confere a mensagem contra as
// regras da metodologia sem chamar a IA; só quando algo falha o servidor pede
// uma reescrita (uma única vez) e fica com a versão que passar melhor.

export interface ReviewProblem {
  code: string
  message: string
}

export interface ReviewOptions {
  firstContact: boolean
  mode?: string
  /** A prévia já foi (ou está sendo) enviada: a mensagem tem que puxar a reunião. */
  afterPrototype?: boolean
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

// Mesmo critério de src/utils/copilotGuidance.ts (FIRST_CONTACT): pedido de
// primeira mensagem/abordagem para um lead ou um nicho.
const FIRST_CONTACT = /primeir[oa]s? (?:contato|mensage(?:m|ns)|abordage(?:m|ns))|\babordage(?:m|ns)\b|\babordar\b|prospecta|mensage(?:m|ns) (?:de|pra|para) (?:prospec|abordar|chamar|contato)|chamar (?:no|pelo) (?:whats|zap)/

export function isFirstContactRequest(request: string): boolean {
  return FIRST_CONTACT.test(normalize(request))
}

// Mesmo critério de src/utils/copilotGuidance.ts (AFTER_PROTOTYPE / MEETING_REFUSED).
const AFTER_PROTOTYPE = /(?:depois|apos|agora que|ja) (?:de |que |da |do )?(?:eu )?(?:enviar|mandar|mandei|enviei|mostrar|mostrei|entregar|entreguei)?\s?(?:o |a |um |uma |meu |minha )?(?:prototipo|previa)|(?:enviei|mandei|mostrei|vou enviar|vou mandar|como envio|como mando|segue) (?:o |a |um |uma |meu |minha )?(?:prototipo|previa)|(?:prototipo|previa) (?:ja )?(?:enviad|mandad|pront)/
const MEETING_REFUSED = /nao (?:quero|vou|posso|consigo|quer|pode) (?:fazer )?(?:reuniao|call|ligacao)|sem (?:reuniao|call)|so por (?:aqui|mensagem|whatsapp)|(?:pode|prefiro) (?:explicar|falar) por aqui/

export function isAfterPrototypeRequest(request: string): boolean {
  const text = normalize(request)
  return AFTER_PROTOTYPE.test(text) && !FIRST_CONTACT.test(text) && !MEETING_REFUSED.test(text)
}

// Convite para conversa/reunião e pergunta de horário no fim.
const MEETING_INVITE = /reuni|conversa|call|ligac|chamada|videochamada|bate-papo|papo|minutinhos|\b1[05] ?min/
const TIME_QUESTION = /horario|que horas|hoje|amanha|semana|segunda|terca|quarta|quinta|sexta|manha|tarde|noite|quando/

// Abertura institucional ("Sou o Arthur, da...", "trabalho com sites").
const SELF_INTRO = /\b(?:sou (?:o|a)\s+\S+|me chamo|meu nome e|aqui e (?:o|a)\s+\S+|trabalho com|somos (?:uma|a|o)\b|sou (?:desenvolvedor|desenvolvedora|designer|programador|programadora|web ?designer|especialista|freelancer)|faco parte d[aeo])/
// Cara de disparo em massa.
const MASS_OUTREACH = /\b(?:estou|estamos) (?:a contactar|a entrar em contacto|entrando em contato|em contato|a falar|falando) com (?:algumas|varias|alguns|diversas|diversos|empresas|negocios)|\bvarias empresas\b|\balgumas empresas da regiao\b/
const MARKETING = [
  ['presenca digital', 'presença digital'],
  ['potenciais clientes', 'potenciais clientes'],
  ['maximizar', 'maximizar'],
  ['solucao personalizada', 'solução personalizada'],
  ['solucoes personalizadas', 'soluções personalizadas'],
  ['jornada do cliente', 'jornada do cliente'],
  ['impulsionar', 'impulsionar'],
  ['alavancar', 'alavancar'],
  ['no mundo digital', 'no mundo digital'],
  ['nos dias de hoje', 'nos dias de hoje'],
] as const
const FAKE_URGENCY = [
  ['ultimas vagas', 'últimas vagas'],
  ['so hoje', 'só hoje'],
  ['vagas limitadas', 'vagas limitadas'],
  ['nao perca', 'não perca'],
  ['por tempo limitado', 'por tempo limitado'],
  ['oferta relampago', 'oferta relâmpago'],
] as const

export const FIRST_CONTACT_MAX_LINES = 5
export const FIRST_CONTACT_MAX_CHARS = 480
export const FOLLOW_UP_MAX_CHARS = 600

function firstSentence(text: string): string {
  const trimmed = text.trim()
  const end = trimmed.search(/[.!?\n]/)
  // Saudação curta ("Oi, tudo bem?") não conta: olha a frase seguinte também.
  const head = end === -1 ? trimmed : trimmed.slice(0, end + 1)
  if (head.length < 25 && end !== -1) {
    const rest = trimmed.slice(end + 1).trim()
    const next = rest.search(/[.!?\n]/)
    return head + ' ' + (next === -1 ? rest : rest.slice(0, next + 1))
  }
  return head
}

export function reviewSuggestedMessage(message: string, options: ReviewOptions): ReviewProblem[] {
  const text = message.trim()
  if (!text) return []
  const plain = normalize(text)
  const problems: ReviewProblem[] = []

  if (options.firstContact) {
    if (SELF_INTRO.test(normalize(firstSentence(text)))) {
      problems.push({ code: 'self_intro', message: 'Começa com apresentação institucional. A primeira abordagem começa pelo negócio do lead, não por quem você é.' })
    }
    const lines = text.split('\n').filter((line) => line.trim()).length
    if (lines > FIRST_CONTACT_MAX_LINES || text.length > FIRST_CONTACT_MAX_CHARS) {
      problems.push({ code: 'too_long', message: `Longa demais para primeira abordagem (máximo ${FIRST_CONTACT_MAX_LINES} linhas curtas, cerca de ${FIRST_CONTACT_MAX_CHARS} caracteres).` })
    }
    if (!text.slice(-160).includes('?')) {
      problems.push({ code: 'no_question', message: 'Não termina com uma pergunta simples, como pedir permissão para mostrar a prévia ou um exemplo.' })
    }
  } else if (options.mode === 'follow_up' && text.length > FOLLOW_UP_MAX_CHARS) {
    problems.push({ code: 'too_long', message: `Follow-up longo demais (máximo cerca de ${FOLLOW_UP_MAX_CHARS} caracteres).` })
  } else if (options.afterPrototype && options.mode !== 'follow_up') {
    const ending = plain.slice(-180)
    if (!MEETING_INVITE.test(plain) || !ending.includes('?') || !TIME_QUESTION.test(ending)) {
      problems.push({
        code: 'no_meeting',
        message: 'Depois da prévia, a mensagem precisa convidar para uma conversa rápida sem compromisso e terminar perguntando o melhor horário (ex.: "Fica melhor hoje à tarde ou amanhã de manhã?").',
      })
    }
    if (text.length > FOLLOW_UP_MAX_CHARS) {
      problems.push({ code: 'too_long', message: `Longa demais para WhatsApp (máximo cerca de ${FOLLOW_UP_MAX_CHARS} caracteres).` })
    }
  }

  if (MASS_OUTREACH.test(plain)) {
    problems.push({ code: 'mass_outreach', message: 'Soa como disparo em massa ("estou entrando em contato com algumas empresas").' })
  }
  const marketing = MARKETING.filter(([needle]) => plain.includes(needle)).map(([, label]) => label)
  if (marketing.length) {
    problems.push({ code: 'marketing', message: `Usa marketingês: ${marketing.join(', ')}.` })
  }
  const urgency = FAKE_URGENCY.filter(([needle]) => new RegExp(`\\b${needle}\\b`).test(plain)).map(([, label]) => label)
  if (urgency.length) {
    problems.push({ code: 'fake_urgency', message: `Cria urgência ou escassez não confirmada: ${urgency.join(', ')}.` })
  }
  return problems
}

// Instrução da reescrita: corrige só o que falhou, mantendo fatos e idioma.
export function reviewRewritePrompt(problems: ReviewProblem[], options: ReviewOptions): string {
  return [
    'REVISÃO DA MENSAGEM SUGERIDA. A mensagem abaixo foi escrita por você e não passou na revisão da metodologia.',
    'Problemas encontrados:',
    ...problems.map((problem) => `- ${problem.message}`),
    'Reescreva a mensagem corrigindo esses problemas e seguindo a metodologia, o perfil comercial e o jeito de escrever do usuário.',
    options.firstContact
      ? `Primeira abordagem: comece pelo negócio do lead, sem se apresentar; no máximo ${FIRST_CONTACT_MAX_LINES} linhas curtas; termine com uma pergunta simples (ex.: pedir permissão para mostrar).`
      : options.afterPrototype
        ? 'Depois da prévia: em 3 ou 4 linhas curtas, diga que é um ponto de partida que dá para ajustar, que quer ouvir a opinião do cliente, convide para uma conversa rápida sem compromisso e termine perguntando o melhor horário com duas opções concretas.'
        : 'Mantenha curta e natural, como WhatsApp real.',
    'Mantenha o idioma, os fatos, os nomes, os preços e os marcadores entre colchetes da mensagem original. Não acrescente fatos, preços, prazos ou promessas.',
    'Responda SOMENTE com o texto final da mensagem, sem aspas, sem título e sem explicação.',
  ].join('\n')
}

// Limpa a resposta da reescrita (aspas ou rótulos que a IA às vezes coloca).
export function cleanRewrite(text: string): string {
  let value = text.trim()
  value = value.replace(/^(?:mensagem(?: revisada| corrigida| final)?|vers[aã]o (?:revisada|corrigida))\s*:\s*/i, '')
  if (/^["“].*["”]$/s.test(value)) value = value.slice(1, -1).trim()
  return value
}

// Fica com a reescrita só se ela for válida e tiver menos problemas.
export function pickBetter(original: string, rewrite: string, options: ReviewOptions): { message: string; problems: ReviewProblem[] } {
  const before = reviewSuggestedMessage(original, options)
  const cleaned = cleanRewrite(rewrite)
  if (!cleaned || cleaned.includes('<') || cleaned.length > Math.max(original.length * 2, 600)) return { message: original, problems: before }
  const after = reviewSuggestedMessage(cleaned, options)
  return after.length < before.length ? { message: cleaned, problems: after } : { message: original, problems: before }
}
