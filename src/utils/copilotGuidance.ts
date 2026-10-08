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
  /** O lead visualizou e não respondeu. */
  viewedNoReply: boolean
  /** O lead pediu desconto ou para baixar o valor. */
  discountRequested: boolean
  /** Ajustar a última mensagem pronta ("mais persuasiva", "mais curta", "outra versão"). */
  refineRequest: boolean
  /** Lead ou pedido em português de Portugal. */
  portuguesePortugal: boolean
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
// Silêncio depois de ver a mensagem.
const VIEWED_NO_REPLY = /visualiz|\b(?:viu|leu) e nao (?:respond|falou|disse)|vacuo|ficou no visto|so (?:viu|visualizou)/
const PRICE_OBJECTION = /esta caro|ta caro|ficou caro|muito caro|achou caro|acha caro|achando caro|caro demais|passou do orcamento|fora do orcamento|proposta mais barata/
const DISCOUNT = /desconto|faz(?:er)? por menos|(?:baixar|abaixar|reduzir|melhorar) (?:o |um pouco o |esse )?(?:preco|valor)|faz(?:er)? mais barato|chorou (?:o )?preco|pechinch/
// Ajuste da mensagem anterior.
const REFINE = /\b(?:deixa|deixe|deixar|torna|torne|tornar|faz|faca|fazer|fica|escreve|escreva)\b.{0,24}\bmais (?:persuasiv|curt|natural|diret|formal|informal|leve|human|profission|convincente|objetiv|simpatic|educad|empolgant|firme)|\b(?:melhora|melhore|melhorar)\b(?! (?:o |um pouco o |esse |seu )?(?:preco|valor|orcamento))|\b(?:reescreve|reescreva|reescrever|refaz|refaca|refazer|encurta|encurte)\b|outra (?:versao|opcao)|\bmais (?:curta|curto|persuasiva|persuasivo|natural|direta|direto)\b|(?:agora|passa|passe|traduz|coloca|versao) (?:em|para|pro|pra) (?:pt-?pt|portugues de portugal|portugues europeu)/
const PORTUGAL = /portugal|pt-?pt|portugues (?:de portugal|europeu)|lisboa|\bporto\b(?! (?:alegre|seguro|velho|de galinhas|belo|nacional|feliz))|braga|coimbra|\bfaro\b|setubal|aveiro|madeira|acores/
const WRITE_MESSAGE = /\b(?:faz|faca|fazer|cria|crie|criar|escreve|escreva|escrever|gera|gere|gerar|monta|monte|montar|me da|me de|manda|preciso de) (?:uma |a |umas |as )?(?:mensage(?:m|ns)|msg|texto|copy)/

export function inferCommercialResponseMode(message: string): CommercialResponseMode {
  const text = normalize(message)
  if (FIRST_CONTACT.test(text)) return 'quick_reply'
  if (/analis[ae]|analise detalhada|leitura completa/.test(text)) return 'analysis'
  if (REFINE.test(text) && !FIRST_CONTACT.test(text)) return 'quick_reply'
  if (/follow[ -]?up|sumiu|sem resposta|nao respondeu|retomar|recuperar lead/.test(text) || VIEWED_NO_REPLY.test(text)) return 'follow_up'
  if (/quebr(?:ar|e) (?:a )?objecao|vou pensar|falar com (?:meu )?socio/.test(text) || PRICE_OBJECTION.test(text) || DISCOUNT.test(text)) return 'objection'
  if (/o ?que (?:eu )?(?:respondo|mando|envio|falo|digo|escrevo)|responde (?:isso|pra mim)|mensagem sugerida|manda o valor|quanto (?:custa|fica|sai|cobra)\b|qual (?:e )?o (?:valor|preco)|como (?:eu )?(?:respondo|mando|envio|falo)/.test(text)) return 'quick_reply'
  if (AFTER_PROTOTYPE.test(text)) return 'quick_reply'
  if (WRITE_MESSAGE.test(text)) return 'quick_reply'
  return 'analysis'
}

