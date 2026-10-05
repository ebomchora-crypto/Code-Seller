import assert from 'node:assert/strict'
import test from 'node:test'

import {
  applyEdit,
  assembleSite,
  balanceHtml,
  cleanFragment,
  joinContinuation,
  normalizePart,
  normalizePlan,
  parseEdit,
  parsePart,
  parsePlan,
  partOrder,
  photoCatalog,
  photoPlan,
  photosFor,
  stripMissingInfo,
  usedPhotos,
  buildPartMessage,
} from '../../supabase/functions/code-maker/site.ts'

const brief = { businessName: 'Barbearia do João', niche: 'Barbearia', city: 'Campinas', phone: '19998887777' }

const rawPlan = {
  title: 'Barbearia do João — Campinas',
  description: 'Corte e barba em Campinas.',
  direction: 'Escuro com dourado.',
  theme: 'dark',
  palette: { brand: '#d4a017', brandDark: '#a67c00', accent: 'vermelho', ink: '#f5f5f4', paper: '#0c0a09', surface: '#1c1917', muted: '#a8a29e' },
  fonts: { display: 'Playfair Display', body: 'Inter<script>' },
  sections: [
    { id: 'servicos', label: 'Serviços', brief: 'Cortes', bg: 'surface' },
    { id: 'Hero', label: 'Início', brief: 'Topo', bg: 'paper' },
    { id: 'servicos', label: 'Repetida', brief: '', bg: 'paper' },
    { id: 'footer', label: 'x', brief: '', bg: 'paper' },
    { id: 'Dúvidas Frequentes', label: 'FAQ', brief: 'Perguntas', bg: 'roxo' },
  ],
}

test('plano: hero primeiro, ids limpos, sem repetidos, cores e fontes seguras', () => {
  const plan = normalizePlan(rawPlan, brief)
  assert.deepEqual(plan.sections.map((section) => section.id), ['hero', 'servicos', 'duvidas-frequentes'])
  assert.equal(plan.sections[2].bg, 'paper')
  assert.equal(plan.palette.brand, '#d4a017')
  assert.equal(plan.palette.accent, '#f59e0b') // inválida → padrão
  assert.equal(plan.fonts.body, 'Interscript')
  assert.deepEqual(partOrder(plan), ['header', 'hero', 'servicos', 'duvidas-frequentes', 'footer'])
})

test('lê plano e ações da resposta da IA', () => {
  const text = `<acoes>\n- Escolhi tons escuros\n- Separei 3 seções\n</acoes>\n<plano>\n${JSON.stringify(rawPlan)}\n</plano>`
  const { actions, plan } = parsePlan(text, brief)
  assert.deepEqual(actions, ['Escolhi tons escuros', 'Separei 3 seções'])
  assert.equal(plan.theme, 'dark')
  assert.equal(parsePlan('<plano>{quebrado</plano>', brief).plan, null)
})

test('parte: tira cercas, scripts, estilos e eventos; sabe se terminou', () => {
  const { html, complete } = parsePart(
    '```html\n<section id="x" onclick="alert(1)"><script>alert(1)</script><style>p{}</style><p>Oi</p></section>\n```',
  )
  assert.equal(html, '<section id="x"><p>Oi</p></section>')
  assert.equal(complete, true)
  assert.equal(parsePart('```html\n<section><p>ainda escre').complete, false)
  assert.equal(cleanFragment('<!doctype html><html><body><div>a</div></body></html>'), '<div>a</div>')
})

test('monta o documento com a base, as partes na ordem e o carregamento', () => {
  const plan = normalizePlan(rawPlan, brief)
  const html = assembleSite(plan, { header: '<header data-header>H</header>', hero: '<section id="hero">Topo</section>' }, { pending: true })
  assert.match(html, /^<!doctype html>/)
  assert.match(html, /cdn\.tailwindcss\.com/)
  assert.match(html, /"brand":\{"DEFAULT":"#d4a017","dark":"#a67c00"\}/)
  assert.match(html, /family=Playfair\+Display/)
  assert.ok(html.indexOf('data-header') < html.indexOf('id="hero"'))
  assert.match(html, /id="servicos" class="bg-surface py-24"/) // ainda carregando
  assert.match(html, /IntersectionObserver/)
  assert.doesNotMatch(assembleSite(plan, {}), /animate-pulse/)
})

