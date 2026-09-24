import assert from 'node:assert/strict'
import test from 'node:test'

import { getAppSurface } from './appSurface.ts'

test('AutoPilot usa fundo escuro estável e não anima a opacidade da rota', () => {
  assert.deepEqual(getAppSurface('/autopilot'), {
    dark: true,
    animateOpacity: false,
  })
  assert.deepEqual(getAppSurface('/autopilot/conversa/123'), {
    dark: true,
    animateOpacity: false,
  })
})

test('demais páginas preservam a superfície e a transição normais', () => {
  assert.deepEqual(getAppSurface('/'), {
    dark: false,
    animateOpacity: true,
  })
  assert.deepEqual(getAppSurface('/crm'), {
    dark: false,
    animateOpacity: true,
  })
})
