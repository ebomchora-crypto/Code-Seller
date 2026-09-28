import assert from 'node:assert/strict'
import test from 'node:test'

import { buildFirstMessage, extractTaskMessage } from './firstMessage.ts'

test('barbearia sem site, com boa reputação', () => {
  const message = buildFirstMessage({
    businessName: 'Barbearia do João',
    niche: 'Barbearia',
    city: 'Campinas',
    websiteKind: 'none',
    rating: 4.8,
    reviews: 120,
    offer: 'site',
    myName: 'Arthur Filipe',
    myCompany: 'Code Sellers',
  })
  assert.match(message, /^Oi, tudo bem\? Aqui é Arthur, da Code Sellers\./)
  assert.match(message, /Encontrei o perfil de vocês aqui em Campinas e vi que vocês ainda não têm um site\./)
  assert.match(message, /120 avaliações com nota 4,8/)
  assert.match(message, /cortar o cabelo/)
  assert.match(message, /sites profissionais/)
  assert.match(message, /Posso te mostrar em 2 minutos/)
})

test('nicho por palavra-chave e sem acento', () => {
  assert.match(buildFirstMessage({ businessName: 'X', niche: 'Clínica Odontológica' }), /profissional de saúde/)
  assert.match(buildFirstMessage({ businessName: 'X', niche: 'Auto Center' }), /carro dá problema/)
  assert.match(buildFirstMessage({ businessName: 'X', niche: 'Pizzaria' }), /onde comer/)
  assert.match(buildFirstMessage({ businessName: 'X', niche: 'Algo raro' }), /pesquisa pela internet/)
})

test('só redes sociais, e oferta de automação', () => {
  assert.match(buildFirstMessage({ businessName: 'X', websiteKind: 'social' }), /só pelas redes sociais/)
  const automation = buildFirstMessage({ businessName: 'X', offer: 'automation', reviews: 5 })
  assert.match(automation, /automações no WhatsApp/)
  assert.doesNotMatch(automation, /site/)
})

test('sem nome do vendedor', () => {
  assert.match(buildFirstMessage({ businessName: 'X' }), /^Oi, tudo bem\?\n\n/)
})

test('extrai a mensagem da descrição da tarefa', () => {
  assert.equal(
    extractTaskMessage('Mensagem pronta:\nOi!\n\nTudo bem?\n\nAbra a tarefa e toque em "Enviar no WhatsApp".'),
    'Oi!\n\nTudo bem?',
  )
  assert.equal(
    extractTaskMessage('Mensagem sugerida:\nOlá de novo\n\nAbra o contato e use "Mensagem pronta" para enviar pelo WhatsApp.'),
    'Olá de novo',
  )
  assert.equal(extractTaskMessage('Ligar amanhã'), null)
  assert.equal(extractTaskMessage(null), null)
})
