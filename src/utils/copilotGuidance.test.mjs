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
