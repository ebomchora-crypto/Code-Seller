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
  assert.equal(plan.sections[4].layout, 'contato') // bloco desconhecido → o padrão da seção
  assert.equal(plan.sections[4].photos, 4) // no máximo 4
  const photos = photoPlan(plan, { businessName: 'D House', niche: 'Imobiliária' })
  assert.equal(photos.hero.length, 2)
  assert.equal(photos.imoveis.length, 4) // o que o bloco cards-foto mostra
  assert.equal(photos.sobre.length, 1)
  assert.equal(photos.faq.length, 1) // a coluna do título ganha uma foto
  assert.equal(photos.contato.length, 1)
  const all = Object.values(photos).flat().map((photo) => photo.url)
  assert.equal(new Set(all).size, all.length)
  // Fotos do próprio negócio vêm antes das de banco.
  const own = photoPlan(plan, { businessName: 'D', niche: 'Imobiliária', assets: [{ url: 'https://x/site-assets/u/a.jpg', kind: 'photo' }] })
  assert.equal(own.hero[0].url, 'https://x/site-assets/u/a.jpg')
  // A IA recebe só a descrição das fotos (para os alts), nunca as URLs.
  const message = buildPartMessage('imoveis', plan, { businessName: 'D House', niche: 'Imobiliária' })
  assert.match(message, /Fotos que o bloco mostra, na ordem/)
  assert.doesNotMatch(message, /https:\/\/images\.unsplash\.com/)
  assert.match(message, /não repita nem parafraseie\): "Apartamentos perto do metrô"/)
  const prices = normalizePlan({ sections: [{ id: 'hero' }, { id: 'precos', layout: 'lista-precos' }] }, { businessName: 'D' })
  assert.match(buildPartMessage('precos', prices, { businessName: 'D', niche: 'Imobiliária' }), /Este bloco não usa foto/)
  // O banco acabou: as seções seguintes ficam sem foto em vez de repetir.
  const many = normalizePlan({ sections: [{ id: 'hero', layout: 'hero-vitrine' }, ...Array.from({ length: 6 }, (_, i) => ({ id: `g${i}`, layout: 'galeria' }))] }, { businessName: 'D' })
  const short = Object.values(photoPlan(many, { businessName: 'D', niche: 'Escola' })).flat().map((photo) => photo.url)
  assert.equal(new Set(short).size, short.length)
  // Estética automotiva usa fotos de carro, não de salão de beleza.
  assert.match(photosFor('Estética automotiva')[0].about, /carro/)
  assert.ok(photosFor('Barbearia').every((photo) => !/escritório/.test(photo.about)))
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

test('alteração tolerante: espaços/aspas diferentes, texto repetido, parte errada e trecho ausente', async () => {
  const { applyEdit: apply, replaceInPart } = await import('../../supabase/functions/code-maker/site.ts')
  const plan = normalizePlan(rawPlan, brief)
  const parts = {
    header: '<header data-header><a href="#servicos">Serviços</a><a>Fale conosco</a></header>',
    hero: '<section id="hero"><h1 class="text-5xl">Cortes   de\n respeito</h1><a>Fale conosco</a></section>',
    servicos: '<section id="servicos"><p>Barba completa</p></section>',
  }
  assert.equal(replaceInPart(parts.hero, "<h1 class='text-5xl'>Cortes de respeito</h1>", '<h1>Cortes com estilo</h1>'), '<section id="hero"><h1>Cortes com estilo</h1><a>Fale conosco</a></section>')
  const next = apply(plan, parts, {
    actions: [], parts: [], removals: [], theme: { lang: 'pt-PT' },
    replacements: [
      { id: 'hero', before: 'Fale conosco', after: 'Fale connosco' },
      { id: 'hero', before: 'Barba completa', after: 'Barba feita' }, // parte errada
      { id: 'hero', before: 'texto que não existe', after: 'x' },
    ],
  })
  assert.match(next.parts.hero, /Fale connosco/)
  assert.match(next.parts.header, /Fale conosco/) // a parte indicada tinha o texto: só ela muda
  assert.equal(next.parts.servicos, '<section id="servicos"><p>Barba feita</p></section>')
  assert.equal(next.skipped, 1)
  assert.equal(next.plan.lang, 'pt-PT')
})

