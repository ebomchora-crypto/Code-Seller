import assert from 'node:assert/strict'
import test from 'node:test'

import { getAppSurface } from './appSurface.ts'

test('CS Copilot ocupa o painel inteiro e não anima a opacidade da rota', () => {
  assert.deepEqual(getAppSurface('/copilot'), {
    immersive: true,
    animateOpacity: false,
  })
  assert.deepEqual(getAppSurface('/copilot/conversa/123'), {
    immersive: true,
    animateOpacity: false,
  })
})

test('demais páginas preservam a superfície e a transição normais', () => {
  assert.deepEqual(getAppSurface('/'), {
    immersive: false,
    animateOpacity: true,
  })
  assert.deepEqual(getAppSurface('/crm'), {
    immersive: false,
    animateOpacity: true,
  })
})
