import assert from 'node:assert/strict'
import test from 'node:test'
import { commercialRequestGuidance, inferCommercialResponseMode, readCommercialSignals } from './copilotGuidance.ts'

test('recognizes first-contact requests as a ready message with the methodology rules', () => {
  const request = 'Faz uma mensagem de primeiro contato pra imobiliarias em braga, portugal'
  assert.equal(inferCommercialResponseMode(request), 'quick_reply')
  assert.equal(readCommercialSignals(request).firstContact, true)
  const guidance = commercialRequestGuidance(request)
  assert.match(guidance, /PRIMEIRA ABORDAGEM/)
  assert.match(guidance, /Proibido abrir com apresentação institucional/)
  assert.match(guidance, /Code Maker/)
  assert.match(guidance, /português de Portugal/)
})

test('other ways of asking for an approach also trigger the rules', () => {
  for (const request of ['me ajuda a abordar essa clínica', 'cria uma abordagem pra barbearias', 'mensagem pra prospectar dentistas', 'quero a primeira mensagem pro lead']) {
    assert.equal(readCommercialSignals(request).firstContact, true, request)
    assert.equal(inferCommercialResponseMode(request), 'quick_reply', request)
  }
})

test('writing a message is a quick reply; analysis and follow-up keep their modes', () => {
  assert.equal(inferCommercialResponseMode('escreve uma mensagem pra cobrar a resposta'), 'quick_reply')
  assert.equal(inferCommercialResponseMode('analisa essa conversa'), 'analysis')
  assert.equal(inferCommercialResponseMode('o cliente sumiu faz 3 dias'), 'follow_up')
  assert.equal(readCommercialSignals('o cliente sumiu faz 3 dias').firstContact, false)
  assert.doesNotMatch(commercialRequestGuidance('quanto custa?'), /PRIMEIRA ABORDAGEM/)
})

test('entende os pedidos do jeito que o usuário fala (seção 5 da reestruturação)', () => {
  const viewed = readCommercialSignals('Ela visualizou e não respondeu')
  assert.equal(viewed.viewedNoReply, true)
  assert.equal(viewed.mode, 'follow_up')
  assert.match(commercialRequestGuidance('Ela visualizou e não respondeu'), /não é recusa/)

  const caro = readCommercialSignals('Ele achou caro')
  assert.equal(caro.priceObjection, true)
  assert.equal(caro.mode, 'objection')
  assert.match(commercialRequestGuidance('Ele achou caro'), /não ofereça desconto de cara/)

  const discount = readCommercialSignals('o cliente pediu desconto, faz por menos?')
  assert.equal(discount.discountRequested, true)
  assert.equal(discount.mode, 'objection')
  assert.match(commercialRequestGuidance('o cliente pediu desconto'), /nunca invente percentual/)

  for (const request of ['Deixa mais persuasivo', 'deixa ela mais curta', 'faz uma outra versão', 'melhora essa mensagem', 'agora em pt-pt']) {
    const signals = readCommercialSignals(request)
    assert.equal(signals.refineRequest, true, request)
    assert.equal(signals.mode, 'quick_reply', request)
    assert.match(commercialRequestGuidance(request), /ÚLTIMA mensagem pronta do histórico/, request)
  }
  assert.equal(readCommercialSignals('ele pediu pra melhorar o preço').refineRequest, false)

  assert.equal(readCommercialSignals('negociação com uma clínica em Lisboa').portuguesePortugal, true)
  assert.equal(readCommercialSignals('cliente de Porto Alegre').portuguesePortugal, false)
  assert.match(commercialRequestGuidance('responde esse cliente de Portugal'), /telemóvel/)
})

test('"quanto fica pra fazer?" também é pedido de preço', () => {
  const signals = readCommercialSignals('Ele respondeu: "Gostei muito! Quanto fica pra fazer?" O que eu mando?')
  assert.equal(signals.priceRequested, true)
  assert.match(commercialRequestGuidance('Quanto fica pra fazer?'), /a partir de R\$ X/)
})