test('plano com marca registrada e cantos: guardados e entregues à seção certa', () => {
  const plan = normalizePlan(
    { ...rawPlan, radius: 'sharp', signature: 'Título gigante em caixa alta cortado pela foto da navalha.', signatureSection: 'Serviços' },
    brief,
  )
  assert.equal(plan.radius, 'sharp')
  assert.equal(plan.signature, 'Título gigante em caixa alta cortado pela foto da navalha.')
  const owner = plan.sections.some((section) => section.id === 'servicos') ? 'servicos' : 'hero'
  assert.equal(plan.signatureSection, owner)
  assert.match(buildPartMessage(owner, plan, brief), /MARCA REGISTRADA DO SITE[^\n]*navalha/)
  const other = plan.sections.find((section) => section.id !== owner).id
  assert.match(buildPartMessage(other, plan, brief), /fica em outra seção/)

  const loose = normalizePlan({ ...rawPlan, radius: 'oval', signature: 'Faixa com a lousa de giz', signatureSection: 'nao-existe' }, brief)
  assert.equal(loose.radius, undefined)
  assert.equal(loose.signatureSection, 'hero')
  assert.equal(normalizePlan(rawPlan, brief).signature, undefined)
})

test('base do site: conteúdo em <main>, atalho para pular o menu e menu do celular acessível', () => {
  const plan = normalizePlan(rawPlan, brief)
  const html = assembleSite(plan, { header: '<header data-header>H</header>', hero: '<section id="hero">Topo</section>', footer: '<footer>R</footer>' })
  assert.match(html, /<a href="#conteudo" class="skip-link">Pular para o conteúdo<\/a>/)
  assert.ok(html.indexOf('data-header') < html.indexOf('<main id="conteudo">'))
  assert.ok(html.indexOf('id="hero"') > html.indexOf('<main id="conteudo">'))
  assert.ok(html.indexOf('<footer>') > html.indexOf('</main>'))
  assert.match(html, /hoverOnlyWhenSupported/)
  assert.match(html, /aria-expanded/)
  assert.match(html, /prefers-reduced-motion:reduce\)\{html\{scroll-behavior:auto\}/)
  assert.match(assembleSite({ ...plan, lang: 'en' }, {}), /Skip to content/)
})

