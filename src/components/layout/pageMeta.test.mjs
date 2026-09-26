import test from 'node:test'
import assert from 'node:assert/strict'

test('maps each route to a navigation group instead of repeating the page title', async () => {
  const { getPageSection } = await import('./pageMeta.ts')

  assert.equal(getPageSection('/'), 'Principal')
  assert.equal(getPageSection('/aluno/licao/x'), 'Principal')
  assert.equal(getPageSection('/crm'), 'Vendas')
  assert.equal(getPageSection('/crm/contact-id'), 'Vendas')
  assert.equal(getPageSection('/financial'), 'Gestão')
  assert.equal(getPageSection('/copilot'), 'IA')
  assert.equal(getPageSection('/support'), 'Conta')
})
