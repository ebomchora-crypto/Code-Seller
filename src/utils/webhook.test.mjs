import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import test from 'node:test'

import { buildPayload, checkWebhookUrl, signPayload } from '../../supabase/functions/webhook-dispatch/webhook.ts'

test('checkWebhookUrl aceita https público', () => {
  assert.equal(checkWebhookUrl('https://hooks.exemplo.com/recebe?x=1'), null)
  assert.equal(checkWebhookUrl('https://8.8.8.8/hook'), null)
})

test('checkWebhookUrl recusa URL inválida, http e credenciais', () => {
  assert.ok(checkWebhookUrl('não é url'))
  assert.ok(checkWebhookUrl('http://hooks.exemplo.com'))
  assert.ok(checkWebhookUrl('ftp://hooks.exemplo.com'))
  assert.ok(checkWebhookUrl('https://user:senha@hooks.exemplo.com'))
})

test('checkWebhookUrl recusa endereços internos', () => {
  for (const url of [
    'https://localhost/x',
    'https://api.localhost/x',
    'https://impressora.local/x',
    'https://metadata.google.internal/x',
    'https://127.0.0.1/x',
    'https://10.0.0.5/x',
    'https://172.16.0.1/x',
    'https://172.31.255.1/x',
    'https://192.168.1.10/x',
    'https://169.254.169.254/latest',
    'https://100.64.0.1/x',
    'https://0.0.0.0/x',
    'https://[::1]/x',
    'https://[fd00::1]/x',
    'https://[fe80::1]/x',
    'https://[::ffff:127.0.0.1]/x',
  ]) {
    assert.ok(checkWebhookUrl(url), url)
  }
  assert.equal(checkWebhookUrl('https://172.32.0.1/x'), null)
})

test('signPayload bate com HMAC-SHA256 padrão', async () => {
  const body = buildPayload('d1', 'deal.won', { deal: { id: 'x', value: 1500 } }, new Date('2026-09-27T12:00:00Z'))
  const expected = createHmac('sha256', 'whsec_teste').update(body).digest('hex')
  assert.equal(await signPayload('whsec_teste', body), expected)
})

test('buildPayload monta o envelope', () => {
  const body = JSON.parse(buildPayload('d1', 'test', { a: 1 }, new Date('2026-09-27T12:00:00Z')))
  assert.deepEqual(body, { id: 'd1', event: 'test', created_at: '2026-09-27T12:00:00.000Z', data: { a: 1 } })
})
