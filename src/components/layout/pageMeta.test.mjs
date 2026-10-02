import test from 'node:test'
import assert from 'node:assert/strict'

test('maps each route to a navigation group instead of repeating the page title', async () => {
  const { getPageSection } = await import('./pageMeta.ts')

  assert.equal(getPageSection('/'), 'Principal')
  assert.equal(getPageSection('/aluno/licao/x'), 'Aprender')
  assert.equal(getPageSection('/crm'), 'Encontrar clientes')
  assert.equal(getPageSection('/crm/contact-id'), 'Encontrar clientes')
  assert.equal(getPageSection('/deals/deal-id'), 'Vender')
  assert.equal(getPageSection('/financial'), 'Organizar')
  assert.equal(getPageSection('/copilot'), 'Vender')
  assert.equal(getPageSection('/support'), 'Conta')
})
