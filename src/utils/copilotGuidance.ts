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
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

// Pedido de primeira mensagem/abordagem para um lead ou um nicho (prospecção).
const FIRST_CONTACT = /primeir[oa]s? (?:contato|mensage(?:m|ns)|abordage(?:m|ns))|\babordage(?:m|ns)\b|\babordar\b|prospecta|mensage(?:m|ns) (?:de|pra|para) (?:prospec|abordar|chamar|contato)|chamar (?:no|pelo) (?:whats|zap)/
// Pedido explícito para escrever uma mensagem.
const WRITE_MESSAGE = /\b(?:faz|faca|fazer|cria|crie|criar|escreve|escreva|escrever|gera|gere|gerar|monta|monte|montar|me da|me de|manda|preciso de) (?:uma |a |umas |as )?(?:mensage(?:m|ns)|msg|texto|copy)/

export function inferCommercialResponseMode(message: string): CommercialResponseMode {
  const text = normalize(message)
  if (FIRST_CONTACT.test(text)) return 'quick_reply'
  if (/analis[ae]|analise detalhada|leitura completa/.test(text)) return 'analysis'
  if (/follow[ -]?up|sumiu|sem resposta|nao respondeu|retomar|recuperar lead/.test(text)) return 'follow_up'
  if (/quebr(?:ar|e) (?:a )?objecao|esta caro|ficou caro|vou pensar|falar com (?:meu )?socio|proposta mais barata|quero desconto/.test(text)) return 'objection'
  if (/o que (?:eu )?respondo|responde (?:isso|pra mim)|o que (?:eu )?mando|mensagem sugerida|manda o valor|quanto custa|qual (?:e )?o valor/.test(text)) return 'quick_reply'
  if (WRITE_MESSAGE.test(text)) return 'quick_reply'
  return 'analysis'
}

export function readCommercialSignals(message: string): CommercialRequestSignals {
  const text = normalize(message)
  return {
    mode: inferCommercialResponseMode(message),
    meetingRefused: /nao (?:quero|vou|posso) (?:reuniao|call)|sem (?:reuniao|call)|so por (?:aqui|mensagem|whatsapp)/.test(text),
    priceRequested: /quanto custa|qual (?:e )?o valor|manda (?:o )?valor|passa (?:o )?preco|so (?:quero|manda) (?:o )?(?:preco|valor)/.test(text),
    // Cliente cobrando o valor de novo ou antes de qualquer conversa.
    priceInsisted: /mas (?:quanto|qual (?:e )?o (?:valor|preco))|quero saber (?:o )?(?:preco|valor)|me passa (?:o )?(?:valor|preco)|ja (?:perguntei|pedi)|fala (?:o )?(?:valor|preco)|so (?:quero|manda) (?:o )?(?:preco|valor)/.test(text),
    priceObjection: /esta caro|ficou caro|muito caro|passou do orcamento|proposta mais barata|quero desconto/.test(text),
    positiveInterest: /gostei|curti|interessante|ficou (?:bom|otimo)|quero avancar/.test(text),
    prototypeFollowUp: /(?:enviei|mandei).{0,80}(?:prototipo|previa).{0,80}(?:sumiu|sem resposta|nao respondeu|[2-9]\s*dias)/s.test(text),
    firstContact: FIRST_CONTACT.test(text),
  }
}

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
  if (signals.mode === 'quick_reply') rules.push('Abra com uma frase, traga a mensagem pronta logo em seguida (em <mensagem_pronta>) e explique em 2 ou 3 pontos por que ela funciona; feche com o próximo passo.')
  if (signals.mode === 'analysis') rules.push('Entregue a análise comercial completa, em texto organizado: leitura do lead, risco, ação com o porquê, mensagem pronta e próximo passo.')
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
  if (signals.firstContact) rules.push(FIRST_CONTACT_RULES)
  return rules.join(' ')
}
