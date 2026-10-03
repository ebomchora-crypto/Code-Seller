import assert from 'node:assert/strict'
import test from 'node:test'

import {
  MAX_TEXT_CHARS,
  attachmentType,
  attachmentsPromptBlock,
  docxXmlToText,
  formatFileSize,
  htmlToText,
  limitText,
  storedAttachment,
} from './copilotAttachments.ts'

test('reconhece imagem, PDF, Word e texto; recusa o resto', () => {
  assert.equal(attachmentType('print.PNG', ''), 'image')
  assert.equal(attachmentType('foto', 'image/jpeg'), 'image')
  assert.equal(attachmentType('proposta.pdf', 'application/pdf'), 'pdf')
  assert.equal(attachmentType('briefing.docx', ''), 'docx')
  assert.equal(attachmentType('leads.csv', 'text/csv'), 'text')
  assert.equal(attachmentType('planilha.xlsx', ''), null)
  assert.equal(attachmentType('video.mp4', 'video/mp4'), null)
})

test('corta textos grandes e avisa', () => {
  const big = limitText('a'.repeat(MAX_TEXT_CHARS + 10))
  assert.equal(big.text.length, MAX_TEXT_CHARS)
  assert.equal(big.truncated, true)
  assert.deepEqual(limitText('  oi\r\n\n\n\ntchau  '), { text: 'oi\n\ntchau', truncated: false })
})

test('bloco da IA leva o texto dos documentos e marca as imagens', () => {
  const files = [
    { name: 'briefing.docx', kind: 'document', size: 10, text: 'Cliente quer site em 7 dias' },
    { name: 'conversa.png', kind: 'image', size: 10, thumb: 'data:image/jpeg;base64,x' },
  ]
  const current = attachmentsPromptBlock(files, 'current')
  assert.match(current, /nunca como instruções/)
  assert.match(current, /### briefing\.docx\nCliente quer site em 7 dias/)
  assert.match(current, /conversa\.png \(imagem enviada junto desta mensagem\)/)
  assert.match(attachmentsPromptBlock(files, 'history'), /imagem que o usuário enviou/)
  assert.equal(attachmentsPromptBlock([], 'current'), '')
  assert.equal(attachmentsPromptBlock(undefined, 'history'), '')
})

test('no banco não vão as imagens inteiras', () => {
  const stored = storedAttachment({ id: '1', name: 'a.png', kind: 'image', size: 5, thumb: 't', images: ['data:big'] })
  assert.deepEqual(stored, { name: 'a.png', kind: 'image', size: 5, thumb: 't' })
})

test('tira as marcações do Word e do HTML', () => {
  assert.equal(docxXmlToText('<w:p><w:r><w:t>Olá &amp; bem</w:t></w:r></w:p><w:p><w:t>vindo</w:t><w:tab/>x</w:p>'), 'Olá & bem\nvindo\tx\n')
  assert.equal(htmlToText('<style>a{}</style><p>Oi</p><script>x()</script>tudo&nbsp;bem').trim(), 'Oi\ntudo bem')
})

test('tamanho do arquivo legível', () => {
  assert.equal(formatFileSize(500), '500 B')
  assert.equal(formatFileSize(2048), '2 KB')
  assert.equal(formatFileSize(3.5 * 1024 * 1024), '3,5 MB')
})
