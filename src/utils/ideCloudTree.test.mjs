import assert from 'node:assert/strict'
import test from 'node:test'
import { assemblePages, assembleSite } from '../../supabase/functions/code-maker/site.ts'
import { assemble, fromIdeTree, isSitePath, toIdeTree } from '../../ide/src/lib/cloud/tree.ts'

const plan = {
  title: 'Lima Advocacia', description: 'Advocacia trabalhista', direction: '', theme: 'light', lang: 'pt-BR',
  palette: { brand: '#1f3a5f', brandDark: '#14263f', accent: '#c9a227', ink: '#111827', paper: '#fafaf9', surface: '#f1efe9', muted: '#6b7280' },
  fonts: { display: 'Fraunces', body: 'Inter' }, radius: 'soft', cta: 'Fale conosco', tagline: 'Defesa do trabalhador', effects: [],
  sections: [{ id: 'hero', label: 'Início', brief: 'abertura', bg: 'paper', layout: 'hero-split', headline: 'Seus direitos' }, { id: 'artigos', label: 'Artigos', brief: '', bg: 'surface', photos: 2 }],
}
const parts = {
  header: '<header data-header class="fixed"><nav><a href="#artigos">Artigos</a></nav></header>',
  hero: '<section id="hero"><h1>Advocacia trabalhista</h1></section>',
  artigos: '<section id="artigos"><h2>Artigos</h2><article><h3>Rescisão</h3><p>Resumo.</p></article></section>',
  footer: '<footer><p>© Lima</p></footer>',
}
const files = { 'estilos.css': '.x{color:red}\n', 'script.js': 'console.log(1)\n', 'paginas/publicacoes.html': '<section><h1>Publicações</h1></section>' }
const state = { plan, parts, files }

test('abrir na IDE e salvar sem mexer em nada não muda o site (ida e volta sem perdas)', () => {
  const back = fromIdeTree(toIdeTree(state), state)
  assert.deepEqual(back.parts, parts)
  assert.deepEqual(back.files, files)
  assert.deepEqual(back.plan, plan)
  assert.equal(assemble(back).html, assembleSite(plan, parts, { files }))
  assert.deepEqual(assemble(back).pages_html, assemblePages(plan, parts, files))
})

test('editar um arquivo na IDE muda só ele e aparece no site montado', () => {
  const tree = toIdeTree(state)
  tree['/secoes/hero.html'] = '<section id="hero"><h1>Advocacia EDITADA</h1></section>'
  const back = fromIdeTree(tree, state)
  assert.equal(back.parts.hero.includes('EDITADA'), true)
  assert.equal(back.parts.artigos, parts.artigos)
  assert.equal(assemble(back).html.includes('Advocacia EDITADA'), true)
})

test('site.json muda cores e ordem; seção nova entra no plano; seção apagada sai', () => {
  const tree = toIdeTree(state)
  const json = JSON.parse(tree['/site.json']); json.cores.brand = '#ff0000'; json.secoes.reverse()
  tree['/site.json'] = JSON.stringify(json)
  tree['/secoes/contato.html'] = '<section id="contato"><h2>Contato</h2></section>'
  delete tree['/secoes/artigos.html']
  const back = fromIdeTree(tree, state)
  assert.equal(back.plan.palette.brand, '#ff0000')
  assert.deepEqual(back.plan.sections.map(item => item.id), ['hero', 'contato'])
  assert.equal(back.parts.artigos, undefined)
})

test('site.json inválido durante a digitação não derruba o resto', () => {
  const tree = toIdeTree(state); tree['/site.json'] = '{ "titulo": '
  const back = fromIdeTree(tree, state)
  assert.deepEqual(back.plan, plan)
})

test('só os arquivos do projeto são aceitos', () => {
  assert.equal(isSitePath('/secoes/hero.html'), true)
  assert.equal(isSitePath('/estilos.css'), true)
  assert.equal(isSitePath('/package.json'), false)
  assert.equal(isSitePath('/index.html'), false)
})
