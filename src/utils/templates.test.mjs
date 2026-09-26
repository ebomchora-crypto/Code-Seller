import assert from 'node:assert/strict'
import test from 'node:test'

import { DEFAULT_TEMPLATES, fillTemplate } from './templates.ts'

test('preenche as variáveis do contato, do negócio e suas', () => {
  const text = fillTemplate(DEFAULT_TEMPLATES[0].body, {
    nome: 'Clínica Sorriso',
    cidade: 'Ribeirão Preto',
    meu_nome: 'Arthur Filipe',
    minha_empresa: 'AQ Solutions',
  })
  assert.equal(
    text,
    'Oi, tudo bem? Aqui é Arthur, da AQ Solutions. Vi a Clínica Sorriso aqui em Ribeirão Preto e tive uma ideia de como um site pode trazer mais clientes para vocês. Posso te mandar um exemplo rápido?',
  )
})

test('assinatura sem empresa usa só o nome', () => {
  assert.equal(fillTemplate('Aqui é {assinatura}.', { meu_nome: 'Arthur' }), 'Aqui é Arthur.')
})

test('valor em reais e parênteses vazios somem', () => {
  assert.equal(fillTemplate('Proposta de {negocio}: {valor}.', { negocio: 'Site', valor: 1800 }).replace(/\u00a0/g, ' '), 'Proposta de Site: R$ 1.800.')
  assert.equal(fillTemplate('Pagamento de {negocio} ({valor}).', { negocio: 'Site' }), 'Pagamento de Site.')
})

test('variável desconhecida fica como está', () => {
  assert.equal(fillTemplate('Oi {apelido}', {}), 'Oi {apelido}')
})
