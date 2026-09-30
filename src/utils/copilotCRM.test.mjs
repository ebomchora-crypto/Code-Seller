import assert from 'node:assert/strict'
import test from 'node:test'
import { buildAttentionItems, taskState, parseLeadAnalysis, isFollowUp } from './copilotCRM.ts'

const now = new Date('2026-09-29T12:00:00Z')
const contact = { id: 'c1', name: 'Clínica', status: 'lead', created_at: '2026-09-28T12:00:00Z' }
const message = { id: 'm1', contact_id: 'c1', type: 'whatsapp', content: 'Prévia', occurred_at: '2026-09-28T12:00:00Z' }
test('classifies dates and terminal states without reviving cancelled tasks', () => {
  assert.equal(taskState({status:'todo',due_date:null}, now), 'pendente')
  assert.equal(taskState({status:'todo',due_date:'2026-09-29T13:00:00Z'}, now), 'hoje')
  assert.equal(taskState({status:'todo',due_date:'2026-09-28T13:00:00Z'}, now), 'atrasado')
  assert.equal(taskState({status:'done',due_date:'2026-09-28T13:00:00Z'}, now), 'concluído')
  assert.equal(taskState({status:'cancelled',due_date:'2026-09-28T13:00:00Z'}, now), 'cancelado')
  assert.equal(isFollowUp({followup_step:2,title:'Retorno'}), true)
})
test('unknown direction cannot assert that the customer owes a reply', () => {
  assert.equal(buildAttentionItems([contact], [message], [], now).length, 0)
})
test('inbound reply clears prototype waiting and isolates leads', () => {
  const outbound = {...message, direction:'outbound', metadata:{event:'prototype_sent'}}
  assert.equal(buildAttentionItems([contact], [outbound], [], now)[0].kind, 'prototype')
  const reply = {...message, id:'m2', direction:'inbound', occurred_at:'2026-09-29T10:00:00Z'}
  assert.deepEqual(buildAttentionItems([contact], [outbound,reply,{...reply,id:'m3',contact_id:'other'}], [], now).map(x=>x.kind), ['reply'])
})
test('completed or deferred suggestion does not reappear', () => {
  const inbound = {...message,direction:'inbound'}
  assert.equal(buildAttentionItems([contact], [inbound], [{copilot_key:'reply:m1',status:'done'}], now).length, 0)
})
test('later ambiguous communication prevents false no-response inference', () => {
  assert.equal(buildAttentionItems([contact], [{...message,direction:'outbound'}, {...message,id:'m2',occurred_at:'2026-09-29T10:00:00Z'}], [], now).length, 0)
})
test('validates structured AI output', () => {
  assert.equal(parseLeadAnalysis({interest:'Alto'}), null)
  const result = parseLeadAnalysis({interest:'Certeza',stage:'Interesse',evidence:'Perguntou preço',objection:'',summary:'Resumo',next_action:'Call',suggested_message:'Olá',follow_up_at:'invalid'})
  assert.equal(result.interest, 'Indeterminado')
  assert.equal(result.follow_up_at, null)
  assert.equal(parseLeadAnalysis({...result,interest:'alto'}).interest, 'Alto')
})

test('keeps legacy analysis compatible with safe presentation defaults', () => {
  const result = parseLeadAnalysis({interest:'Alto',stage:'Negociação',evidence:'Pediu proposta',objection:'',summary:'Resumo',next_action:'Enviar',suggested_message:'Mensagem',follow_up_at:null})
  assert.equal(result.mode, 'analysis')
  assert.equal(result.risk, 'Não identificado')
  assert.equal(result.reason, '')
  assert.equal(result.strategy, '')
  assert.equal(result.next_step, '')
})
