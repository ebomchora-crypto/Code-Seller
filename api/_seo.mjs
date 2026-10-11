// SEO dos sites do Code Maker: robôs de busca e prévias de link (WhatsApp, Instagram, Facebook) recebem o site
// já com título, descrição, imagem de compartilhamento e dados estruturados do negócio local.

const escapeAttr = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const decode = (value) => String(value ?? '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")

export function readHead(html) {
  const title = decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? '')
  let description = ''
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    if (/\bname\s*=\s*["']description["']/i.test(tag)) description = decode(tag.match(/\bcontent\s*=\s*"([^"]*)"/i)?.[1] ?? tag.match(/\bcontent\s*=\s*'([^']*)'/i)?.[1] ?? '')
  }
  const lang = html.match(/<html[^>]*\blang\s*=\s*["']([\w-]+)["']/i)?.[1] ?? 'pt-BR'
  return { title, description, lang }
}

export function jsonLd(site, url, head, image) {
  const phone = String(site.phone ?? '').replace(/\D/g, '')
  const data = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: site.name,
    url,
    ...(head.description ? { description: head.description } : {}),
    ...(image ? { image } : {}),
    ...(phone.length >= 10 ? { telephone: `+${phone.startsWith('55') ? phone : `55${phone}`}` } : {}),
    ...(site.city ? { address: { '@type': 'PostalAddress', addressLocality: site.city, addressCountry: 'BR' } } : {}),
    ...(site.niche ? { additionalType: site.niche } : {}),
  }
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

/** Devolve o HTML do site com as tags de SEO e de compartilhamento no <head> (sem repetir as que o site já tem). */
export function injectSeo(html, site, url) {
  const head = readHead(html)
  const photos = Array.isArray(site.assets) ? site.assets : []
  const image = (photos.find((asset) => asset?.kind === 'photo') ?? photos[0])?.url ?? ''
  const title = head.title || site.name
  const description = head.description || `${site.name}${site.city ? ` em ${site.city}` : ''}`
  const has = (pattern) => pattern.test(html)
  const tags = [
    has(/rel\s*=\s*["']canonical["']/i) ? '' : `<link rel="canonical" href="${escapeAttr(url)}">`,
    has(/name\s*=\s*["']robots["']/i) ? '' : '<meta name="robots" content="index, follow, max-image-preview:large">',
    has(/property\s*=\s*["']og:title["']/i) ? '' : `<meta property="og:title" content="${escapeAttr(title)}">`,
    has(/property\s*=\s*["']og:description["']/i) ? '' : `<meta property="og:description" content="${escapeAttr(description)}">`,
    has(/property\s*=\s*["']og:type["']/i) ? '' : '<meta property="og:type" content="website">',
    has(/property\s*=\s*["']og:url["']/i) ? '' : `<meta property="og:url" content="${escapeAttr(url)}">`,
    `<meta property="og:site_name" content="${escapeAttr(site.name)}">`,
    `<meta property="og:locale" content="${escapeAttr(head.lang.replace('-', '_'))}">`,
    image && !has(/property\s*=\s*["']og:image["']/i) ? `<meta property="og:image" content="${escapeAttr(image)}">` : '',
    has(/name\s*=\s*["']twitter:card["']/i) ? '' : `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">`,
    has(/application\/ld\+json/i) ? '' : `<script type="application/ld+json">${jsonLd(site, url, { ...head, description }, image)}</script>`,
  ].filter(Boolean)
  const block = `\n${tags.join('\n')}\n`
  return /<\/head>/i.test(html) ? html.replace(/<\/head>/i, `${block}</head>`) : `${block}${html}`
}

export const SLUG = /^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$/
export const PAGE = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/
