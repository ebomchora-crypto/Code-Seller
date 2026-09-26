import assert from 'node:assert/strict'
import test from 'node:test'

import { getChatSubmission, shouldSubmitChat } from './composer.utils.ts'

test('normaliza a mensagem antes do envio e rejeita conteúdo vazio', () => {
  assert.equal(getChatSubmission('  analisar pipeline  '), 'analisar pipeline')
  assert.equal(getChatSubmission('   \n '), null)
})

test('Enter envia, enquanto Shift+Enter mantém a quebra de linha', () => {
  assert.equal(shouldSubmitChat('Enter', false), true)
  assert.equal(shouldSubmitChat('Enter', true), false)
  assert.equal(shouldSubmitChat('a', false), false)
})