test('alteração: troca parte, cria seção nova, remove seção e muda cores', () => {
  const plan = normalizePlan(rawPlan, brief)
  const parts = { header: 'H', hero: 'T', servicos: 'S', 'duvidas-frequentes': 'F', footer: 'R' }
  const edit = parseEdit(`<acoes>\n- Troquei o topo\n</acoes>
<parte id="hero"><section id="hero">Novo topo</section></parte>
<parte id="precos" depois="servicos" rotulo="Preços"><section id="precos">P</section></parte>
<remover id="duvidas-frequentes"/>
<tema>{"palette":{"brand":"#2563eb","ink":"azul"}}</tema>`)
  assert.deepEqual(edit.actions, ['Troquei o topo'])
  const next = applyEdit(plan, parts, edit)
  assert.equal(next.parts.hero, '<section id="hero">Novo topo</section>')
  assert.deepEqual(next.plan.sections.map((section) => section.id), ['hero', 'servicos', 'precos'])
  assert.equal(next.plan.sections[2].label, 'Preços')
  assert.equal(next.parts['duvidas-frequentes'], undefined)
  assert.equal(next.plan.palette.brand, '#2563eb')
  assert.equal(next.plan.palette.ink, '#f5f5f4') // cor inválida ignorada
  assert.equal(plan.palette.brand, '#d4a017') // original intacto
})

test('continuação junta sem repetir o trecho reescrito', () => {
  const previous = '<section id="a">\n  <h2 class="text-4xl">Serviços que'
  assert.equal(joinContinuation(previous, '<h2 class="text-4xl">Serviços que fazem diferença</h2>'), `${previous} fazem diferença</h2>`)
  assert.equal(joinContinuation('abc', 'def'), 'abcdef')
  assert.equal(joinContinuation(previous, '```html\n fazem'), `${previous} fazem`)
})

test('fotos por nicho, sempre com as gerais no fim', () => {
  assert.equal(photosFor('Barbearia')[0].id, '1503951914875-452162b0f3f1')
  assert.equal(photosFor('Clínica Odontológica')[0].id, '1629909613654-28e377c37b09')
  assert.equal(photosFor('Algo desconhecido').length, 6)
  assert.match(photoCatalog('Pet shop'), /^- https:\/\/images\.unsplash\.com\/photo-1548199973-03cce0bbc87b\?auto=format&fit=crop&w=1600&q=80 — /)
})

test('cada seção recebe fotos diferentes (as partes são escritas em paralelo)', () => {
  const plan = normalizePlan(
    {
      sections: [
        { id: 'hero', photos: 2, layout: 'hero', headline: 'Apartamentos perto do metrô' },
        { id: 'imoveis', photos: 3, layout: 'cards-foto' },
        { id: 'sobre', layout: 'split' },
        { id: 'faq', layout: 'faq' },
        { id: 'contato', photos: 9, layout: 'nada' },
      ],
    },
    { businessName: 'D House', niche: 'Imobiliária' },
  )
  assert.equal(plan.sections[0].headline, 'Apartamentos perto do metrô')
  assert.equal(plan.sections[4].layout, undefined) // formato desconhecido some
  assert.equal(plan.sections[4].photos, 4) // no máximo 4
  const photos = photoPlan(plan, { businessName: 'D House', niche: 'Imobiliária' })
  assert.equal(photos.hero.length, 2)
  assert.equal(photos.imoveis.length, 3)
  assert.equal(photos.sobre.length, 1) // padrão
  assert.equal(photos.faq.length, 0)
  const all = Object.values(photos).flat().map((photo) => photo.url)
  assert.equal(new Set(all).size, all.length)
  // Fotos do próprio negócio vêm antes das de banco.
  const own = photoPlan(plan, { businessName: 'D', niche: 'Imobiliária', assets: [{ url: 'https://x/site-assets/u/a.jpg', kind: 'photo' }] })
  assert.equal(own.hero[0].url, 'https://x/site-assets/u/a.jpg')
  // A mensagem de cada parte só traz as fotos dela, com o título a usar.
  const message = buildPartMessage('imoveis', plan, { businessName: 'D House', niche: 'Imobiliária' })
  assert.match(message, /FOTOS DESTA SEÇÃO/)
  assert.equal((message.match(/images\.unsplash\.com/g) ?? []).length, 3)
  assert.match(message, /não repita nem parafraseie\): "Apartamentos perto do metrô"/)
  assert.match(buildPartMessage('faq', plan, { businessName: 'D House', niche: 'Imobiliária' }), /NÃO usa foto/)
  assert.ok(usedPhotos({ a: '<img src="https://images.unsplash.com/photo-1?w=800">' }).has('https://images.unsplash.com/photo-1'))
})

