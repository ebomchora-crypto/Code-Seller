import assert from 'node:assert/strict'
import test from 'node:test'

import { isSidebarRouteActive } from './dashboard-sidebar.utils.ts'

test('a raiz só fica ativa na página inicial', () => {
  assert.equal(isSidebarRouteActive('/', '/'), true)
  assert.equal(isSidebarRouteActive('/', '/crm'), false)
})

test('uma seção fica ativa também em suas rotas filhas', () => {
  assert.equal(isSidebarRouteActive('/crm', '/crm'), true)
  assert.equal(isSidebarRouteActive('/crm', '/crm/contato-123'), true)
  assert.equal(isSidebarRouteActive('/crm', '/deals'), false)
})
