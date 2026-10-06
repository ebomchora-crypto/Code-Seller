import type { CommercialResponseMode } from '@/types'

export interface CommercialRequestSignals {
  mode: CommercialResponseMode
  meetingRefused: boolean
  priceRequested: boolean
  priceInsisted: boolean
  priceObjection: boolean
  positiveInterest: boolean
  prototypeFollowUp: boolean
  firstContact: boolean
  /** A prévia já foi (ou vai ser) enviada: a próxima etapa é a reunião. */
  afterPrototype: boolean
  /** Pergunta curta e direta: resposta curta, sem análise completa. */
  shortQuestion: boolean
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

// Pedido de primeira mensagem/abordagem para um lead ou um nicho (prospecção).
const FIRST_CONTACT = /primeir[oa]s? (?:contato|mensage(?:m|ns)|abordage(?:m|ns))|\babordage(?:m|ns)\b|\babordar\b|prospecta|mensage(?:m|ns) (?:de|pra|para) (?:prospec|abordar|chamar|contato)|chamar (?:no|pelo) (?:whats|zap)/
// Mesmo critério de supabase/functions/ai-chat/review.ts.
const AFTER_PROTOTYPE = /(?:depois|apos|agora que|ja) (?:de |que |da |do )?(?:eu )?(?:enviar|mandar|mandei|enviei|mostrar|mostrei|entregar|entreguei)?\s?(?:o |a |um |uma |meu |minha )?(?:prototipo|previa)|(?:enviei|mandei|mostrei|vou enviar|vou mandar|como envio|como mando|segue) (?:o |a |um |uma |meu |minha )?(?:prototipo|previa)|(?:prototipo|previa) (?:ja )?(?:enviad|mandad|pront)/
const MEETING_REFUSED = /nao (?:quero|vou|posso|consigo|quer|pode) (?:fazer )?(?:reuniao|call|ligacao)|sem (?:reuniao|call)|so por (?:aqui|mensagem|whatsapp)|(?:pode|prefiro) (?:explicar|falar) por aqui/
// Pedido explícito para escrever uma mensagem.
const WRITE_MESSAGE = /\b(?:faz|faca|fazer|cria|crie|criar|escreve|escreva|escrever|gera|gere|gerar|monta|monte|montar|me da|me de|manda|preciso de) (?:uma |a |umas |as )?(?:mensage(?:m|ns)|msg|texto|copy)/

export function inferCommercialResponseMode(message: string): CommercialResponseMode {
  const text = normalize(message)
  if (FIRST_CONTACT.test(text)) return 'quick_reply'
  if (/analis[ae]|analise detalhada|leitura completa/.test(text)) return 'analysis'
  if (/follow[ -]?up|sumiu|sem resposta|nao respondeu|retomar|recuperar lead/.test(text)) return 'follow_up'
  if (/quebr(?:ar|e) (?:a )?objecao|esta caro|ficou caro|vou pensar|falar com (?:meu )?socio|proposta mais barata|quero desconto/.test(text)) return 'objection'
  if (/o ?que (?:eu )?(?:respondo|mando|envio|falo|digo|escrevo)|responde (?:isso|pra mim)|mensagem sugerida|manda o valor|quanto custa|qual (?:e )?o valor|como (?:eu )?(?:respondo|mando|envio|falo)/.test(text)) return 'quick_reply'
  if (AFTER_PROTOTYPE.test(text)) return 'quick_reply'
  if (WRITE_MESSAGE.test(text)) return 'quick_reply'
  return 'analysis'
}

export function readCommercialSignals(message: string): CommercialRequestSignals {
  const text = normalize(message)
  return {
    mode: inferCommercialResponseMode(message),
    meetingRefused: MEETING_REFUSED.test(text),
    priceRequested: /quanto custa|qual (?:e )?o valor|manda (?:o )?valor|passa (?:o )?preco|so (?:quero|manda) (?:o )?(?:preco|valor)/.test(text),
    // Cliente cobrando o valor de novo ou antes de qualquer conversa.
    priceInsisted: /mas (?:quanto|qual (?:e )?o (?:valor|preco))|quero saber (?:o )?(?:preco|valor)|me passa (?:o )?(?:valor|preco)|ja (?:perguntei|pedi)|fala (?:o )?(?:valor|preco)|so (?:quero|manda) (?:o )?(?:preco|valor)/.test(text),
    priceObjection: /esta caro|ficou caro|muito caro|passou do orcamento|proposta mais barata|quero desconto/.test(text),
    positiveInterest: /gostei|curti|interessante|ficou (?:bom|otimo)|quero avancar/.test(text),
    prototypeFollowUp: /(?:enviei|mandei).{0,80}(?:prototipo|previa).{0,80}(?:sumiu|sem resposta|nao respondeu|[2-9]\s*dias)/s.test(text),
    firstContact: FIRST_CONTACT.test(text),
    afterPrototype: AFTER_PROTOTYPE.test(text) && !FIRST_CONTACT.test(text),
    shortQuestion: message.trim().length <= 180 && !/analis|detalh|completa/.test(text),
  }
}

// Depois da prévia (seção 3 da metodologia): a próxima etapa é a reunião.
export const AFTER_PROTOTYPE_RULES = [
  'DEPOIS DA PRÉVIA — o objetivo da mensagem é marcar a conversa (reunião rápida, sem compromisso), não deixar no ar.',
  'A mensagem precisa: entregar a prévia (com o link se o usuário passou um), deixar claro que ela muda do jeito que o cliente quiser, convidar para uma conversa curta para ouvir o que ele achou e terminar com uma pergunta de horário fácil de responder.',
  'Escreva com palavras suas, no jeito do usuário e do lead (nome do negócio, tratamento, o que já foi conversado): NÃO repita frases prontas como "segue a prévia que montei", "ponto de partida" ou "10 a 15 minutinhos" se já apareceram na conversa, e varie a pergunta de horário.',
  'Nada de "se preferir, podemos conversar" ou "fico à disposição". Até 4 linhas curtas, sem preço e sem explicar como o projeto funciona.',
].join(' ')

// Primeira abordagem pela metodologia (Área do aluno: "A primeira mensagem" e
// "Mostre antes de pedir"; seção 2 do prompt do CS Copilot).
export const FIRST_CONTACT_RULES = [
  'PRIMEIRA ABORDAGEM — siga a metodologia à risca:',
  '1) Proibido abrir com apresentação institucional: nada de "Sou [nome], da [empresa]", "trabalho com criação de sites", "somos uma agência", lista de serviços ou benefícios. A mensagem começa pelo negócio do lead; no máximo uma frase curta sobre o que você faz depois da personalização, como nos modelos do Kit.',
  '2) O objetivo é só conseguir uma resposta: crie curiosidade e peça permissão para mostrar algo ("Posso te mandar por aqui?", "Posso te mostrar?").',
  '3) Protótipo como isca: se existir prévia registrada para o lead, diga que montou uma prévia de como o site poderia ficar e peça para enviar. Se não existir, a mensagem oferece mostrar um exemplo; em next_action recomende criar antes uma prévia no Code Maker para os leads mais promissores e diga que, com ela pronta, a abertura vira "montei uma prévia de como o site de vocês poderia ficar. Posso enviar por aqui?". Nunca afirme que existe prévia sem registro.',
  '4) Personalize com algo real do negócio (avaliações, Instagram, site lento ou inexistente, reclamações de contato). Se o pedido for para um nicho ou cidade inteira, sem lead específico, escreva o modelo com marcadores curtos entre colchetes para o que muda por empresa (ex.: [nome da imobiliária], [o que você viu]) e diga em next_step o que pesquisar em 2 minutos antes de enviar.',
  '5) WhatsApp de empresa costuma ser atendido por funcionário: quando fizer sentido, peça para mostrar ao responsável, sem vender.',
  '6) Curta: até 4 ou 5 linhas, tom de WhatsApp real, sem pressão, sem marketingês e sem preço.',
  '7) Idioma do lead: empresa em Portugal → português de Portugal (tratamento e vocabulário de Portugal).',
].join(' ')

export function commercialRequestGuidance(message: string): string {
  const signals = readCommercialSignals(message)
  const rules = [`Formato desta resposta comercial: ${signals.mode}.`]
  if (signals.mode === 'quick_reply') rules.push('O usuário quer o que mandar: uma frase de contexto, a mensagem pronta (em <mensagem_pronta>) e, depois, só o que for útil de verdade — o que esperar da resposta ou o que fazer em seguida —, em prosa curta. Nada de seção "Por que funciona" nem lista de justificativas óbvias.')
  if (signals.mode === 'analysis') rules.push('Entregue a análise como um consultor explicaria a um colega: o que está acontecendo com esse lead, o que fazer agora e por quê, a mensagem pronta e o próximo passo. Use subtítulos só se a resposta for longa.')
  if (signals.mode === 'objection') rules.push('Identifique a objeção com cautela, explique o objetivo da resposta e dê uma mensagem pronta com próximo passo.')
  if (signals.mode === 'follow_up') rules.push('Indique quando agir e por quê, gere um follow-up curto e defina o que fazer se não houver resposta.')
  if (signals.meetingRefused) rules.push('O lead recusou reunião: não insista em reunião e continue pelo canal escolhido.')
  if (signals.priceRequested || signals.priceInsisted) {
    if (signals.priceInsisted || signals.meetingRefused) {
      rules.push('O cliente insistiu no preço ou prefere mensagem: responda diretamente sobre o preço quando houver valor real, sem desviar nem irritar. Se não houver valor registrado, pergunte só o que falta para calcular.')
    } else {
      rules.push('Há pedido de preço. Se for a primeira vez (confira o histórico) e houver abertura, tente primeiro levar para uma conversa breve, explicando que a prévia ainda pode mudar conforme a necessidade; não esconda um preço conhecido e não enrole. Se ele já perguntou antes, passe o valor direto.')
    }
  }
  if (signals.priceObjection) rules.push('Não ofereça desconto imediatamente; descubra se a causa é orçamento ou percepção de valor antes de alterar a proposta.')
  if (signals.positiveInterest) rules.push('Reconheça o interesse observado sem chamar o lead de quente ou assumir intenção de compra.')
  if (signals.prototypeFollowUp) rules.push('A prévia foi enviada e houve espera: recomende um follow-up curto, sem repetir a apresentação nem pressionar.')
  else if (signals.afterPrototype && !signals.meetingRefused) rules.push(AFTER_PROTOTYPE_RULES)
  if (signals.firstContact) rules.push(FIRST_CONTACT_RULES)
  if (signals.shortQuestion && signals.mode !== 'analysis') {
    rules.push('Pedido curto: resposta curta. No máximo umas 120 palavras fora da mensagem pronta. Não explique a metodologia nem liste etapas; vá direto ao que fazer.')
  } else if (signals.shortQuestion) {
    rules.push('Pergunta curta: responda direto, como numa conversa, em poucos parágrafos. Só faça análise completa de lead se houver um lead ou conversa para analisar.')
  }
  return rules.join(' ')
}