test('tira frases sobre dado que falta', () => {
  const html = '<div><p class="a">Número não informado</p><p>Fale com a gente</p><span>Imagem ilustrativa</span><p>A história da empresa poderá ser apresentada aqui quando essas informações forem fornecidas.</p></div>'
  assert.equal(stripMissingInfo(html), '<div><p>Fale com a gente</p></div>')
})

test('tira do plano os números que ninguém informou', async () => {
  const { stripInventedClaims, normalizePlan } = await import('../../supabase/functions/code-maker/site.ts')
  const semDados = { businessName: 'Oficina X', niche: 'Oficina' }
  assert.equal(
    stripInventedClaims('História da oficina, destacando os 15 anos de estrada. Foto do time trabalhando.', semDados),
    'Foto do time trabalhando.',
  )
  assert.equal(stripInventedClaims('Confiança desde 2010. Diagnóstico honesto.', semDados), 'Diagnóstico honesto.')
  assert.equal(stripInventedClaims('4,8 estrelas de 300 clientes. Serviços.', semDados), 'Serviços.')
  // Informado pela pessoa: fica.
  const comDados = { businessName: 'Oficina X', details: 'Estamos desde 2010 no bairro.' }
  assert.equal(stripInventedClaims('Confiança desde 2010.', comDados), 'Confiança desde 2010.')
  const plan = normalizePlan(
    { sections: [{ id: 'hero', brief: 'Topo.' }, { id: 'numeros', brief: '3.200 carros atendidos.' }, { id: 'depoimentos', brief: 'x' }, { id: 'contato', brief: 'Contato.' }] },
    semDados,
  )
  assert.deepEqual(plan.sections.map((section) => section.id), ['hero', 'contato'])
  const real = normalizePlan({ sections: [{ id: 'hero' }, { id: 'depoimentos' }] }, { ...semDados, rating: 4.8, reviews: 120 })
  assert.deepEqual(real.sections.map((section) => section.id), ['hero', 'depoimentos'])
})

test('contraste: no tema escuro o fundo "ink" é claro e pede texto escuro', async () => {
  const { textOn, contrastGuide, contrastRatio } = await import('../../supabase/functions/code-maker/site.ts')
  const dark = { palette: { brand: '#c8963e', brandDark: '#8a6524', accent: '#d9a441', ink: '#f4f0e8', paper: '#171615', surface: '#242220', muted: '#c0b8ac' } }
  assert.equal(textOn(dark, 'paper'), 'ink')
  assert.equal(textOn(dark, 'ink'), 'paper')
  const light = { palette: { brand: '#1d4ed8', brandDark: '#1e3a8a', accent: '#f59e0b', ink: '#111827', paper: '#fafaf9', surface: '#f1efe9', muted: '#6b7280' } }
  assert.equal(textOn(light, 'ink'), 'paper')
  assert.equal(textOn(light, 'paper'), 'ink')
  assert.equal(textOn(light, 'brand'), 'paper')
  assert.ok(contrastRatio('#000000', '#ffffff') > 20)
  assert.match(contrastGuide(dark), /bg-ink: texto text-paper/)
})

