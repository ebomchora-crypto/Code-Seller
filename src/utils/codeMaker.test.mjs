import assert from 'node:assert/strict'
import test from 'node:test'

import {
  applyEdit,
  assembleSite,
  cleanFragment,
  joinContinuation,
  normalizePlan,
  parseEdit,
  parsePart,
  parsePlan,
  partOrder,
  photoCatalog,
  photosFor,
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
  assert.equal(photosFor('Algo desconhecido').length, 3)
  assert.match(photoCatalog('Pet shop'), /^- https:\/\/images\.unsplash\.com\/photo-1548199973-03cce0bbc87b\?auto=format&fit=crop&w=1600&q=80 — /)
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
