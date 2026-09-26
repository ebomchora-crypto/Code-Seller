import assert from 'node:assert/strict'
import test from 'node:test'

import { markdownToHtml } from './printDocument.ts'

test('converte títulos, negrito, listas e parágrafos, escapando HTML', () => {
  const html = markdownToHtml('# Contrato\n\n**Cláusula 1** <b>x</b>\n\n- um\n- dois\n\n1. primeiro')
  assert.equal(
    html,
    '<h2>Contrato</h2>\n<p><strong>Cláusula 1</strong> &lt;b&gt;x&lt;/b&gt;</p>\n<ul>\n<li>um</li>\n<li>dois</li>\n</ul>\n<ol>\n<li>primeiro</li>\n</ol>',
  )
})
