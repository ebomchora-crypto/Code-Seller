import assert from 'node:assert/strict'
import test from 'node:test'

import { frameDocument, runWithLimit, slugify, splitStreamEnd, tokenizeHtml, visibleStreamText } from './codeMakerStream.ts'

test('separa o texto da IA da linha de controle', () => {
  assert.deepEqual(splitStreamEnd('<section>oi</section>\n<<<OK>>>'), { text: '<section>oi</section>', end: { kind: 'ok' } })
  assert.deepEqual(splitStreamEnd('abc\n<<<CONTINUA>>>'), { text: 'abc', end: { kind: 'continue' } })
  assert.deepEqual(splitStreamEnd('abc\n<<<ERRO:A IA não respondeu.>>>'), { text: 'abc', end: { kind: 'error', message: 'A IA não respondeu.' } })
  assert.deepEqual(splitStreamEnd('<div>ainda chegando'), { text: '<div>ainda chegando', end: null })
})

test('não mostra a linha de controle chegando pela metade', () => {
  assert.equal(visibleStreamText('<p>oi</p>\n<<<CONT'), '<p>oi</p>')
  assert.equal(visibleStreamText('<p>oi</p>\n<'), '<p>oi</p>')
  assert.equal(visibleStreamText('<p>oi</p>\n<div'), '<p>oi</p>\n<div')
})

test('a prévia ganha o script de links e rolagem antes do </body>', () => {
  const doc = frameDocument('<html><body><a href="#contato">x</a></body></html>', { scrollY: 320 })
  assert.match(doc, /scroll-margin-top/)
  assert.match(doc, /var start=320;/)
  assert.ok(doc.indexOf('<script>') < doc.lastIndexOf('</body>'))
  assert.ok(doc.endsWith('</body></html>'))
})

test('apelido do link', () => {
  assert.equal(slugify('Barbearia do João!'), 'barbearia-do-joao')
  assert.equal(slugify('  Clínica  Sorriso & Cia  '), 'clinica-sorriso-cia')
})

test('cores do código só dentro das tags', () => {
  const tokens = tokenizeHtml('<a href="#x" class="btn">Olá "mundo"</a>')
  assert.deepEqual(
    tokens.map((token) => token.kind),
    ['tag', 'attr', 'text', 'string', 'attr', 'text', 'string', 'tag', 'text', 'tag', 'tag'],
  )
  assert.equal(tokens.map((token) => token.value).join(''), '<a href="#x" class="btn">Olá "mundo"</a>')
})

test('roda no máximo N tarefas ao mesmo tempo', async () => {
  let running = 0
  let peak = 0
  const done = []
  await runWithLimit([1, 2, 3, 4, 5, 6], 4, async (item) => {
    running += 1
    peak = Math.max(peak, running)
    await new Promise((resolve) => setTimeout(resolve, 5))
    running -= 1
    done.push(item)
  })
  assert.equal(peak, 4)
  assert.equal(done.length, 6)
})
