import assert from 'node:assert/strict'
import test from 'node:test'
import { COMMERCIAL_MATERIALS, getCommercialMaterial, searchCommercialMaterials, commercialMaterialPrompt, commercialFavoriteKey } from '../src/data/commercial-library/index.ts'
import { leadContextForAI } from '../src/utils/aiLeadContext.ts'

test('catalog has stable unique ids and content in every category', () => {
  const ids = COMMERCIAL_MATERIALS.map((item) => item.id)
  assert.equal(new Set(ids).size, ids.length)
  for (const category of ['scripts', 'objections', 'followups', 'copies', 'prompts', 'universal']) {
    assert.ok(COMMERCIAL_MATERIALS.filter((item) => item.category === category).length >= 6, category)
  }
  for (const item of COMMERCIAL_MATERIALS) {
    assert.ok(item.title && item.strategy && item.body && item.stage && item.tags.length)
    assert.equal(getCommercialMaterial(item.id), item)
  }
})

test('objections contain practical guidance and three responses', () => {
  const objections = COMMERCIAL_MATERIALS.filter((item) => item.category === 'objections')
  assert.ok(objections.length >= 48)
  for (const item of objections) {
    for (const key of ['meaning', 'avoid', 'goal', 'body', 'short', 'consultative', 'next']) {
      assert.ok(item[key]?.trim(), `${item.id}: ${key}`)
    }
  }
})

test('search ignores accents and combines category and stage filters', () => {
  assert.ok(searchCommercialMaterials('prototipo').some((item) => item.title.toLowerCase().includes('protótipo')))
  assert.ok(searchCommercialMaterials('preco').some((item) => item.title.includes('preço')))
  assert.ok(searchCommercialMaterials('sumiu').length > 0)
  assert.equal(searchCommercialMaterials('caro')[0]?.title, 'Está caro')
  assert.ok(searchCommercialMaterials('reuniao', 'objections').every((item) => item.category === 'objections'))
  assert.ok(searchCommercialMaterials('', 'scripts', 'reuniao').some((item) => item.id === 'script-meeting-invite'))
  assert.ok(searchCommercialMaterials('', 'all', 'fechamento').length > 0)
  assert.equal(getCommercialMaterial('missing'), undefined)
  assert.equal(commercialFavoriteKey('script-first-contact'), 'favorite:commercial:script-first-contact')
})

test('Copilot handoff carries strategy and body, not fake lead facts', () => {
  const item = getCommercialMaterial('objection-expensive')
  const prompt = commercialMaterialPrompt(item)
  assert.match(prompt, /Está caro/)
  assert.match(prompt, /R\$/)
  assert.match(prompt, /contexto real/)
  assert.doesNotMatch(prompt, /agenda cheia/)
})

test('AI lead context strips proposal access tokens', () => {
  const lead = { contact: { name: 'Lead' }, proposals: [{ id: 'p1', token: 'private-access-token' }] }
  const sanitized = leadContextForAI(lead)
  assert.equal(JSON.stringify(sanitized).includes('private-access-token'), false)
  assert.equal(lead.proposals[0].token, 'private-access-token')
})
