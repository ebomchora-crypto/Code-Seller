import assert from 'node:assert/strict'
import test from 'node:test'

import { applyProspectFilters, DEFAULT_PROSPECT_FILTERS, isMobilePhone, scoreProspect } from './prospection.ts'

const base = {
  id: 'p1',
  name: 'Clínica Exemplo',
  category: 'Dentista',
  address: null,
  city: 'Ribeirão Preto',
  state: 'SP',
  phone: '(16) 99141-0000',
  phone_international: null,
  website: null,
  website_kind: 'none',
  rating: 4.8,
  reviews: 212,
  maps_url: null,
}

test('empresa sem site, bem avaliada e com celular tem potencial alto para quem vende site', () => {
  const result = scoreProspect(base, 'site')
  assert.equal(result.level, 'high')
  assert.deepEqual(result.reasons, ['Sem site', '212 avaliações', 'Nota 4,8', 'Celular para WhatsApp'])
})

test('já ter site derruba o potencial para site, mas não para sistema', () => {
  const withSite = { ...base, website: 'https://exemplo.com.br', website_kind: 'site' }
  assert.ok(scoreProspect(withSite, 'site').score < 70)
  assert.equal(scoreProspect(withSite, 'system').level, 'high')
})

test('reconhece celular brasileiro com e sem o 55', () => {
  assert.equal(isMobilePhone('(16) 99141-0000'), true)
  assert.equal(isMobilePhone('+55 16 99141-0000'), true)
  assert.equal(isMobilePhone('(16) 3610-0000'), false)
  assert.equal(isMobilePhone(null), false)
})

test('filtra e ordena por potencial', () => {
  const low = { ...base, id: 'p2', website_kind: 'site', reviews: 3, rating: 3.2, phone: null }
  const scored = [low, base].map((prospect) => ({ ...prospect, potential: scoreProspect(prospect, 'site') }))
  assert.deepEqual(applyProspectFilters(scored, DEFAULT_PROSPECT_FILTERS, new Set()).map((p) => p.id), ['p1', 'p2'])
  const onlyNoSite = { ...DEFAULT_PROSPECT_FILTERS, websiteKinds: ['none'] }
  assert.deepEqual(applyProspectFilters(scored, onlyNoSite, new Set()).map((p) => p.id), ['p1'])
  const hideImported = { ...DEFAULT_PROSPECT_FILTERS, hideImported: true }
  assert.deepEqual(applyProspectFilters(scored, hideImported, new Set(['p1'])).map((p) => p.id), ['p2'])
})
