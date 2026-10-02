import type { CommercialResponseMode } from '@/types'

export interface CommercialRequestSignals {
  mode: CommercialResponseMode
  meetingRefused: boolean
  priceRequested: boolean
  priceInsisted: boolean
  priceObjection: boolean
  positiveInterest: boolean
  prototypeFollowUp: boolean
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

export function inferCommercialResponseMode(message: string): CommercialResponseMode {
  const text = normalize(message)
  if (/analis[ae]|analise detalhada|leitura completa/.test(text)) return 'analysis'
  if (/follow[ -]?up|sumiu|sem resposta|nao respondeu|retomar|recuperar lead/.test(text)) return 'follow_up'
  if (/quebr(?:ar|e) (?:a )?objecao|esta caro|ficou caro|vou pensar|falar com (?:meu )?socio|proposta mais barata|quero desconto/.test(text)) return 'objection'
  if (/o que (?:eu )?respondo|responde (?:isso|pra mim)|o que (?:eu )?mando|mensagem sugerida|manda o valor|quanto custa|qual (?:e )?o valor/.test(text)) return 'quick_reply'
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
  }
}

export function commercialRequestGuidance(message: string): string {
  const signals = readCommercialSignals(message)
  const rules = [`Formato desta resposta comercial: ${signals.mode}.`]
  if (signals.mode === 'quick_reply') rules.push('Mostre a mensagem pronta primeiro e depois apenas uma linha de estratégia.')
  if (signals.mode === 'analysis') rules.push('Entregue a análise comercial completa, com leitura, risco, ação, justificativa, mensagem e próximo passo.')
  if (signals.mode === 'objection') rules.push('Identifique a objeção com cautela, explique o objetivo da resposta e dê uma mensagem pronta com próximo passo.')
  if (signals.mode === 'follow_up') rules.push('Indique quando agir, gere um follow-up curto e defina o que fazer se não houver resposta.')
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
  return rules.join(' ')
}
