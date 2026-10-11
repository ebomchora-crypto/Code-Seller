import assert from 'node:assert/strict'
import test from 'node:test'
import { importedSummary, isBlockedHost, normalizeSiteUrl, parseSitePage } from '../../supabase/functions/code-maker/import-site.ts'

test('só endereços públicos são aceitos para importar', () => {
  for (const host of ['localhost', '127.0.0.1', '10.0.0.5', '192.168.1.2', '172.20.0.1', '169.254.169.254', '[::1]', 'intranet', 'x.internal', '100.64.0.1']) assert.ok(isBlockedHost(host), host)
  for (const host of ['padaria.com.br', 'www.exemplo.com', '8.8.8.8']) assert.ok(!isBlockedHost(host), host)
  assert.equal(normalizeSiteUrl('padaria.com.br/contato#x').href, 'https://padaria.com.br/contato')
  assert.equal(normalizeSiteUrl('http://localhost:3000'), null)
  assert.equal(normalizeSiteUrl('ftp://x.com'), null)
  assert.equal(normalizeSiteUrl('https://user:pw@x.com'), null)
})

const page = `<!doctype html><html><head><title>Padaria Aurora &amp; Café</title><meta name="description" content="Pães artesanais em Campinas"><meta property="og:image" content="/img/capa.jpg"></head>
<body><header><a href="/"><img src="/img/logo.png" alt="Padaria Aurora logo"></a><nav><a href="/x">Menu</a></nav></header>
<h1>Pão quente todo dia</h1><p>Fermentação natural desde 1998.</p><ul><li>Pão francês R$ 1,20</li><li>Bolo de fubá</li></ul>
<img src="img/pao.jpg" width="800" height="600" alt="pães"><img src="/icons/facebook.png"><img src="//cdn.exemplo.com/a/bolo.webp"><img src="data:image/png;base64,AAAA"><img src="/pixel.gif" width="1" height="1">
<a href="https://wa.me/5519998887777?text=oi">WhatsApp</a><a href="tel:+551933334444">Ligar</a><a href="mailto:contato@aurora.com.br">e-mail</a><a href="https://instagram.com/padaria.aurora">insta</a>
<script>var x = "<p>não entra</p>"</script><footer><p>© 2024 rodapé</p></footer></body></html>`

test('lê título, textos, contatos e imagens do site atual', () => {
  const site = parseSitePage(page, new URL('https://aurora.com.br/'))
  assert.equal(site.title, 'Padaria Aurora & Café')
  assert.equal(site.description, 'Pães artesanais em Campinas')
  assert.match(site.text, /## Pão quente todo dia/)
  assert.match(site.text, /Pão francês R\$ 1,20/)
  assert.ok(!site.text.includes('não entra') && !site.text.includes('rodapé'))
  assert.equal(site.whatsapp, '5519998887777')
  assert.ok(site.phones.includes('+551933334444'))
  assert.deepEqual(site.emails, ['contato@aurora.com.br'])
  assert.equal(site.instagram, 'https://instagram.com/padaria.aurora')
  assert.deepEqual(site.images.map((image) => [image.url, image.kind]), [
    ['https://aurora.com.br/img/logo.png', 'logo'],
    ['https://aurora.com.br/img/pao.jpg', 'photo'],
    ['https://cdn.exemplo.com/a/bolo.webp', 'photo'],
    ['https://aurora.com.br/img/capa.jpg', 'photo'],
  ])
  const summary = importedSummary(site)
  assert.match(summary, /SITE ATUAL DO CLIENTE \(aurora\.com\.br\)/)
  assert.match(summary, /WhatsApp: 5519998887777/)
})
