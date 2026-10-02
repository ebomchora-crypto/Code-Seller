import assert from 'node:assert/strict'
import test from 'node:test'
import { commercialRequestGuidance, inferCommercialResponseMode, readCommercialSignals } from '../src/utils/copilotGuidance.ts'

test('price interest uses a concise reply without hiding a known price', () => {
  const signals = readCommercialSignals('Gostei, quanto custa?')
  assert.equal(signals.mode, 'quick_reply')
  assert.equal(signals.priceRequested, true)
  assert.equal(signals.positiveInterest, true)
  assert.match(commercialRequestGuidance('Gostei, quanto custa?'), /não esconda um preço conhecido/i)
})

test('first price question tries a short conversation first, insistence gets the price', () => {
  const first = commercialRequestGuidance('Gostei, quanto custa?')
  assert.match(first, /primeira vez/i)
  assert.match(first, /conversa breve/i)
  assert.equal(readCommercialSignals('Gostei, quanto custa?').priceInsisted, false)
  for (const message of ['Mas quanto custa?', 'Me passa o valor.', 'Quero saber o preço antes.']) {
    assert.equal(readCommercialSignals(message).priceInsisted, true, message)
    const guidance = commercialRequestGuidance(message)
    assert.match(guidance, /insistiu no preço/i, message)
    assert.match(guidance, /responda diretamente sobre o preço/i, message)
    assert.doesNotMatch(guidance, /primeira vez/i, message)
  }
})

test('meeting refusal overrides call-first and asks for a direct price answer', () => {
  const guidance = commercialRequestGuidance('Não quero reunião, manda o valor.')
  assert.equal(readCommercialSignals('Não quero reunião, manda o valor.').meetingRefused, true)
  assert.match(guidance, /não insista em reunião/i)
  assert.match(guidance, /responda diretamente.*preço/i)
})

test('price objection avoids an automatic discount and asks for the cause', () => {
  assert.equal(inferCommercialResponseMode('Está caro.'), 'objection')
  const guidance = commercialRequestGuidance('Está caro.')
  assert.match(guidance, /não ofereça desconto imediatamente/i)
  assert.match(guidance, /orçamento.*percepção de valor/i)
})

test('prototype silence after three days becomes a short follow-up', () => {
  const message = 'Enviei o protótipo há 3 dias e ele sumiu.'
  assert.equal(inferCommercialResponseMode(message), 'follow_up')
  assert.equal(readCommercialSignals(message).prototypeFollowUp, true)
  assert.match(commercialRequestGuidance(message), /follow-up curto/i)
})

test('long pasted history still obeys an explicit detailed-analysis request', () => {
  const message = 'Cliente: gostei.\nVendedor: valor R$ 500.\n'.repeat(3000) + '\nAnalisa essa conversa detalhadamente.'
  assert.equal(inferCommercialResponseMode(message), 'analysis')
})

test('simple reply requests are message-first', () => {
  assert.equal(inferCommercialResponseMode('O que eu respondo?'), 'quick_reply')
  assert.match(commercialRequestGuidance('O que eu respondo?'), /mensagem pronta primeiro/i)
})

test('conversation analysis requests the complete commercial reading', () => {
  assert.equal(inferCommercialResponseMode('Analisa essa conversa.'), 'analysis')
  assert.match(commercialRequestGuidance('Analisa essa conversa.'), /análise comercial completa/i)
})
