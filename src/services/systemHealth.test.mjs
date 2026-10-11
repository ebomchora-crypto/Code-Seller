import assert from 'node:assert/strict'
import test from 'node:test'
import { levelFor, overallLevel } from './systemHealth.ts'

test('status dos sistemas: erro vira instável, resposta lenta vira lento', () => {
  assert.equal(levelFor({ ok: true, ms: 300 }), 'operational')
  assert.equal(levelFor({ ok: true, ms: 4000 }), 'degraded')
  assert.equal(levelFor({ ok: false, ms: 50 }), 'outage')
  assert.equal(overallLevel([{ status: 'operational' }, { status: 'degraded' }]), 'degraded')
  assert.equal(overallLevel([{ status: 'degraded' }, { status: 'outage' }]), 'outage')
  assert.equal(overallLevel([{ status: 'operational' }]), 'operational')
})
