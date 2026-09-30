import assert from 'node:assert/strict'
import test from 'node:test'

import { applyQuickPromptDraft, getChatSubmission, shouldSubmitChat } from './composer.utils.ts'

test('normaliza a mensagem antes do envio e rejeita conteúdo vazio', () => {
  assert.equal(getChatSubmission('  analisar pipeline  '), 'analisar pipeline')
  assert.equal(getChatSubmission('   \n '), null)
})

test('Enter envia, enquanto Shift+Enter mantém a quebra de linha', () => {
  assert.equal(shouldSubmitChat('Enter', false), true)
  assert.equal(shouldSubmitChat('Enter', true), false)
  assert.equal(shouldSubmitChat('a', false), false)
})

test('atalho preenche o compositor vazio sem apagar texto já escrito', () => {
  const draft = 'Cole a conversa abaixo:\n\n'
  assert.equal(applyQuickPromptDraft('', draft), draft)
  assert.equal(applyQuickPromptDraft('Meu contexto', draft), 'Meu contexto')
})

test('mensagens muito longas não são cortadas no frontend', () => {
  const long = 'contexto '.repeat(20000)
  assert.equal(getChatSubmission(long), long.trim())
})