export function readCommercialSignals(message: string): CommercialRequestSignals {
  const text = normalize(message)
  return {
    mode: inferCommercialResponseMode(message),
    meetingRefused: MEETING_REFUSED.test(text),
    priceRequested: /quanto (?:custa|fica|sai|cobra|e)\b|qual (?:e )?o (?:valor|preco)|manda (?:o )?valor|passa (?:o )?preco|so (?:quero|manda) (?:o )?(?:preco|valor)/.test(text),
    // Cliente cobrando o valor de novo ou antes de qualquer conversa.
    priceInsisted: /mas (?:quanto|qual (?:e )?o (?:valor|preco))|quero saber (?:o )?(?:preco|valor)|me passa (?:o )?(?:valor|preco)|ja (?:perguntei|pedi)|fala (?:o )?(?:valor|preco)|so (?:quero|manda) (?:o )?(?:preco|valor)/.test(text),
    priceObjection: PRICE_OBJECTION.test(text),
    positiveInterest: /gostei|curti|interessante|ficou (?:bom|otimo)|quero avancar/.test(text),
    prototypeFollowUp: /(?:enviei|mandei).{0,80}(?:prototipo|previa).{0,80}(?:sumiu|sem resposta|nao respondeu|[2-9]\s*dias)/s.test(text),
    firstContact: FIRST_CONTACT.test(text),
    afterPrototype: AFTER_PROTOTYPE.test(text) && !FIRST_CONTACT.test(text),
    shortQuestion: message.trim().length <= 180 && !/analis|detalh|completa/.test(text),
    viewedNoReply: VIEWED_NO_REPLY.test(text),
    discountRequested: DISCOUNT.test(text),
    refineRequest: REFINE.test(text),
    portuguesePortugal: PORTUGAL.test(text),
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
  if (signals.mode === 'follow_up') rules.push('Indique quando agir e por quê, gere um follow-up curto que acrescente algo novo (ideia para a prévia, observação real do negócio, pergunta fácil sobre um ponto, outro caminho como explicar por mensagem) e diga o que fazer se não houver resposta. Nada de "só passando para saber" nem cobrança.')
  if (signals.viewedNoReply) rules.push('Visualizou e não respondeu: não é recusa (quem vê correndo esquece). Diga quando mandar — em geral 1 a 2 dias depois, em horário de trabalho do lead — e escreva um follow-up leve que acrescente algo. Não peça explicação pelo silêncio.')
  if (signals.refineRequest) rules.push('Ajuste de mensagem: reescreva a ÚLTIMA mensagem pronta do histórico (ou a que o usuário colou) aplicando só o que foi pedido. Mantenha fatos, nomes, links, preço e objetivo; não invente nada novo para "persuadir" — persuasão vem de ser mais específico, mais claro sobre o ganho do lead e de um pedido mais fácil de responder. Entregue a nova versão em <mensagem_pronta> e diga em uma frase o que mudou. Não peça para colar a mensagem de novo se ela está no histórico.')
  if (signals.meetingRefused) rules.push('O lead recusou reunião: não insista em reunião e continue pelo canal escolhido.')
  if (signals.priceRequested || signals.priceInsisted) {
    if (signals.priceInsisted || signals.meetingRefused) {
      rules.push('O cliente insistiu no preço ou prefere mensagem: responda diretamente sobre o preço quando houver valor real, sem desviar nem irritar. Se não houver valor registrado, pergunte só o que falta para calcular.')
    } else {
      rules.push('Há pedido de preço. Se for a primeira vez (confira o histórico) e houver abertura: reconheça a pergunta, dê a referência real que existir no perfil ou no negócio ("fica a partir de R$ X, dependendo do que entrar") e proponha uma conversa breve para fechar o escopo, já que a prévia ainda pode mudar. Sem valor registrado, não invente: proponha a conversa ou pergunte o que falta. Se ele já perguntou antes, passe o valor direto.')
    }
  }
  if (signals.priceObjection) rules.push('Objeção de preço: não ofereça desconto de cara. A mensagem descobre se a trava é orçamento ou valor percebido (uma pergunta), lembra o que está incluído e o ganho concreto para o negócio do lead e, se o perfil tiver, mostra um caminho alternativo (pacote menor, etapas, parcelamento) sem baixar o preço do mesmo escopo.')
  if (signals.discountRequested) rules.push('Pedido de desconto: não conceda por reflexo e nunca invente percentual. Reforce o que está incluído; se o perfil comercial trouxer condição (à vista, pacote menor, parcelamento), ofereça como troca por algo (pagamento à vista, escopo menor, fechar com data de início). Sem condição registrada, a mensagem segura o valor com educação e oferece ajustar o escopo; diga ao usuário que, se quiser dar desconto, defina o limite e peça uma contrapartida.')
  if (signals.positiveInterest) rules.push('Reconheça o interesse observado sem chamar o lead de quente ou assumir intenção de compra.')
  if (signals.prototypeFollowUp) rules.push('A prévia foi enviada e houve espera: recomende um follow-up curto, sem repetir a apresentação nem pressionar.')
  else if (signals.afterPrototype && !signals.meetingRefused) rules.push(AFTER_PROTOTYPE_RULES)
  if (signals.firstContact) rules.push(FIRST_CONTACT_RULES)
  if (signals.portuguesePortugal) rules.push('Português de Portugal na mensagem para o lead: vocabulário e tratamento de Portugal ("contactar", "telemóvel", "equipa", "o senhor/a senhora" ou sem pronome, "está a" em vez de gerúndio); explicações ao usuário podem seguir em português do Brasil.')
  if (signals.refineRequest) {
    // Ajuste de mensagem: a explicação já está na regra acima.
  } else if (signals.shortQuestion && signals.mode !== 'analysis') {
    rules.push('Pedido curto: resposta curta — o essencial fora da mensagem pronta, sem explicar a metodologia nem listar etapas; vá direto ao que fazer.')
  } else if (signals.shortQuestion) {
    rules.push('Pergunta curta: responda direto, como numa conversa, em poucos parágrafos. Só faça análise completa de lead se houver um lead ou conversa para analisar.')
  }
  return rules.join(' ')
}
