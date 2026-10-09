import assert from 'node:assert/strict'
import test from 'node:test'
import { assemblePages, assembleSite, pageSlugs } from '../../supabase/functions/code-maker/site.ts'
import {
  applyProjectEdit,
  changeReport,
  fileIndex,
  parseProjectEdit,
  projectTree,
  selectFiles,
} from '../../supabase/functions/code-maker/project.ts'
import { frameDocument, internalPageLink } from './codeMakerStream.ts'

const plan = {
  title: 'Escritório Lima',
  description: 'Advocacia',
  direction: '',
  theme: 'light',
  palette: { brand: '#1f3a5f', brandDark: '#14263f', accent: '#c9a227', ink: '#111827', paper: '#fafaf9', surface: '#f1efe9', muted: '#6b7280' },
  fonts: { display: 'Fraunces', body: 'Inter' },
  sections: [
    { id: 'hero', label: 'Início', brief: '', bg: 'paper' },
    { id: 'artigos', label: 'Artigos', brief: '', bg: 'surface' },
  ],
}
const parts = {
  header: '<header data-header class="fixed"><nav><a href="#artigos">Artigos</a></nav></header>',
  hero: '<section id="hero"><h1>Advocacia trabalhista</h1></section>',
  artigos: '<section id="artigos"><h2>Artigos</h2><article><h3>Rescisão</h3><p>Resumo curto.</p></article></section>',
  footer: '<footer><p>© Escritório Lima</p></footer>',
}
const brief = { businessName: 'Escritório Lima' }

test('o projeto vira uma árvore de arquivos-fonte (não o HTML montado)', () => {
  const tree = projectTree(plan, parts, { 'estilos.css': '.x{color:red}\n', 'paginas/publicacoes.html': '<section><h1>Publicações</h1></section>' })
  assert.deepEqual(Object.keys(tree), ['site.json', 'secoes/header.html', 'secoes/hero.html', 'secoes/artigos.html', 'secoes/footer.html', 'paginas/publicacoes.html', 'estilos.css'])
  assert.equal(tree['secoes/artigos.html'], parts.artigos)
  const json = JSON.parse(tree['site.json'])
  assert.equal(json.cores.brand, '#1f3a5f')
  assert.deepEqual(json.paginas, ['paginas/publicacoes.html'])
  assert.match(fileIndex(tree), /secoes\/artigos\.html \(\d+ caracteres\) — títulos: Artigos \| Rescisão/)
})

test('edição real: trecho trocado no arquivo, página criada, CSS e JS validados, relatório só do que mudou', () => {
  const edit = parseProjectEdit(`<acoes>
- Completei o artigo
- Criei a página de publicações
</acoes>
<editar arquivo="secoes/artigos.html">{"antes":"<p>Resumo curto.</p>","depois":"<p>Resumo curto.</p><details><summary>Ler artigo completo</summary><p>Texto completo sobre rescisão.</p></details>"}</editar>
<escrever arquivo="paginas/publicacoes.html"><section id="lista"><h1>Publicações</h1><p>Lista</p></section></escrever>
<editar arquivo="secoes/header.html">{"antes":"<a href=\\"#artigos\\">Artigos</a>","depois":"<a href=\\"#artigos\\">Artigos</a><a href=\\"publicacoes.html\\">Publicações</a>"}</editar>
<escrever arquivo="estilos.css">@media (max-width: 640px) { h1 { font-size: 2rem } }</escrever>
<escrever arquivo="script.js">document.querySelectorAll('[data-filtro]').forEach(function (b) { b.addEventListener('click', function () {}) })</escrever>
<editar arquivo="secoes/hero.html">{"antes":"texto que não existe","depois":"x"}</editar>
<escrever arquivo="index.html"><p>não</p></escrever>`)
  assert.equal(edit.operations.length, 7)
  const result = applyProjectEdit(plan, parts, {}, edit, { brief })
  assert.match(result.parts.artigos, /Texto completo sobre rescisão/)
  assert.match(result.parts.header, /href="publicacoes\.html"/)
  assert.match(result.files['paginas/publicacoes.html'], /<h1>Publicações<\/h1>/)
  assert.match(result.files['estilos.css'], /max-width: 640px/)
  assert.match(result.files['script.js'], /data-filtro/)
  assert.deepEqual(result.changes.map((change) => `${change.change}:${change.path}`).sort(), [
    'alterado:secoes/artigos.html', 'alterado:secoes/header.html', 'alterado:site.json',
    'criado:estilos.css', 'criado:paginas/publicacoes.html', 'criado:script.js',
  ])
  const failed = result.results.filter((item) => !item.ok)
  assert.deepEqual(failed.map((item) => item.path), ['secoes/hero.html', 'index.html'])
  assert.match(failed[0].reason, /não encontrado/)
  const report = changeReport(result.changes, result.results)
  assert.ok(report.some((line) => /^Arquivo criado: paginas\/publicacoes\.html$/.test(line)))
  assert.match(report.at(-1), /^Não aplicado \(2\)/)

  // Montagem: a página inicial e a página extra levam o CSS e o JS do projeto.
  const home = assembleSite(result.plan, result.parts, { files: result.files })
  assert.match(home, /<style data-arquivo="estilos\.css">/)
  assert.match(home, /<script data-arquivo="script\.js">/)
  assert.match(home, /Texto completo sobre rescisão/)
  const pages = assemblePages(result.plan, result.parts, result.files)
  assert.deepEqual(Object.keys(pages), ['publicacoes'])
  assert.match(pages.publicacoes, /<title>Publicações · Escritório Lima<\/title>/)
  assert.match(pages.publicacoes, /<header data-header/)
  assert.match(pages.publicacoes, /<main id="conteudo" data-pagina="publicacoes">/)
  assert.doesNotMatch(pages.publicacoes, /Rescisão/)
})