test('anexos: só da pasta do próprio usuário, com o endereço oficial', async () => {
  const { cleanAssets } = await import('../../supabase/functions/code-maker/site.ts')
  const base = 'https://abc.supabase.co'
  const own = 'http://localhost:8787/storage/v1/object/public/site-assets/u1/aa-bb.png'
  const other = 'https://abc.supabase.co/storage/v1/object/public/site-assets/u2/cc.jpg'
  const evil = 'https://abc.supabase.co/storage/v1/object/public/site-assets/u1/x.png" onerror="alert(1)'
  const assets = cleanAssets(
    [
      { url: own, kind: 'logo' },
      { url: `${base}/storage/v1/object/public/site-assets/u1/foto.jpg`, kind: 'logo' },
      { url: other, kind: 'photo' },
      { url: evil, kind: 'photo' },
      { url: 'https://site-de-fora.com/foto.jpg', kind: 'photo' },
    ],
    'u1',
    base,
  )
  assert.deepEqual(assets, [
    { url: `${base}/storage/v1/object/public/site-assets/u1/aa-bb.png`, kind: 'logo' },
    { url: `${base}/storage/v1/object/public/site-assets/u1/foto.jpg`, kind: 'photo' },
  ])
})

test('balanceHtml fecha tags abertas e ignora fechamentos soltos', () => {
  assert.equal(balanceHtml('<div><svg viewBox="0 0 1 1"><path d="M0 0"/>'), '<div><svg viewBox="0 0 1 1"><path d="M0 0"/></svg></div>')
  assert.equal(balanceHtml('<p>a</div></p><img src="x"><br>'), '<p>a</p><img src="x"><br>')
  assert.equal(balanceHtml('<a class="[&>*]:x" href="#">oi</a><div'), '<a class="[&>*]:x" href="#">oi</a>')
})

test('normalizePart deixa cada parte só com o seu bloco', () => {
  // Rodapé que veio com o site inteiro e um <svg> aberto (caso real).
  const footer =
    '<section id="contato"><svg><path d="x"/><footer class="mt-10">© Forno</footer></section>' +
    '<div>menu</div><main><section id="hero"><h1>Oi</h1></section>' +
    '<a href="https://wa.me/1" class="fixed bottom-5 right-5"><svg><path d="y"/></svg></a>'
  assert.equal(
    normalizePart('footer', footer),
    '<footer class="mt-10">© Forno</footer>\n<a href="https://wa.me/1" class="fixed bottom-5 right-5"><svg><path d="y"/></svg></a>',
  )
  // Cabeçalho sem a tag <header>: ganha a tag com data-header.
  assert.match(normalizePart('header', '<div>logo</div>'), /^<header data-header [^>]*>\n<div>logo<\/div>\n<\/header>$/)
  assert.equal(normalizePart('header', 'x<header class="fixed"><nav>a</nav></header><section>y</section>'), '<header data-header class="fixed"><nav>a</nav></header>')
  // Seção: pega a certa (com seções dentro) e corrige o id.
  assert.equal(
    normalizePart('galeria', '<header>h</header><section id="galeria" class="a"><section>in</section></section><section id="b"></section>'),
    '<section id="galeria" class="a"><section>in</section></section>',
  )
  assert.equal(normalizePart('faq', '<section class="bg-paper" id="duvidas"><p>q'), '<section class="bg-paper" id="duvidas"><p>q</p></section>')
  assert.equal(normalizePart('faq', '<section class="bg-paper"><p>q</p></section>'), '<section id="faq" class="bg-paper"><p>q</p></section>')
  // Rodapé sem <footer> que trouxe o site inteiro: descartado (usa o rodapé simples).
  assert.equal(normalizePart('footer', '<div>menu</div><main><section id="hero">x</section></main>'), '')
  // Rodapé escrito sem a tag <footer> (ex.: numa <div> ou <section>): vira rodapé.
  assert.equal(normalizePart('footer', '<div class="py-8">© Loja</div>'), '<footer>\n<div class="py-8">© Loja</div>\n</footer>')
  assert.equal(normalizePart('footer', '<section id="rodape"><p>© Loja</p></section>'), '<footer>\n<section id="rodape"><p>© Loja</p></section>\n</footer>')
  // A limpeza de <head> não pode apagar <header>.
  assert.equal(cleanFragment('<head><title>x</title></head><header data-header>a</header>'), '<title>x</title><header data-header>a</header>')
  // Idempotente: normalizar de novo não muda nada.
  const once = normalizePart('footer', footer)
  assert.equal(normalizePart('footer', once), once)
})
