import assert from 'node:assert/strict'
import test from 'node:test'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, logLevel: 'silent' })
const { streamingPreview } = await server.ssrLoadModule('/src/utils/autopilot.ts')
await server.close()

test('live text hides internal blocks and half-written tags', () => {
  assert.equal(streamingPreview('Resposta pronta.\n<commercial_response>{"mode":"qu'), 'Resposta pronta.\n')
  assert.equal(streamingPreview('Resposta <mens'), 'Resposta ')
  assert.equal(streamingPreview('Texto\n<action>{"type"'), 'Texto\n')
})

test('the ready message shows as a quote while it is being written', () => {
  assert.equal(streamingPreview('Abertura.\n<mensagem_pronta>\nOi, tudo bem? Vi que'), 'Abertura.\n\n> Oi, tudo bem? Vi que\n\n')
  assert.equal(streamingPreview('A\n<mensagem_pronta>Oi</mensagem_pronta>\nDepois'), 'A\n\n> Oi\n\nDepois')
})