test('validação: JS com erro, CSS quebrado, script dentro do HTML e caminho fora do projeto não entram', () => {
  const edit = parseProjectEdit(`<escrever arquivo="script.js">function ( {</escrever>
<escrever arquivo="estilos.css">.a { color: red</escrever>
<escrever arquivo="paginas/x.html"><section><script>alert(1)</script></section></escrever>
<escrever arquivo="../segredo.txt">x</escrever>
<apagar arquivo="secoes/header.html"/>`)
  const result = applyProjectEdit(plan, parts, {}, edit, { brief })
  assert.equal(result.changes.length, 0)
  const reasons = result.results.map((item) => item.reason)
  assert.match(reasons[0], /sintaxe/)
  assert.match(reasons[1], /chaves/)
  assert.match(reasons[2], /script\.js/)
  assert.match(reasons[3], /fora do projeto/)
  assert.match(reasons[4], /não podem ser apagados/)
})

test('seção nova entra no plano na posição pedida; apagar remove do plano; site.json muda cores e ordem', () => {
  const edit = parseProjectEdit(`<escrever arquivo="secoes/contato.html" depois="hero" rotulo="Contato"><section id="contato"><h2>Fale conosco</h2></section></escrever>
<apagar arquivo="secoes/artigos.html"/>
<editar arquivo="site.json">{"antes":"\\"brand\\": \\"#1f3a5f\\"","depois":"\\"brand\\": \\"#0f766e\\""}</editar>`)
  const result = applyProjectEdit(plan, parts, {}, edit, { brief })
  assert.deepEqual(result.plan.sections.map((section) => section.id), ['hero', 'contato'])
  assert.equal(result.plan.sections[1].label, 'Contato')
  assert.equal(result.parts.artigos, undefined)
  assert.equal(result.plan.palette.brand, '#0f766e')
})

test('formato antigo da alteração continua funcionando (convertido para arquivos)', () => {
  const edit = parseProjectEdit(`<substituir id="hero">{"antes":"Advocacia trabalhista","depois":"Advocacia trabalhista e cível"}</substituir>
<tema>{"palette":{"accent":"#e11d48"}}</tema>
<remover id="artigos"/>`)
  const result = applyProjectEdit(plan, parts, {}, edit, { brief })
  assert.match(result.parts.hero, /trabalhista e cível/)
  assert.equal(result.plan.palette.accent, '#e11d48')
  assert.equal(result.parts.artigos, undefined)
})

test('projeto grande: vão inteiros os de configuração, os escolhidos e os citados no pedido', () => {
  const big = { ...parts }
  for (let i = 0; i < 12; i++) big[`extra${i}`] = `<section id="extra${i}"><h2>Bloco ${i}</h2>${'x'.repeat(5000)}</section>`
  const bigPlan = { ...plan, sections: [...plan.sections, ...Array.from({ length: 12 }, (_, i) => ({ id: `extra${i}`, label: `Extra ${i}`, brief: '', bg: 'paper' }))] }
  const tree = projectTree(bigPlan, big, {})
  const all = selectFiles(tree, 'qualquer coisa', 1_000_000)
  assert.equal(all.length, Object.keys(tree).length)
  const picked = selectFiles(tree, 'Adicione textos completos em todos os artigos', 12000, ['secoes/extra3.html'])
  assert.ok(picked.includes('site.json'))
  assert.ok(picked.includes('secoes/header.html'))
  assert.ok(picked.includes('secoes/artigos.html'))
  assert.ok(picked.includes('secoes/extra3.html'))
  assert.ok(!picked.includes('secoes/extra7.html'))
})

test('links entre páginas: o quadro reconhece e manda para quem mostra o site', () => {
  assert.deepEqual(internalPageLink('publicacoes.html'), { page: 'publicacoes', hash: '' })
  assert.deepEqual(internalPageLink('./paginas/publicacoes.html'), { page: 'publicacoes', hash: '' })
  assert.deepEqual(internalPageLink('index.html#contato'), { page: '', hash: '#contato' })
  assert.equal(internalPageLink('https://outro.site/a.html'), null)
  const doc = frameDocument('<body><a href="publicacoes.html">x</a></body>', { page: 'publicacoes', hash: '#topo' })
  const script = doc.match(/<script>([\s\S]*?)<\/script>/)[1]
  assert.doesNotThrow(() => new Function(script))
  assert.match(script, /codeMakerPage/)
  assert.deepEqual(pageSlugs({ 'paginas/b.html': 'x', 'paginas/a.html': 'y', 'estilos.css': 'z' }), ['a', 'b'])
})
