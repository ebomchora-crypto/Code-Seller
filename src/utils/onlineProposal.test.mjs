import assert from 'node:assert/strict'
import test from 'node:test'

import { kitBodyForOnline, parsePrice, validUntilFromDays, validateProposalDraft } from './onlineProposal.ts'

test('entende valores em reais', () => {
  assert.equal(parsePrice('2.400,50'), 2400.5)
  assert.equal(parsePrice('R$ 2.400'), 2400)
  assert.equal(parsePrice('1200'), 1200)
  assert.equal(parsePrice('1200.5'), 1200.5)
  assert.equal(parsePrice(''), null)
})

test('valida o rascunho da proposta', () => {
  const ok = { title: 'Site', options: [{ id: 'a', name: 'Único', description: '', price: 900, recommended: false }] }
  assert.equal(validateProposalDraft(ok), null)
  assert.match(validateProposalDraft({ ...ok, title: ' ' }), /título/)
  assert.match(validateProposalDraft({ ...ok, options: [] }), /pelo menos uma/)
  assert.match(validateProposalDraft({ ...ok, options: [{ ...ok.options[0], price: null }] }), /valor/)
  assert.match(validateProposalDraft({ ...ok, options: [{ ...ok.options[0], name: '' }] }), /nome/)
})

test('calcula a validade', () => {
  assert.equal(validUntilFromDays(7, new Date(2026, 8, 26)), '2026-10-03')
  assert.equal(validUntilFromDays(null), null)
})

test('adapta o modelo do Kit tirando título e investimento', () => {
  const body = '# Proposta — Site\n\n## O que entendi\nTexto.\n\n## Investimento\n- R$ 1.200\n\n## Prazo\n15 dias.'
  assert.equal(kitBodyForOnline(body), '## O que entendi\nTexto.\n\n## Prazo\n15 dias.')
})
