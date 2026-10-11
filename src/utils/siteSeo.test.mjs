import assert from 'node:assert/strict'
import test from 'node:test'
import { injectSeo, readHead } from '../../api/_seo.mjs'

const html = '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Padaria Aurora &amp; Café</title><meta name="description" content="Pães artesanais em Campinas"></head><body><h1>Oi</h1></body></html>'
const site = { name: 'Padaria Aurora', city: 'Campinas', phone: '19998887777', niche: 'padaria', assets: [{ kind: 'logo', url: 'https://x/logo.png' }, { kind: 'photo', url: 'https://x/pao.jpg' }] }

test('lê título, descrição e idioma do site', () => {
  assert.deepEqual(readHead(html), { title: 'Padaria Aurora & Café', description: 'Pães artesanais em Campinas', lang: 'pt-BR' })
})

test('injeta canonical, Open Graph, Twitter e dados estruturados do negócio local', () => {
  const out = injectSeo(html, site, 'https://codesellers.vercel.app/aurora')
  assert.match(out, /<link rel="canonical" href="https:\/\/codesellers\.vercel\.app\/aurora">/)
  assert.match(out, /og:title" content="Padaria Aurora &amp; Café"/)
  assert.match(out, /og:image" content="https:\/\/x\/pao\.jpg"/)
  assert.match(out, /twitter:card" content="summary_large_image"/)
  const ld = JSON.parse(out.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])
  assert.equal(ld['@type'], 'LocalBusiness')
  assert.equal(ld.telephone, '+5519998887777')
  assert.equal(ld.address.addressLocality, 'Campinas')
  assert.ok(out.indexOf('canonical') < out.indexOf('</head>'))
})

test('não repete tags que o site já tem e escapa conteúdo perigoso', () => {
  const own = html.replace('</head>', '<meta property="og:title" content="Meu"><link rel="canonical" href="https://meu"></head>')
  const out = injectSeo(own, { ...site, name: 'A"</script><b>' }, 'https://x/y')
  assert.equal((out.match(/og:title/g) ?? []).length, 1)
  assert.equal((out.match(/rel="canonical"/g) ?? []).length, 1)
  assert.ok(!out.includes('</script><b>'))
})
