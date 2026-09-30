import assert from 'node:assert/strict'
import test from 'node:test'
import { commercialResponseSections } from './commercialResponseView.ts'

const fixture = {
  mode: 'analysis', interest: 'Moderado', stage: 'Interesse', evidence: 'Pediu o preço',
  objection: 'Não identificada', risk: 'Perder timing', summary: 'O lead gostou.',
  next_action: 'Responder agora', reason: 'A pergunta foi direta', strategy: 'Informar e avançar',
  suggested_message: 'O investimento é R$ 500.', next_step: 'Aguardar retorno', follow_up_at: null,
}

test('quick replies put the ready message before the strategy', () => {
  assert.deepEqual(commercialResponseSections({ ...fixture, mode: 'quick_reply' }), ['message', 'strategy'])
})

test('full analysis includes the complete commercial reading in useful order', () => {
  assert.deepEqual(commercialResponseSections(fixture), ['situation', 'reading', 'action', 'reason', 'message', 'next_step'])
})

test('objection and follow-up responses stay focused on their workflows', () => {
  assert.deepEqual(commercialResponseSections({ ...fixture, mode: 'objection' }), ['reading', 'action', 'message', 'next_step'])
  assert.deepEqual(commercialResponseSections({ ...fixture, mode: 'follow_up' }), ['situation', 'action', 'message', 'next_step'])
})

test('empty optional content does not create empty sections', () => {
  assert.deepEqual(commercialResponseSections({ ...fixture, mode: 'quick_reply', suggested_message: '', strategy: '' }), [])
})
