// Code Maker — "Já tem site?": lê o site atual do cliente (texto, contatos e imagens) para a IA recriar melhor.
// As partes puras (leitura do HTML, filtro de endereços) não usam Deno: são testadas em src/utils/codeMakerImport.test.mjs.

export interface ImportedImage {
  url: string
  kind: 'logo' | 'photo'
}

export interface ImportedSite {
  url: string
  title: string
  description: string
  headings: string[]
  text: string
  phones: string[]
  whatsapp: string | null
  emails: string[]
  instagram: string | null
  images: ImportedImage[]
}

const PRIVATE_HOST = /^(?:localhost|.*\.localhost|.*\.local|.*\.internal|.*\.lan|metadata\.google\.internal)$/i

/** Só endereços públicos: nada de localhost, rede interna, IP privado ou serviço de metadados. */
export function isBlockedHost(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, '').toLowerCase()
  if (!host || PRIVATE_HOST.test(host)) return true
  const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])]
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
  }
  if (host.includes(':')) return host === '::' || host === '::1' || /^f[cd]/.test(host) || host.startsWith('fe80') || host.startsWith('::ffff:')
  return !host.includes('.')
}

export function normalizeSiteUrl(raw: string): URL | null {
  const text = raw.trim()
  if (!text || text.length > 300) return null
  try {
    const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || isBlockedHost(url.hostname)) return null
    url.hash = ''
    return url
  } catch {
    return null
  }
}

const decode = (value: string) =>
  value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_all, code) => String.fromCodePoint(Math.min(Number(code), 0x10ffff)))
const clean = (value: string) => decode(value.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
const attr = (tag: string, name: string) => decode(tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'))?.slice(1).find((part) => part !== undefined) ?? '')

function absolute(raw: string, base: URL): string | null {
  const value = raw.trim()
  if (!value || value.startsWith('data:') || value.startsWith('javascript:')) return null
  try {
    const url = new URL(value, base)
    return ['http:', 'https:'].includes(url.protocol) && !isBlockedHost(url.hostname) ? url.href : null
  } catch {
    return null
  }
}

const SKIP_IMAGE = /(?:sprite|pixel|spacer|blank|loading|loader|placeholder|favicon|icon|avatar|emoji|badge|flag|arrow|seta|facebook|instagram|twitter|youtube|whatsapp|linkedin|tripadvisor|payment|visa|master|elo\b|\.svg|\.gif|\.ico)/i

/** Lê o HTML de um site: título, textos, contatos e as imagens que parecem fotos ou logo. */
export function parseSitePage(html: string, base: URL): ImportedSite {
  const source = html.slice(0, 1_500_000)
  const body = source
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|template|iframe)\b[\s\S]*?<\/\1>/gi, ' ')
  const meta = (name: string) => {
    for (const tag of source.match(/<meta\b[^>]*>/gi) ?? []) {
      if (attr(tag, 'name').toLowerCase() === name || attr(tag, 'property').toLowerCase() === name) return attr(tag, 'content')
    }
    return ''
  }
  const title = clean(source.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '') || meta('og:title')
  const description = meta('description') || meta('og:description')

  const headings = [...body.matchAll(/<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/gi)].map((match) => clean(match[1])).filter((value) => value.length > 2 && value.length < 160)
  const main = body.replace(/<(header|nav|footer)\b[\s\S]*?<\/\1>/gi, ' ')
  const lines: string[] = []
  for (const match of main.matchAll(/<(h[1-4]|p|li|td|blockquote|figcaption|summary|dt|dd)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const value = clean(match[2])
    if (value.length >= 3 && !lines.includes(value)) lines.push(match[1].toLowerCase().startsWith('h') ? `## ${value}` : value)
  }
  const text = lines.join('\n').slice(0, 6000)

  const visible = clean(body)
  const links = [...source.matchAll(/<a\b[^>]*>/gi)].map((match) => attr(match[0], 'href'))
  const whatsappLink = links.find((href) => /(?:wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)/i.test(href))
  const whatsapp = (whatsappLink?.match(/(?:wa\.me\/|phone=)\+?(\d{10,15})/i)?.[1]) ?? null
  const phones = [
    ...new Set(
      [...links.filter((href) => /^tel:/i.test(href)).map((href) => href.replace(/^tel:/i, '')), ...(visible.match(/(?:\+?55\s?)?\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}/g) ?? [])]
        .map((value) => value.replace(/[^\d+]/g, ''))
        .filter((value) => value.replace(/\D/g, '').length >= 10 && value.replace(/\D/g, '').length <= 13),
    ),
  ].slice(0, 3)
  const emails = [...new Set([...links.filter((href) => /^mailto:/i.test(href)).map((href) => href.replace(/^mailto:/i, '').split('?')[0]), ...(visible.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g) ?? [])].map((value) => value.toLowerCase()))].slice(0, 3)
  const instagram = links.find((href) => /instagram\.com\/[\w.]+/i.test(href)) ?? null

  const images: ImportedImage[] = []
  const add = (raw: string, kind: ImportedImage['kind']) => {
    const url = absolute(raw, base)
    if (!url || SKIP_IMAGE.test(url.split('?')[0]) || images.some((image) => image.url === url)) return
    if (kind === 'logo' && images.some((image) => image.kind === 'logo')) return
    images.push({ url, kind })
  }
  for (const match of body.matchAll(/<img\b[^>]*>/gi)) {
    const tag = match[0]
    const src = attr(tag, 'src') || attr(tag, 'data-src') || attr(tag, 'data-lazy-src') || (attr(tag, 'srcset').split(',').pop()?.trim().split(/\s+/)[0] ?? '')
    const width = Number(attr(tag, 'width'))
    const height = Number(attr(tag, 'height'))
    if ((width && width < 120) || (height && height < 80)) continue
    const label = `${src} ${attr(tag, 'alt')} ${attr(tag, 'class')} ${attr(tag, 'id')}`
    if (/logo|logotipo|brand|marca/i.test(label) && !/\.svg/i.test(src)) add(src, 'logo')
    else add(src, 'photo')
  }
  const cover = meta('og:image')
  if (cover) add(cover, 'photo')

  return { url: base.href, title, description, headings: headings.slice(0, 12), text, phones, whatsapp, emails, instagram, images }
}

/** Texto que entra no pedido do site: o que a IA precisa saber do site atual. */
export function importedSummary(site: ImportedSite): string {
  const host = new URL(site.url).hostname.replace(/^www\./, '')
  return [
    `SITE ATUAL DO CLIENTE (${host}) — use como base de conteúdo. Recrie com um design muito melhor, mantendo os textos, serviços, preços e contatos que existem aqui; melhore o que estiver fraco e não invente fatos novos.`,
    site.title ? `Título: ${site.title}` : null,
    site.description ? `Descrição: ${site.description}` : null,
    site.whatsapp ? `WhatsApp: ${site.whatsapp}` : site.phones.length ? `Telefone: ${site.phones.join(', ')}` : null,
    site.emails.length ? `E-mail: ${site.emails.join(', ')}` : null,
    site.instagram ? `Instagram: ${site.instagram}` : null,
    site.text ? `Conteúdo do site:\n${site.text}` : null,
  ]
    .filter(Boolean)
    .join('\n')
}