test('efeitos: o plano escolhe poucos, as partes recebem só esses e a página leva só o código usado', async () => {
  const { cleanEffects, usedEffects, effectsRuntime, EFFECT_IDS } = await import('../../supabase/functions/code-maker/effects.ts')
  const { buildEditMessage } = await import('../../supabase/functions/code-maker/site.ts')
  assert.ok(EFFECT_IDS.length >= 25)
  assert.deepEqual(cleanEffects(['marquee', 'marquee', 'inventado', 'tilt', 'parallax', 'stagger', 'count']), ['marquee', 'tilt', 'parallax', 'stagger'])
  // O plano só escolhe efeitos que os blocos aplicam sozinhos (marquee já vem no letreiro).
  const plan = normalizePlan({ ...rawPlan, effects: ['tilt', 'marquee', 'nao-existe'] }, brief)
  assert.deepEqual(plan.effects, ['tilt'])
  assert.equal(normalizePlan(rawPlan, brief).effects, undefined)

  assert.deepEqual(usedEffects('<div data-fx="tilt spotlight"></div><span data-fx=\'count\'></span><i data-fx="nada"></i>'), ['count', 'tilt', 'spotlight'])
  assert.deepEqual(effectsRuntime('<p>sem efeitos</p>'), { css: '', js: '' })
  const runtime = effectsRuntime('<div data-fx="marquee"><ul></ul></div>')
  assert.match(runtime.js, /fx-mq/)
  assert.doesNotMatch(runtime.js, /fx-glare|lenis/)

  const html = assembleSite(plan, { hero: '<section id="hero"><div data-fx="marquee"><ul><li>Corte</li></ul></div></section>' })
  assert.match(html, /@keyframes fx-mq/)
  assert.match(html, /--fx-brand:#d4a017/)
  assert.doesNotMatch(assembleSite(plan, { hero: '<section id="hero">x</section>' }), /fx-mq/)

  // Alteração: biblioteca inteira só quando o pedido fala de efeito/movimento.
  const parts = { hero: '<section id="hero"><div data-fx="marquee"><ul></ul></div></section>' }
  assert.match(buildEditMessage(plan, parts, 'coloca um carrossel na galeria', brief), /EFEITOS ESPECIAIS DISPONÍVEIS[\s\S]*before-after/)
  const plain = buildEditMessage(plan, parts, 'troca o telefone', brief)
  assert.match(plain, /já usa[\s\S]*marquee/)
  assert.doesNotMatch(plain, /before-after/)
})

test('blocos: a IA escreve o conteúdo e o código monta o bloco com as cores do site', async () => {
  const { BLOCKS, blockFor } = await import('../../supabase/functions/code-maker/blocks.ts')
  const { partBlock, renderPart, headerHtml, footerHtml, fixedPart, parseContent, blockTokens, PLAN_SYSTEM, PART_SYSTEM } = await import(
    '../../supabase/functions/code-maker/site.ts'
  )
  assert.equal(blockFor('hero', ['hero']), 'hero-dividido') // nome antigo
  assert.equal(blockFor('bento', ['hero']), null) // bloco de seção não serve de topo
  assert.match(PLAN_SYSTEM, /- hero-vitrine:[\s\S]*- lista-precos:/)
  assert.match(PART_SYSTEM, /```json/)
  const plan = normalizePlan(
    {
      ...rawPlan,
      header: 'menu-barra',
      radius: 'soft',
      cta: 'Agendar meu horário',
      tagline: 'Corte e barba com hora marcada. Há 15 anos de estrada.',
      sections: [
        { id: 'hero', label: 'Início', layout: 'hero-cinema', bg: 'ink' },
        { id: 'servicos', label: 'Serviços', layout: 'cards-foto', bg: 'paper' },
        { id: 'precos', label: 'Preços', layout: 'hero-brilho', bg: 'surface' },
        { id: 'contato', label: 'Contato', layout: 'contato', bg: 'brand' },
      ],
    },
    brief,
  )
  assert.equal(plan.header, 'menu-barra')
  assert.equal(plan.cta, 'Agendar meu horário')
  assert.equal(plan.tagline, 'Corte e barba com hora marcada.') // número inventado sai
  assert.equal(plan.sections[2].layout, 'lista-precos') // topo não serve para seção do meio
  assert.equal(partBlock('header', plan), 'menu-barra')
  assert.equal(partBlock('precos', plan), 'lista-precos')

  // Conteúdo da IA: bloco ```json (ou o primeiro {…}); HTML não é conteúdo.
  const content = parseContent(
    '```json\n{"kicker":"Serviços","title":"Cortes do jeito que você pede","highlight":"você pede","items":[{"title":"Corte","price":"R$ 45","meta":"40 min","icon":"scissors"},{"title":"Barba","price":"R$ 35"},{"title":"Combo","price":"R$ 70","icon":"inventado"},{"title":"Pezinho","price":"R$ 15"}],"alts":["Corte"]}\n```',
  )
  assert.equal(content.items.length, 4)
  assert.equal(content.items[2].icon, undefined)
  assert.equal(parseContent('```html\n<section>x</section>\n```'), null)
  assert.equal(parseContent('{quebrado'), null)

  const servicos = renderPart('servicos', plan, brief, content)
  assert.match(servicos, /^<section id="servicos" class="relative isolate bg-paper/)
  assert.match(servicos, /rounded-2xl/) // cantos "soft"
  assert.match(servicos, /Cortes do jeito que <span[^>]*>você pede<\/span>/)
  assert.equal(new Set(servicos.match(/https:\/\/images\.unsplash\.com\/[^"]+/g)).size, BLOCKS['cards-foto'].photos)
  const hero = renderPart('hero', plan, brief, { title: 'Corte de respeito', primary: 'Agendar meu horário', facts: [{ label: 'Clientes', value: '3 mil clientes' }] })
  assert.match(hero, /https:\/\/wa\.me\/5519998887777/)
  assert.doesNotMatch(hero, /3 mil/) // fato inventado sai
  assert.equal(blockTokens('hero', plan, brief, []).next, '#servicos')
  assert.equal(blockTokens('contato', plan, brief, []).next, '#contato')

  // Cabeçalho e rodapé saem do plano, sem IA.
  const header = headerHtml(plan, brief)
  assert.match(header, /^<header data-header/)
  assert.match(header, /text-white/) // topo de foto: menu branco
  assert.match(header, /href="#servicos"[^>]*>Serviços</)
  assert.match(header, />Agendar meu horário</)
  const footer = footerHtml(plan, brief)
  assert.match(footer, /^<footer/)
  assert.match(footer, /WhatsApp \(19\) 99888-7777/)
  assert.match(footer, /aria-label="Conversar pelo WhatsApp"/)
  assert.equal(fixedPart('servicos', plan, brief), null)
  const prototypeFooter = footerHtml(plan, { ...brief, mode: 'lead_prototype', contactRoutes: { goal: 'quote', actionLabel: 'Pedir orçamento', primary: null, confirmedWhatsapp: null, contacts: [], openingHours: [] } })
  assert.doesNotMatch(prototypeFooter, /wa\.me|Conversar pelo WhatsApp/)

  // Todos os blocos montam com o exemplo, nos dois temas, sem sobra de código.
  for (const theme of ['light', 'dark']) {
    const themed = { ...plan, theme, effects: ['split-text', 'grain', 'tilt', 'count'] }
    for (const [id, block] of Object.entries(BLOCKS)) {
      const section = { id: block.kind === 'hero' ? 'hero' : 'teste', label: 'Teste', brief: '', bg: 'surface', layout: id }
      const sitePlan = { ...themed, sections: block.kind === 'hero' ? [section, ...themed.sections.slice(1)] : [...themed.sections, section] }
      const html = renderPart(section.id, sitePlan, brief, block.sample)
      assert.match(html, new RegExp(`^<section id="${section.id}"`), id)
      assert.doesNotMatch(html, /undefined|NaN|\$\{|\[object/, id)
    }
  }

  // Alteração com bloco pronto: seção nova montada pelo código.
  const parts = { header: headerHtml(plan, brief), hero, servicos, contato: '<section id="contato">C</section>', footer }
  const edit = parseEdit(`<acoes>\n- Criei os planos\n</acoes>
<bloco id="planos" modelo="planos" depois="servicos" rotulo="Planos" fundo="ink">{"title":"Planos mensais","items":[{"title":"Básico","price":"R$ 90","meta":"/mês","list":["2 cortes"]}]}</bloco>`)
  assert.equal(edit.blocks.length, 1)
  assert.throws(() => parseEdit('<bloco id="x" modelo="faq">sem json</bloco>'), /incompleta/)
  const next = applyEdit(plan, parts, edit, { brief })
  assert.deepEqual(next.plan.sections.map((section) => section.id), ['hero', 'servicos', 'planos', 'precos', 'contato'])
  assert.equal(next.plan.sections[2].layout, 'planos')
  assert.equal(next.plan.sections[2].bg, 'ink')
  assert.match(next.parts.planos, /^<section id="planos"/)
  assert.match(next.parts.planos, /Planos mensais/)
  assert.equal(applyEdit(plan, parts, edit).parts.planos, undefined) // sem contexto não monta
})

test('conteúdo continuado em duas chamadas (cerca reaberta) ainda é lido', async () => {
  const { parseContent } = await import('../../supabase/functions/code-maker/site.ts')
  const text = ['```json\n{"title":"Cortes do jeito', '```json\n que você pede","items":[{"title":"Corte"}]}\n```']
  assert.equal(parseContent(text[0] + text[1]).title, 'Cortes do jeito que você pede')
})

test('receita: cada site sai diferente dos anteriores e o plano é obrigado a seguir', async () => {
  const { siteRecipe, applyRecipe, recipeMessage, blockTokens } = await import('../../supabase/functions/code-maker/site.ts')
  const clinic = { businessName: 'Clínica', niche: 'Clínica de estética' }
  const raw = {
    title: 'x',
    theme: 'light',
    palette: { brand: '#9d4b6b', brandDark: '#7a3552', accent: '#d9a26b', ink: '#1c1917', paper: '#faf7f5', surface: '#f2e9ec', muted: '#78716c' },
    fonts: { display: 'Sora', body: 'Figtree' },
    sections: [{ id: 'hero', layout: 'hero-brilho' }, { id: 'servicos', layout: 'lista-icones' }, { id: 'como-funciona', layout: 'passos' }, { id: 'diferenciais', layout: 'editorial' }, { id: 'faq', layout: 'faq' }, { id: 'contato', layout: 'contato' }],
  }
  // Mesmo pedido, seis sites seguidos: topos, fontes e temas variam.
  const recent = []
  for (let i = 0; i < 6; i++) {
    const recipe = siteRecipe(clinic, recent, `site-${i}`)
    assert.deepEqual(siteRecipe(clinic, recent, `site-${i}`), recipe) // o sorteio é estável para o mesmo site
    const plan = applyRecipe(normalizePlan(raw, clinic), recipe, clinic)
    assert.equal(plan.sections[0].layout, recipe.hero)
    assert.equal(plan.header, recipe.header)
    assert.equal(plan.theme, recipe.theme)
    assert.ok(recipe.fonts.some((pair) => pair.display === plan.fonts.display))
    for (const block of recipe.blocks.filter((id) => !['lista-precos', 'planos'].includes(id))) assert.ok(plan.sections.some((section) => section.layout === block), block)
    assert.deepEqual(plan.effects.slice(0, 3), recipe.effects)
    if (i > 0) assert.notEqual(plan.sections[0].layout, recent[0].sections[0].layout)
    recent.unshift(plan)
  }
  assert.ok(new Set(recent.map((plan) => plan.sections[0].layout)).size >= 3)
  assert.ok(new Set(recent.map((plan) => plan.fonts.display)).size >= 4)
  assert.ok(recent.some((plan) => plan.theme === 'dark') && recent.some((plan) => plan.theme === 'light'))
  // Tema trocado pela receita: fundos escuros com texto claro, contraste garantido.
  const dark = applyRecipe(normalizePlan(raw, clinic), { ...siteRecipe(clinic, [], 'x'), theme: 'dark' }, clinic)
  assert.equal(dark.palette.ink, '#f4f2ee')
  assert.ok(contrastOf(dark.palette.ink, dark.palette.paper) > 7)
  // O pedido do usuário vence: fonte e tema pedidos ficam.
  const asked = { ...clinic, details: 'Quero a fonte Sora e site claro' }
  const kept = applyRecipe(normalizePlan(raw, asked), { ...siteRecipe(asked, [], 'y'), theme: 'dark' }, asked)
  assert.equal(kept.fonts.display, 'Sora')
  assert.equal(kept.theme, 'light')
  // O acabamento chega aos blocos e a receita vai na mensagem do plano.
  assert.equal(blockTokens('servicos', { ...kept, look: 'bold' }, asked, []).look, 'bold')
  assert.match(recipeMessage(siteRecipe(clinic, [], 'z')), /RECEITA OBRIGATÓRIA[\s\S]*Topo/)
})

function contrastOf(a, b) {
  const lum = (hex) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
  }
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}
