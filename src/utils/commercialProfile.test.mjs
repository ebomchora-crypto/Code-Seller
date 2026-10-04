import assert from 'node:assert/strict'
import test from 'node:test'
import { commercialProfilePrompt, commercialProfileProgress, isCommercialProfileEmpty, normalizeCommercialProfile } from './commercialProfile.ts'

test('normalizes, trims and drops empty packages', () => {
  const profile = normalizeCommercialProfile({
    services: '  Sites para clínicas  ',
    packages: [{ name: 'Essencial', price: 'R$ 1.500' }, { name: ' ', price: '' }, 'lixo'],
    winning_messages: 'x'.repeat(7000),
  })
  assert.equal(profile.services, 'Sites para clínicas')
  assert.equal(profile.packages.length, 1)
  assert.equal(profile.packages[0].includes, '')
  assert.equal(profile.winning_messages.length, 6000)
  assert.equal(profile.writing_style, '')
})

test('empty profile gives no prompt block', () => {
  assert.equal(isCommercialProfileEmpty(normalizeCommercialProfile({})), true)
  assert.equal(commercialProfilePrompt(normalizeCommercialProfile({ packages: [] })), '')
  assert.equal(commercialProfilePrompt(null), '')
})

test('prompt carries offer, prices and the winning messages', () => {
  const profile = normalizeCommercialProfile({
    services: 'Sites para clínicas',
    packages: [{ name: 'Essencial', price: 'R$ 1.500', includes: '1 página', deadline: '7 dias' }],
    winning_messages: 'Oi! Vi a clínica no Google. Posso te mostrar uma ideia?',
    writing_style: 'informal, sem emoji',
    signature: 'Arthur',
  })
  const block = commercialProfilePrompt(profile)
  assert.match(block, /PERFIL COMERCIAL DO USUÁRIO/)
  assert.match(block, /Essencial — R\$ 1\.500 \(inclui: 1 página; prazo: 7 dias\)/)
  assert.match(block, /ÚNICOS preços/)
  assert.match(block, /MENSAGENS DO USUÁRIO QUE FUNCIONARAM/)
  assert.match(block, /Como assina as mensagens: Arthur/)
  assert.deepEqual(commercialProfileProgress(profile), { done: 4, total: 7 })
})
