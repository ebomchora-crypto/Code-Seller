// Blocos dos sites do Code Maker: cabeçalhos, topos, seções e rodapé com
// acabamento de site premium (camadas, brilho na cor da marca, vidro, bordas
// finas, tipografia gigante). Código próprio, em HTML + Tailwind.
//
// A IA não escreve o HTML dos blocos: ela escreve só o CONTEÚDO (títulos,
// itens, preços) e o código monta o bloco. Assim o site sempre sai com o
// desenho testado — antes a IA simplificava o modelo e o site ficava chapado.

export interface BlockItem {
  title?: string
  text?: string
  price?: string
  meta?: string
  icon?: string
  group?: string
  list?: string[]
}

export interface BlockContent {
  kicker?: string
  title?: string
  highlight?: string
  subtitle?: string
  badge?: string
  primary?: string
  secondary?: string
  note?: string
  word?: string
  items?: BlockItem[]
  facts?: { label: string; value: string }[]
  alts?: string[]
}

export interface BlockTokens {
  id: string
  /** Fundo da seção e o texto que contrasta com ele. */
  bg: string
  tx: string
  /** Texto sobre paper, sobre brand e sobre o painel de contraste. */
  ptx: string
  btx: string
  dk: string
  dtx: string
  radius: 'round' | 'soft' | 'sharp'
  /** Link do botão principal (WhatsApp ou #contato). */
  wa: string
  /** Para onde vai o botão secundário. */
  next: string
  photos: string[]
  /** Efeitos escolhidos no plano: os blocos aplicam onde fazem sentido. */
  fx: string[]
}

export interface Block {
  kind: 'hero' | 'section'
  name: string
  when: string
  photos: number
  /** O que a IA precisa escrever (campos do conteúdo). */
  fields: string
  render: (c: BlockContent, t: BlockTokens) => string
  sample: BlockContent
}

// ---------------------------------------------------------------------------
// Ícones (desenhos do Lucide, licença ISC)
// ---------------------------------------------------------------------------

const ICON_PATHS: Record<string, string> = {
  check: '<path d="M20 6 9 17l-5-5"/>',
  star: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  pin: '<path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
  phone:
    '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
  scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12"/>',
  sparkles: '<path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/><path d="M19 3v4M17 5h4"/>',
  home: '<path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
  car: '<path d="M5 17h14M3 17v-4l2.2-5.2A2 2 0 0 1 7 6.6h10a2 2 0 0 1 1.8 1.2L21 13v4"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
  wrench:
    '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  coffee: '<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><path d="M6 2v2M10 2v2M14 2v2"/>',
  utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  dumbbell: '<path d="M6 6v12M3 9v6M18 6v12M21 9v6M6 12h12"/>',
  paw: '<circle cx="7" cy="8" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="17" cy="8" r="2"/><path d="M12 11c-3 0-6 4-6 7a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2c0-3-3-7-6-7z"/>',
  book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
  briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  scale: '<path d="M12 3v18M7 21h10M5 7h14M5 7l-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0z"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  truck:
    '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2M15 18H9M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
  droplet: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  building:
    '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
  ruler:
    '<path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2M11.5 9.5l2-2M8.5 6.5l2-2M17.5 15.5l2-2"/>',
  bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/>',
  message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  tooth:
    '<path d="M7 3c-2.5 0-4 2-4 4.5 0 3 1.5 4.5 2 8 .4 2.7 1 5.5 2.5 5.5S9.5 17 12 17s3 4 4.5 4 2.1-2.8 2.5-5.5c.5-3.5 2-5 2-8C21 5 19.5 3 17 3c-2 0-3 1-5 1S9 3 7 3z"/>',
  stethoscope: '<path d="M5 3v6a5 5 0 0 0 10 0V3"/><path d="M10 14v2a5 5 0 0 0 9 3v-5"/><circle cx="19" cy="12" r="2"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
  code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
}
export const ICON_NAMES = Object.keys(ICON_PATHS)

function icon(name: string | undefined, size = 'size-5'): string {
  const paths = ICON_PATHS[name ?? ''] ?? ICON_PATHS.sparkles
  return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="${size} shrink-0">${paths}</svg>`
}

const ARROW =
  '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4 transition-transform duration-200 group-hover:translate-x-0.5"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>'
const ARROW_DOWN =
  '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5"><path d="M12 5v14"/><path d="m6 13 6 6 6-6"/></svg>'
const PLUS =
  '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="size-4"><path d="M12 5v14M5 12h14"/></svg>'
const MENU =
  '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="size-5"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
export const WHATSAPP_ICON =
  '<svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" class="size-5 shrink-0"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.6 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1a17 17 0 0 1-1.7-.6 13.4 13.4 0 0 1-5.2-4.6c-.4-.5-1-1.4-1-2.7 0-1.2.7-1.9.9-2.2.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.1.1.7-.1 1.3Z"/></svg>'

// ---------------------------------------------------------------------------
// Peças comuns
// ---------------------------------------------------------------------------

export function esc(value: unknown): string {
  return String(value ?? '').replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]!)
}

const RADIUS = {
  round: { rc: 'rounded-[2rem]', ri: 'rounded-2xl', rb: 'rounded-full' },
  soft: { rc: 'rounded-2xl', ri: 'rounded-xl', rb: 'rounded-xl' },
  sharp: { rc: 'rounded-none', ri: 'rounded-none', rb: 'rounded-none' },
}
const r = (t: BlockTokens) => RADIUS[t.radius] ?? RADIUS.round
const has = (t: BlockTokens, effect: string) => t.fx.includes(effect)
const external = (href: string) => (/^https?:/.test(href) ? ' target="_blank" rel="noopener"' : '')

// Título com a palavra de destaque marcada (degradê da marca, ou o efeito escolhido).
function titled(c: BlockContent, t: BlockTokens, fallback = ''): string {
  const title = esc(c.title || fallback)
  const mark = esc(c.highlight ?? '').trim()
  if (!mark || !title.includes(mark)) return title
  const span = has(t, 'gradient-text')
    ? `<span data-fx="gradient-text">${mark}</span>`
    : has(t, 'annotate')
      ? `<span data-fx="annotate" data-style="underline">${mark}</span>`
      : `<span class="bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent">${mark}</span>`
  return title.replace(mark, span)
}

// Efeito de entrada do título principal (só texto puro aceita esses efeitos).
function h1Fx(t: BlockTokens): string {
  if (has(t, 'split-text')) return ' data-fx="split-text"'
  if (has(t, 'blur-in')) return ' data-fx="blur-in"'
  return ''
}
function heroTitle(c: BlockContent, t: BlockTokens): string {
  return h1Fx(t) ? esc(c.title) : titled(c, t)
}

function primaryButton(c: BlockContent, t: BlockTokens, extra = ''): string {
  if (!c.primary) return ''
  const fx = has(t, 'magnetic') ? ' data-fx="magnetic"' : ''
  return `<a href="${esc(t.wa)}"${external(t.wa)}${fx} class="group inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap ${r(t).rb} bg-brand px-7 font-semibold text-${t.btx} shadow-lg shadow-brand/30 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand/40 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 active:scale-[0.98] ${extra}">${esc(c.primary)} ${ARROW}</a>`
}

function secondaryButton(c: BlockContent, t: BlockTokens, onPhoto = false): string {
  if (!c.secondary) return ''
  const look = onPhoto ? 'border-white/25 bg-white/10 text-white hover:bg-white/20' : `border-${t.tx}/15 bg-${t.tx}/5 hover:bg-${t.tx}/10`
  return `<a href="${esc(t.next)}" class="inline-flex min-h-12 items-center justify-center whitespace-nowrap ${r(t).rb} border px-7 font-semibold backdrop-blur transition ${look}">${esc(c.secondary)}</a>`
}

function badge(c: BlockContent, t: BlockTokens, onPhoto = false): string {
  if (!c.badge) return ''
  const look = onPhoto ? 'border-white/20 bg-white/10 text-white' : `border-${t.tx}/15 bg-${t.tx}/5 text-${t.tx}/80`
  return `<p class="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium backdrop-blur ${look}"><span class="size-1.5 rounded-full bg-accent"></span>${esc(c.badge)}</p>`
}

function heading(c: BlockContent, t: BlockTokens, center = false): string {
  return `<div class="reveal ${center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}">
      ${c.kicker ? `<p class="text-sm font-semibold uppercase tracking-[0.18em] text-brand">${esc(c.kicker)}</p>` : ''}
      <h2 class="mt-4 font-display text-[clamp(2rem,4.6vw,3.6rem)] font-bold leading-[1.04] tracking-tight">${titled(c, t)}</h2>
      ${c.subtitle ? `<p class="mt-5 ${center ? 'mx-auto ' : ''}max-w-xl text-lg leading-relaxed text-${t.tx}/70">${esc(c.subtitle)}</p>` : ''}
    </div>`
}

function photo(t: BlockTokens, c: BlockContent, i: number, cls: string, eager = false): string {
  const src = t.photos[i] ?? t.photos[0]
  if (!src) return ''
  const alt = esc(c.alts?.[i] ?? '')
  return `<img src="${esc(src)}" alt="${alt}" ${eager ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"'} class="${cls}">`
}

const items = (c: BlockContent, max: number) => (c.items ?? []).filter((item) => item && (item.title || item.text)).slice(0, max)

// Tamanho da palavra gigante para caber na largura (palavra longa = letra menor).
function giantSize(word: string, max = 19): string {
  const size = Math.max(6, Math.min(max, Math.round(150 / Math.max(4, word.length))))
  return `text-[${size}vw]`
}

// Fundos vivos do topo (efeitos escolhidos no plano).
function heroBackdrop(t: BlockTokens): string {
  if (has(t, 'particles')) return '<div data-fx="particles" aria-hidden="true" class="absolute inset-0 -z-10"></div>'
  if (has(t, 'dot-grid')) return '<div data-fx="dot-grid" aria-hidden="true" class="absolute inset-0 -z-10"></div>'
  return ''
}
function sectionFx(t: BlockTokens, ...extra: string[]): string {
  const list = [...extra, has(t, 'grain') ? 'grain' : '', has(t, 'aurora') ? 'aurora' : ''].filter(Boolean)
  return list.length ? ` data-fx="${list.join(' ')}"` : ''
}

// ---------------------------------------------------------------------------
// Cabeçalho e rodapé (montados sem IA)
// ---------------------------------------------------------------------------

export interface HeaderData {
  name: string
  logo: string | null
  nav: { id: string; label: string }[]
  cta: string
  href: string
  /** Cor do texto no topo (antes de rolar) — branco quando o topo é uma foto. */
  topText: string
  ptx: string
  btx: string
  radius: BlockTokens['radius']
  fx: string[]
}

function brandMark(data: HeaderData, size = 'size-8'): string {
  if (data.logo) return `<img src="${esc(data.logo)}" alt="Logo ${esc(data.name)}" class="h-9 w-auto object-contain md:h-10">`
  return `<span class="grid ${size} place-items-center rounded-full bg-brand text-${data.btx}">${icon('sparkles', 'size-4')}</span><span>${esc(data.name)}</span>`
}

export function renderHeader(block: string, data: HeaderData): string {
  const R = RADIUS[data.radius] ?? RADIUS.round
  const extras = [
    data.fx.includes('scroll-progress') ? '<span data-fx="scroll-progress" hidden></span>' : '',
    data.fx.includes('smooth-scroll') ? '<span data-fx="smooth-scroll" hidden></span>' : '',
  ].join('')
  const ext = external(data.href)
  if (block === 'menu-barra') {
    const links = data.nav.map((item) => `<a href="#${esc(item.id)}" class="opacity-75 transition hover:opacity-100">${esc(item.label)}</a>`).join('\n      ')
    const mobile = data.nav.map((item) => `<a href="#${esc(item.id)}" class="block py-3 font-medium">${esc(item.label)}</a>`).join('\n    ')
    return `<header data-header class="fixed inset-x-0 top-0 z-50 border-b border-transparent text-${data.topText} transition-all duration-300 data-[scrolled]:border-${data.ptx}/10 data-[scrolled]:bg-paper/85 data-[scrolled]:text-${data.ptx} data-[scrolled]:shadow-sm data-[scrolled]:backdrop-blur-xl">${extras}
  <div class="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 md:px-10">
    <a href="#hero" class="flex items-center gap-2.5 font-display text-xl font-bold tracking-tight">${brandMark(data, 'size-9')}</a>
    <nav aria-label="Principal" class="hidden items-center gap-8 text-sm font-medium lg:flex">
      ${links}
    </nav>
    <div class="flex items-center gap-2">
      <a href="${esc(data.href)}"${ext} class="hidden min-h-11 items-center gap-2 ${R.rb} bg-brand px-5 text-sm font-semibold text-${data.btx} transition hover:brightness-110 sm:inline-flex">${esc(data.cta)}</a>
      <button type="button" data-menu-toggle aria-label="Abrir menu" class="grid size-11 place-items-center ${R.rb} lg:hidden">${MENU}</button>
    </div>
  </div>
  <div data-menu class="hidden border-t border-${data.ptx}/10 bg-paper px-5 pb-5 pt-2 text-${data.ptx} lg:hidden">
    ${mobile}
    <a href="${esc(data.href)}"${ext} class="mt-2 flex min-h-12 items-center justify-center ${R.rb} bg-brand font-semibold text-${data.btx}">${esc(data.cta)}</a>
  </div>
</header>`
  }
  const links = data.nav
    .map(
      (item) =>
        `<a href="#${esc(item.id)}" class="rounded-full px-3.5 py-2 text-sm font-medium text-${data.ptx}/70 transition hover:bg-${data.ptx}/5 hover:text-${data.ptx}">${esc(item.label)}</a>`,
    )
    .join('\n        ')
  const mobile = data.nav
    .map((item) => `<a href="#${esc(item.id)}" class="block rounded-2xl px-4 py-3 font-medium hover:bg-${data.ptx}/5">${esc(item.label)}</a>`)
    .join('\n      ')
  return `<header data-header class="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:pt-4">${extras}
  <div class="mx-auto max-w-5xl rounded-[28px] border border-${data.ptx}/10 bg-paper/75 text-${data.ptx} shadow-[0_12px_40px_-18px_rgba(0,0,0,0.35)] backdrop-blur-xl">
    <div class="flex items-center justify-between gap-4 py-2 pl-5 pr-2">
      <a href="#hero" class="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight">${brandMark(data)}</a>
      <nav aria-label="Principal" class="hidden items-center gap-1 lg:flex">
        ${links}
      </nav>
      <div class="flex items-center gap-1">
        <a href="${esc(data.href)}"${ext} class="hidden min-h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-${data.btx} transition hover:brightness-110 active:scale-[0.98] sm:inline-flex">${esc(data.cta)}</a>
        <button type="button" data-menu-toggle aria-label="Abrir menu" class="grid size-11 place-items-center rounded-full transition hover:bg-${data.ptx}/5 lg:hidden">${MENU}</button>
      </div>
    </div>
    <div data-menu class="hidden border-t border-${data.ptx}/10 px-3 pb-4 pt-2 lg:hidden">
      ${mobile}
      <a href="${esc(data.href)}"${ext} class="mt-2 flex min-h-12 items-center justify-center rounded-full bg-brand font-semibold text-${data.btx}">${esc(data.cta)}</a>
    </div>
  </div>
</header>`
}

export interface FooterData {
  name: string
  tagline: string
  nav: { id: string; label: string }[]
  contacts: { label: string; href?: string }[]
  cta: string
  href: string
  whatsapp: string | null
  dk: string
  dtx: string
  btx: string
  radius: BlockTokens['radius']
}

export function renderFooter(data: FooterData): string {
  const R = RADIUS[data.radius] ?? RADIUS.round
  const nav = data.nav
    .map((item) => `<li><a href="#${esc(item.id)}" class="text-${data.dtx}/75 transition hover:text-${data.dtx}">${esc(item.label)}</a></li>`)
    .join('')
  const contacts = data.contacts
    .map((item) =>
      item.href
        ? `<li><a href="${esc(item.href)}"${external(item.href)} class="transition hover:text-${data.dtx}">${esc(item.label)}</a></li>`
        : `<li>${esc(item.label)}</li>`,
    )
    .join('')
  const floating = data.whatsapp
    ? `\n<a href="${esc(data.whatsapp)}" target="_blank" rel="noopener" aria-label="Conversar pelo WhatsApp" class="fixed bottom-5 right-5 z-50 grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition hover:scale-105">${WHATSAPP_ICON.replace('size-5', 'size-7')}</a>`
    : ''
  return `<footer class="relative overflow-hidden bg-${data.dk} pt-20 text-${data.dtx}">
  <div class="mx-auto grid max-w-7xl gap-12 px-5 md:grid-cols-[1.4fr_1fr_1fr] md:px-10">
    <div>
      <p class="font-display text-2xl font-bold">${esc(data.name)}</p>
      ${data.tagline ? `<p class="mt-3 max-w-sm leading-relaxed text-${data.dtx}/60">${esc(data.tagline)}</p>` : ''}
      <a href="${esc(data.href)}"${external(data.href)} class="mt-7 inline-flex min-h-11 items-center gap-2 ${R.rb} bg-brand px-5 text-sm font-semibold text-${data.btx} transition hover:brightness-110">${esc(data.cta)}</a>
    </div>
    <nav aria-label="Rodapé"><p class="text-sm font-semibold uppercase tracking-[0.18em] text-${data.dtx}/50">Navegue</p><ul class="mt-5 space-y-3">${nav}</ul></nav>
    ${contacts ? `<div><p class="text-sm font-semibold uppercase tracking-[0.18em] text-${data.dtx}/50">Contato</p><ul class="mt-5 space-y-3 text-${data.dtx}/75">${contacts}</ul></div>` : ''}
  </div>
  <div class="mx-auto mt-16 max-w-7xl border-t border-${data.dtx}/10 px-5 py-6 text-sm text-${data.dtx}/50 md:px-10"><p>© <span data-year></span> ${esc(data.name)}</p></div>
  <p aria-hidden="true" class="pointer-events-none -mb-[0.16em] select-none whitespace-nowrap text-center font-display ${giantSize(data.name, 18)} font-black uppercase leading-none tracking-tighter text-${data.dtx}/[0.06]">${esc(data.name)}</p>
</footer>${floating}`
}

// ---------------------------------------------------------------------------
// Topos
// ---------------------------------------------------------------------------

const heroRetrato = (c: BlockContent, t: BlockTokens) => {
  const word = c.word || c.title || ''
  return `<section id="${t.id}" class="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden bg-black text-white"${sectionFx(t)}>
  ${photo(t, c, 0, 'absolute inset-0 -z-20 size-full object-cover object-[50%_20%]', true)}
  <div aria-hidden="true" class="absolute inset-0 -z-10 bg-gradient-to-b from-black/60 via-black/10 to-black/85"></div>
  <div class="mx-auto grid w-full max-w-7xl gap-8 px-5 pt-36 md:grid-cols-2 md:items-end md:px-10">
    <div>
      ${badge(c, t, true)}
      <h1${h1Fx(t)} class="mt-5 max-w-xl font-display text-[clamp(2.25rem,4.8vw,4rem)] font-semibold leading-[1.06] tracking-tight">${heroTitle(c, t)}</h1>
    </div>
    <div class="md:max-w-sm md:justify-self-end">
      ${c.subtitle ? `<p class="text-lg leading-relaxed text-white/80">${esc(c.subtitle)}</p>` : ''}
      ${c.primary ? `<a href="${esc(t.wa)}"${external(t.wa)}${has(t, 'magnetic') ? ' data-fx="magnetic"' : ''} class="group mt-6 inline-flex min-h-14 items-center gap-3 rounded-full bg-brand py-2 pl-2 pr-7 font-semibold text-${t.btx} shadow-lg shadow-black/30 transition hover:brightness-110"><span class="grid size-10 place-items-center rounded-full bg-white text-black">${ARROW}</span>${esc(c.primary)}</a>` : ''}
    </div>
  </div>
  <p aria-hidden="true" class="pointer-events-none mt-8 select-none whitespace-nowrap px-2 text-center font-display ${giantSize(word)} font-bold leading-[0.8] tracking-tighter text-white">${esc(word)}</p>
</section>`
}

const heroVitrine = (c: BlockContent, t: BlockTokens) => {
  const word = c.word || c.title || ''
  const featured = items(c, 4)
  const first = featured[0]
  const cards = featured
    .map(
      (
        item,
        i,
      ) => `<article class="flex min-w-[15rem] shrink-0 items-center gap-3 ${r(t).ri} border border-${t.tx}/10 bg-paper/90 p-3 text-${t.ptx} shadow-xl shadow-black/10 backdrop-blur">
        ${photo(t, c, i + 1, `size-16 shrink-0 ${r(t).ri} object-cover`)}
        <div class="min-w-0"><h3 class="truncate text-sm font-bold uppercase tracking-wide">${esc(item.title)}</h3>${item.meta ? `<p class="text-xs text-${t.ptx}/60">${esc(item.meta)}</p>` : ''}${item.price ? `<p class="mt-0.5 text-sm font-semibold tabular-nums">${esc(item.price)}</p>` : ''}</div>
        <a href="${esc(t.wa)}"${external(t.wa)} aria-label="Pedir ${esc(item.title)}" class="ml-auto grid size-9 shrink-0 place-items-center rounded-full bg-brand text-${t.btx} transition hover:scale-105">${PLUS}</a>
      </article>`,
    )
    .join('\n      ')
  return `<section id="${t.id}" class="relative isolate overflow-hidden bg-${t.bg} pb-12 pt-28 text-${t.tx} md:pt-32"${sectionFx(t)}>
  ${heroBackdrop(t)}
  <p aria-hidden="true" class="pointer-events-none absolute left-1/2 top-[42%] -z-10 hidden -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap md:block font-display ${giantSize(word, 26)} font-black uppercase leading-none tracking-tighter text-${t.tx}/[0.07]">${esc(word)}</p>
  <div aria-hidden="true" class="pointer-events-none absolute right-6 top-28 -z-10 hidden h-40 w-24 bg-[radial-gradient(currentColor_1.5px,transparent_1.5px)] bg-[size:16px_16px] opacity-20 md:block"></div>
  <div class="mx-auto grid max-w-7xl items-center gap-10 px-5 md:grid-cols-[1fr_1.3fr_0.8fr] md:px-10">
    <div class="relative z-10">
      ${c.kicker ? `<p class="text-sm font-semibold uppercase tracking-[0.22em] text-brand">${esc(c.kicker)}</p>` : ''}
      <h1${h1Fx(t)} class="mt-4 font-display text-[clamp(3rem,6.5vw,6rem)] font-bold uppercase leading-[0.92] tracking-tight">${heroTitle(c, t)}</h1>
      ${c.subtitle ? `<p class="mt-6 max-w-sm leading-relaxed text-${t.tx}/70">${esc(c.subtitle)}</p>` : ''}
      <div class="mt-8 flex flex-wrap gap-3">${primaryButton(c, t)}${secondaryButton(c, t)}</div>
    </div>
    <div class="relative">
      <div aria-hidden="true" class="absolute inset-[12%] -z-10 rounded-full bg-brand/30 blur-3xl"></div>
      ${photo(t, c, 0, `aspect-square w-full -rotate-3 ${r(t).rc} object-cover shadow-2xl shadow-black/30 transition duration-700 hover:rotate-0`, true)}
    </div>
    <div class="hidden md:block">
      ${first ? `<p class="font-display text-2xl font-semibold uppercase tracking-wide">${esc(first.title)}</p>${first.price ? `<p class="mt-2 font-display text-3xl font-bold text-brand tabular-nums">${esc(first.price)}</p>` : ''}${first.text ? `<p class="mt-3 text-sm leading-relaxed text-${t.tx}/60">${esc(first.text)}</p>` : ''}` : ''}
    </div>
  </div>
  ${cards ? `<div class="mx-auto mt-12 flex max-w-7xl gap-4 overflow-x-auto px-5 pb-4 [scrollbar-width:none] md:px-10">\n      ${cards}\n  </div>` : ''}
  <div class="mx-auto mt-6 flex max-w-7xl items-center gap-4 px-5 text-xs font-semibold tabular-nums text-${t.tx}/50 md:px-10"><span>01 / ${String(Math.max(1, featured.length)).padStart(2, '0')}</span><span class="h-px w-24 bg-${t.tx}/15"><span class="block h-px w-1/3 bg-${t.tx}"></span></span></div>
</section>`
}

const heroNeon = (c: BlockContent, t: BlockTokens) => {
  const chips = items(c, 3)
  const spots = ['left-0 top-[30%]', 'right-0 top-[12%]', 'right-2 bottom-[18%]']
  const facts = (c.facts ?? []).slice(0, 4)
  const factIcons = ['code', 'users', 'zap', 'star']
  return `<section id="${t.id}" class="relative isolate overflow-hidden bg-${t.bg} pb-16 pt-32 text-${t.tx} md:pt-36"${sectionFx(t)}>
  ${heroBackdrop(t)}
  <div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10">
    <div class="absolute right-[8%] top-24 size-[30rem] rounded-full bg-brand/25 blur-[120px]"></div>
    <div class="absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:64px_64px] opacity-[0.04] [mask-image:radial-gradient(ellipse_at_top_right,black_20%,transparent_70%)]"></div>
  </div>
  <div class="mx-auto grid max-w-7xl items-center gap-12 px-5 md:grid-cols-2 md:px-10">
    <div>
      ${c.kicker ? `<p class="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-brand"><span class="size-1.5 rounded-full bg-brand shadow-[0_0_10px_var(--fx-brand)]"></span>${esc(c.kicker)}</p>` : ''}
      <h1${h1Fx(t)} class="mt-5 font-display text-[clamp(2.75rem,6vw,5.5rem)] font-bold uppercase leading-[0.95] tracking-tight">${h1Fx(t) ? esc(c.title) : titled({ ...c }, { ...t, fx: t.fx.includes('gradient-text') ? t.fx : [...t.fx] })}</h1>
      ${c.subtitle ? `<p class="mt-6 max-w-lg text-lg leading-relaxed text-${t.tx}/70">${esc(c.subtitle)}</p>` : ''}
      <div class="mt-9 flex flex-col gap-3 sm:flex-row">${primaryButton(c, t)}${secondaryButton(c, t)}</div>
    </div>
    <div class="relative mx-auto aspect-square w-full max-w-[34rem]">
      <div aria-hidden="true" class="absolute inset-[6%] rounded-full border-2 border-brand/80 shadow-[0_0_80px_-10px_var(--fx-brand)]"></div>
      ${photo(t, c, 0, 'absolute inset-[10%] size-[80%] rounded-full object-cover', true)}
      ${chips
        .map(
          (chip, i) =>
            `<div class="absolute ${spots[i]} hidden max-w-[12rem] items-center gap-3 ${r(t).ri} border border-${t.tx}/10 bg-${t.bg}/70 px-4 py-3 text-sm shadow-xl backdrop-blur-xl sm:flex"><span class="grid size-9 place-items-center rounded-lg bg-brand/15 text-brand">${icon(chip.icon, 'size-4')}</span><span class="font-semibold leading-tight">${esc(chip.title)}</span></div>`,
        )
        .join('\n      ')}
    </div>
  </div>
  ${
    facts.length
      ? `<div class="mx-auto mt-14 max-w-7xl px-5 md:px-10"><dl class="grid grid-cols-2 gap-px overflow-hidden ${r(t).rc} [&>div:last-child:nth-child(odd)]:col-span-2 lg:[&>div:last-child:nth-child(odd)]:col-span-1 border border-${t.tx}/10 bg-${t.tx}/10 backdrop-blur lg:grid-cols-${facts.length}">${facts
          .map(
            (fact, i) =>
              `<div class="flex items-center gap-4 bg-${t.bg}/90 p-6"><span class="grid size-11 place-items-center rounded-xl bg-brand/15 text-brand">${icon(factIcons[i], 'size-5')}</span><div><dd class="font-display text-2xl font-bold tabular-nums">${esc(fact.value)}</dd><dt class="text-xs font-semibold uppercase tracking-wider text-${t.tx}/60">${esc(fact.label)}</dt></div></div>`,
          )
          .join('')}</dl></div>`
      : ''
  }
</section>`
}

const heroMundo = (c: BlockContent, t: BlockTokens) => {
  const list = items(c, 4)
  return `<section id="${t.id}" class="bg-${t.bg} px-3 pb-6 pt-24 md:px-6 md:pt-28">
  <div class="relative isolate mx-auto flex min-h-[86vh] max-w-[90rem] flex-col justify-end overflow-hidden ${r(t).rc} bg-black text-white shadow-2xl"${sectionFx(t)}>
    ${has(t, 'parallax') ? `<div data-fx="parallax" data-speed="0.08" class="absolute inset-x-0 -top-[8%] -z-20 h-[116%]">${photo(t, c, 0, 'size-full object-cover', true)}</div>` : photo(t, c, 0, 'absolute inset-0 -z-20 size-full object-cover', true)}
    <div aria-hidden="true" class="absolute inset-0 -z-10 bg-gradient-to-r from-black/80 via-black/35 to-transparent"></div>
    <div aria-hidden="true" class="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
    ${list.length ? `<ul class="absolute right-8 top-1/2 hidden -translate-y-1/2 space-y-3 border-l border-white/30 pl-5 text-xs font-semibold uppercase tracking-[0.2em] text-white/70 lg:block">${list.map((item) => `<li>${esc(item.title)}</li>`).join('')}</ul>` : ''}
    <div class="max-w-3xl p-7 md:p-14">
      ${c.kicker ? `<p class="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">${esc(c.kicker)}</p>` : ''}
      <h1${h1Fx(t)} class="mt-5 font-display text-[clamp(2.75rem,6.5vw,6rem)] font-semibold leading-[1] tracking-tight">${heroTitle(c, t)}</h1>
      ${c.subtitle ? `<p class="mt-6 max-w-md text-lg leading-relaxed text-white/80">${esc(c.subtitle)}</p>` : ''}
      <div class="mt-9 flex flex-wrap items-center gap-5">
        ${c.primary ? `<a href="${esc(t.wa)}"${external(t.wa)} class="group inline-flex min-h-12 items-center gap-3 rounded-full bg-brand py-1.5 pl-6 pr-1.5 font-semibold text-${t.btx} transition hover:brightness-110">${esc(c.primary)}<span class="grid size-9 place-items-center rounded-full bg-black/80 text-white">${ARROW}</span></a>` : ''}
        ${c.secondary ? `<a href="${esc(t.next)}" class="group inline-flex items-center gap-3 font-semibold text-white"><span class="grid size-12 place-items-center rounded-full border border-white/40 transition group-hover:bg-white/10">${ARROW}</span>${esc(c.secondary)}</a>` : ''}
      </div>
      <div class="mt-12 flex items-center gap-5 text-xs font-semibold tabular-nums text-white/60"><span class="border-b-2 border-white pb-1 text-white">01</span><span>02</span><span>03</span></div>
    </div>
    <a href="${esc(t.next)}" aria-label="Rolar para o conteúdo" class="absolute right-7 top-7 hidden size-12 place-items-center rounded-full border border-white/40 text-white transition hover:bg-white/10 md:grid">${ARROW_DOWN}</a>
  </div>
</section>`
}

const heroBrilho = (
  c: BlockContent,
  t: BlockTokens,
) => `<section id="${t.id}" class="relative isolate overflow-hidden bg-${t.bg} pb-20 pt-32 text-${t.tx} md:pb-28 md:pt-44"${sectionFx(t)}>
  ${heroBackdrop(t)}
  <div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10">
    <div class="absolute left-1/2 top-[-14rem] h-[38rem] w-[64rem] -translate-x-1/2 rounded-full bg-brand/25 blur-[120px]"></div>
    <div class="absolute right-[-8rem] top-48 size-80 rounded-full bg-accent/20 blur-[100px]"></div>
    <div class="absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:56px_56px] opacity-[0.05] [mask-image:radial-gradient(ellipse_at_top,black_25%,transparent_70%)]"></div>
  </div>
  <div class="mx-auto max-w-6xl px-5 text-center md:px-8">
    ${badge(c, t)}
    <h1${h1Fx(t)} class="mx-auto mt-7 max-w-4xl font-display text-[clamp(2.75rem,7.4vw,6rem)] font-bold leading-[1.02] tracking-tight">${heroTitle(c, t)}</h1>
    ${c.subtitle ? `<p class="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-${t.tx}/70 md:text-xl">${esc(c.subtitle)}</p>` : ''}
    <div class="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">${primaryButton(c, t)}${secondaryButton(c, t)}</div>
    <div class="reveal relative mx-auto mt-16 max-w-5xl md:mt-20">
      <div aria-hidden="true" class="absolute -inset-x-6 -bottom-10 top-12 -z-10 rounded-[3rem] bg-brand/25 blur-3xl"></div>
      <div class="${r(t).rc} border border-${t.tx}/10 bg-${t.tx}/5 p-2 shadow-2xl backdrop-blur">
        ${photo(t, c, 0, `aspect-[16/10] w-full ${r(t).ri} object-cover md:aspect-[16/8]`, true)}
      </div>
    </div>
  </div>
</section>`

const heroDividido = (c: BlockContent, t: BlockTokens) => {
  const facts = (c.facts ?? []).slice(0, 3)
  return `<section id="${t.id}" class="relative isolate overflow-hidden bg-${t.bg} pt-28 text-${t.tx} md:pt-36"${sectionFx(t)}>
  ${heroBackdrop(t)}
  <div aria-hidden="true" class="pointer-events-none absolute -right-40 -top-40 -z-10 size-[36rem] rounded-full bg-brand/20 blur-[120px]"></div>
  <div class="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 md:grid-cols-[1.05fr_1fr] md:px-10 md:pb-28">
    <div>
      ${c.kicker ? `<p class="inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-brand"><span class="h-px w-8 bg-brand"></span>${esc(c.kicker)}</p>` : ''}
      <h1${h1Fx(t)} class="mt-6 font-display text-[clamp(2.6rem,6.2vw,5.25rem)] font-bold leading-[1.02] tracking-tight">${heroTitle(c, t)}</h1>
      ${c.subtitle ? `<p class="mt-6 max-w-xl text-lg leading-relaxed text-${t.tx}/70">${esc(c.subtitle)}</p>` : ''}
      <div class="mt-9 flex flex-col gap-3 sm:flex-row">${primaryButton(c, t)}${secondaryButton(c, t)}</div>
      ${
        facts.length
          ? `<dl class="mt-12 grid max-w-lg grid-cols-${facts.length} divide-x divide-${t.tx}/10 border-y border-${t.tx}/10 py-5 text-sm">${facts
              .map(
                (fact, i) =>
                  `<div class="${i === 0 ? 'pr-4' : 'px-4'}"><dd class="font-display text-base font-semibold">${esc(fact.value)}</dd><dt class="text-${t.tx}/60">${esc(fact.label)}</dt></div>`,
              )
              .join('')}</dl>`
          : ''
      }
    </div>
    <div class="relative md:pl-6">
      ${photo(t, c, 0, `aspect-[4/5] w-full ${r(t).rc} object-cover shadow-2xl`, true)}
      ${t.photos[1] ? photo(t, c, 1, `absolute -bottom-8 -left-2 hidden aspect-square w-40 ${r(t).rc} border-[6px] border-${t.bg} object-cover shadow-xl md:block lg:w-48`) : ''}
      ${c.note ? `<p class="absolute right-4 top-4 max-w-[13rem] rounded-2xl border border-white/20 bg-black/45 px-4 py-3 text-sm font-medium text-white backdrop-blur-md">${esc(c.note)}</p>` : ''}
    </div>
  </div>
</section>`
}

const heroCinema = (c: BlockContent, t: BlockTokens) => {
  const facts = (c.facts ?? []).slice(0, 3)
  return `<section id="${t.id}" class="relative isolate flex min-h-[94vh] items-end overflow-hidden bg-black text-white"${sectionFx(t)}>
  ${has(t, 'parallax') ? `<div data-fx="parallax" data-speed="0.1" class="absolute inset-x-0 -top-[8%] -z-20 h-[116%]">${photo(t, c, 0, 'size-full object-cover', true)}</div>` : photo(t, c, 0, 'absolute inset-0 -z-20 size-full object-cover', true)}
  <div aria-hidden="true" class="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/55 to-black/20"></div>
  <div aria-hidden="true" class="absolute inset-0 -z-10 bg-gradient-to-r from-black/60 via-transparent to-transparent"></div>
  <div class="mx-auto w-full max-w-7xl px-5 pb-14 pt-40 md:px-10 md:pb-20">
    ${badge(c, t, true)}
    <h1${h1Fx(t)} class="mt-6 max-w-4xl font-display text-[clamp(3rem,8.4vw,7rem)] font-bold leading-[0.96] tracking-tight">${heroTitle(c, t)}</h1>
    <div class="mt-8 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
      ${c.subtitle ? `<p class="max-w-md text-lg leading-relaxed text-white/75">${esc(c.subtitle)}</p>` : '<span></span>'}
      <div class="flex flex-col gap-3 sm:flex-row">${primaryButton(c, t)}${secondaryButton(c, t, true)}</div>
    </div>
    ${facts.length ? `<dl class="mt-12 grid gap-6 border-t border-white/15 pt-6 sm:grid-cols-${facts.length}">${facts.map((fact) => `<div><dt class="text-sm text-white/60">${esc(fact.label)}</dt><dd class="mt-1 font-display text-lg font-semibold">${esc(fact.value)}</dd></div>`).join('')}</dl>` : ''}
  </div>
</section>`
}

const heroEditorial = (
  c: BlockContent,
  t: BlockTokens,
) => `<section id="${t.id}" class="relative isolate bg-${t.bg} pt-32 text-${t.tx} md:pt-40"${sectionFx(t)}>
  ${heroBackdrop(t)}
  <div class="mx-auto max-w-7xl px-5 md:px-10">
    <div class="flex flex-wrap items-end justify-between gap-6">
      ${c.kicker ? `<p class="text-sm font-semibold uppercase tracking-[0.22em] text-${t.tx}/60">${esc(c.kicker)}</p>` : '<span></span>'}
      ${c.subtitle ? `<p class="max-w-sm text-base leading-relaxed text-${t.tx}/70">${esc(c.subtitle)}</p>` : ''}
    </div>
    <h1${h1Fx(t)} class="mt-6 font-display text-[clamp(3.25rem,11vw,10rem)] font-bold uppercase leading-[0.86] tracking-tight">${h1Fx(t) ? esc(c.title) : titled(c, { ...t, fx: t.fx }).replace('bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent', 'text-brand')}</h1>
    <div class="mt-9 flex flex-col gap-3 sm:flex-row">${primaryButton(c, t)}${secondaryButton(c, t)}</div>
  </div>
  <div class="mx-auto mt-14 grid max-w-[88rem] grid-cols-12 gap-3 px-3 pb-20 md:gap-4 md:pb-28">
    ${photo(t, c, 0, `col-span-12 aspect-[16/10] w-full ${r(t).rc} object-cover md:col-span-7 md:aspect-auto md:h-[30rem]`, true)}
    ${photo(t, c, 1, `col-span-6 aspect-[4/5] w-full ${r(t).rc} object-cover md:col-span-3 md:aspect-auto md:h-[30rem]`)}
    <a href="${esc(t.wa)}"${external(t.wa)} class="group col-span-6 flex flex-col justify-between ${r(t).rc} bg-brand p-6 text-${t.btx} transition hover:brightness-110 md:col-span-2">
      <span class="font-display text-2xl font-bold leading-tight">${esc(c.note || c.primary || '')}</span>
      <span class="inline-flex items-center gap-2 text-sm font-semibold">${esc(c.primary || '')} ${ARROW}</span>
    </a>
  </div>
</section>`

// ---------------------------------------------------------------------------
// Seções
// ---------------------------------------------------------------------------

const wrap = (t: BlockTokens, inner: string, fx = '') =>
  `<section id="${t.id}" class="relative isolate bg-${t.bg} py-24 text-${t.tx} md:py-32"${fx}>
  <div class="mx-auto max-w-7xl px-5 md:px-10">
    ${inner}
  </div>
</section>`

const bento = (c: BlockContent, t: BlockTokens) => {
  const list = items(c, 5)
  const [main, ...rest] = list
  const small = rest.slice(0, 2)
  const wide = rest.slice(2)
  const ctaSpan = wide.length === 1 ? 'md:col-span-3' : 'md:col-span-6'
  const card = (item: BlockItem, span: string) => `<article data-fx="spotlight" class="${r(t).rc} border border-${t.tx}/10 bg-${t.tx}/[0.03] p-7 ${span}">
        <span class="grid size-11 place-items-center ${r(t).ri} bg-brand/15 text-brand">${icon(item.icon)}</span>
        <h3 class="mt-6 font-display text-xl font-semibold">${esc(item.title)}</h3>
        ${item.text ? `<p class="mt-2 leading-relaxed text-${t.tx}/70">${esc(item.text)}</p>` : ''}
        ${item.price ? `<p class="mt-4 text-sm font-semibold text-brand tabular-nums">${esc(item.price)}</p>` : ''}
      </article>`
  return wrap(
    t,
    `${heading(c, t)}
    <div data-fx="stagger" class="mt-14 grid gap-4 md:grid-cols-6">
      ${
        main
          ? `<article data-fx="spotlight" class="group relative isolate min-h-[24rem] overflow-hidden ${r(t).rc} border border-${t.tx}/10 md:col-span-4 md:row-span-2">
        ${photo(t, c, 0, 'absolute inset-0 -z-10 size-full object-cover transition duration-700 ease-out group-hover:scale-105')}
        <div aria-hidden="true" class="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/30 to-transparent"></div>
        <div class="flex h-full flex-col justify-end p-7 text-white md:p-9">
          ${main.price ? `<span class="w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur tabular-nums">${esc(main.price)}</span>` : ''}
          <h3 class="mt-3 font-display text-3xl font-bold">${esc(main.title)}</h3>
          ${main.text ? `<p class="mt-2 max-w-md text-white/75">${esc(main.text)}</p>` : ''}
        </div>
      </article>`
          : ''
      }
      ${small.map((item) => card(item, 'md:col-span-2')).join('\n      ')}
      ${wide.map((item) => card(item, 'md:col-span-3')).join('\n      ')}
      ${c.primary ? `<a href="${esc(t.wa)}"${external(t.wa)} class="group flex flex-col justify-between gap-8 ${r(t).rc} bg-brand p-7 text-${t.btx} transition hover:brightness-110 ${ctaSpan}"><span class="font-display text-2xl font-bold leading-tight">${esc(c.note || c.primary)}</span><span class="inline-flex items-center gap-2 font-semibold">${esc(c.primary)} ${ARROW}</span></a>` : ''}
    </div>`,
  )
}

const cardsFoto = (c: BlockContent, t: BlockTokens) => {
  const list = items(c, 4)
  const cols = list.length >= 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3'
  return wrap(
    t,
    `<div class="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      ${heading(c, t)}
      ${c.primary ? `<a href="${esc(t.wa)}"${external(t.wa)} class="group inline-flex shrink-0 items-center gap-2 font-semibold text-brand">${esc(c.primary)} ${ARROW}</a>` : ''}
    </div>
    <div data-fx="stagger" class="mt-12 grid gap-5 ${cols}">
      ${list
        .map(
          (item, i) => `<article${has(t, 'tilt') ? ' data-fx="tilt"' : ''} class="group relative overflow-hidden ${r(t).rc} bg-${t.tx}/5">
        <div class="aspect-[4/5] overflow-hidden">${photo(t, c, i, 'size-full object-cover transition duration-700 ease-out group-hover:scale-[1.06]')}</div>
        <div class="absolute inset-x-3 bottom-3 ${r(t).ri} border border-white/15 bg-black/50 p-5 text-white backdrop-blur-md">
          <div class="flex items-start justify-between gap-4">
            <div><h3 class="font-display text-xl font-semibold">${esc(item.title)}</h3>${item.text || item.meta ? `<p class="mt-1 text-sm text-white/70">${esc(item.meta || item.text)}</p>` : ''}</div>
            ${item.price ? `<span class="shrink-0 rounded-full bg-white px-3 py-1 text-sm font-semibold text-black tabular-nums">${esc(item.price)}</span>` : ''}
          </div>
        </div>
      </article>`,
        )
        .join('\n      ')}
    </div>`,
  )
}

const split = (c: BlockContent, t: BlockTokens) => {
  const list = items(c, 4)
  return `<section id="${t.id}" class="bg-${t.bg} py-24 text-${t.tx} md:py-32">
  <div class="mx-auto grid max-w-7xl items-center gap-12 px-5 md:grid-cols-2 md:gap-20 md:px-10">
    <div class="reveal relative">
      <div aria-hidden="true" class="absolute -inset-4 -z-10 ${r(t).rc} bg-gradient-to-br from-brand/25 to-accent/10 blur-2xl"></div>
      <div${has(t, 'image-reveal') ? ' data-fx="image-reveal"' : ''} class="overflow-hidden ${r(t).rc} shadow-xl">${photo(t, c, 0, 'aspect-[4/5] w-full object-cover')}</div>
      ${c.note ? `<div class="absolute bottom-4 left-4 right-4 ${r(t).ri} border border-white/15 bg-black/45 p-5 text-white backdrop-blur-md md:left-auto md:w-64"><p class="font-display text-lg font-semibold">${esc(c.note)}</p></div>` : ''}
    </div>
    <div>
      ${heading(c, t)}
      <ul class="mt-10 space-y-6">
        ${list.map((item) => `<li class="flex gap-4"><span class="grid size-11 shrink-0 place-items-center ${r(t).ri} bg-brand/15 text-brand">${icon(item.icon)}</span><div><h3 class="font-display text-lg font-semibold">${esc(item.title)}</h3>${item.text ? `<p class="mt-1 text-${t.tx}/70">${esc(item.text)}</p>` : ''}</div></li>`).join('\n        ')}
      </ul>
      ${c.primary ? `<div class="mt-10">${primaryButton(c, t)}</div>` : ''}
    </div>
  </div>
</section>`
}

// Foto de apoio ao lado do título (colunas de texto ficavam vazias sem ela).
function sidePhoto(c: BlockContent, t: BlockTokens, aspect = 'aspect-[4/3]'): string {
  if (!t.photos[0]) return ''
  return `<div class="reveal relative mt-10">
        <div aria-hidden="true" class="absolute -inset-3 -z-10 ${r(t).rc} bg-gradient-to-br from-brand/20 to-accent/10 blur-2xl"></div>
        <div${has(t, 'image-reveal') ? ' data-fx="image-reveal"' : ''} class="group overflow-hidden ${r(t).rc} shadow-xl">${photo(t, c, 0, `${aspect} w-full object-cover transition duration-700 ease-out group-hover:scale-105`)}</div>
      </div>`
}

const editorial = (c: BlockContent, t: BlockTokens) => `<section id="${t.id}" class="bg-${t.bg} py-24 text-${t.tx} md:py-32">
  <div class="mx-auto grid max-w-7xl gap-12 px-5 md:grid-cols-[0.9fr_1.1fr] md:gap-20 md:px-10">
    <div class="md:sticky md:top-28 md:self-start">
      ${heading(c, t)}
      ${c.primary ? `<div class="mt-9">${primaryButton(c, t)}</div>` : ''}
      ${sidePhoto(c, t)}
    </div>
    <ol class="divide-y divide-${t.tx}/10 border-y border-${t.tx}/10">
      ${items(c, 6)
        .map(
          (item, i) =>
            `<li class="group grid grid-cols-[3rem_1fr] gap-4 py-8"><span class="font-display text-sm font-semibold text-brand tabular-nums">${String(i + 1).padStart(2, '0')}</span><div><h3 class="font-display text-2xl font-semibold transition-transform duration-300 group-hover:translate-x-1">${esc(item.title)}</h3>${item.text ? `<p class="mt-2 leading-relaxed text-${t.tx}/70">${esc(item.text)}</p>` : ''}</div></li>`,
        )
        .join('\n      ')}
    </ol>
  </div>
</section>`

const listaIcones = (c: BlockContent, t: BlockTokens) => {
  const list = items(c, 6)
  const card = (item: BlockItem) =>
    `<div class="bg-${t.bg} p-8 transition-colors duration-300 hover:bg-${t.tx}/[0.03]"><span class="grid size-12 place-items-center ${r(t).ri} bg-gradient-to-br from-brand to-accent text-${t.btx} shadow-lg shadow-brand/25">${icon(item.icon)}</span><h3 class="mt-6 font-display text-lg font-semibold">${esc(item.title)}</h3>${item.text ? `<p class="mt-2 leading-relaxed text-${t.tx}/70">${esc(item.text)}</p>` : ''}</div>`
  const grid = (cols: string) =>
    `<div data-fx="stagger" class="grid gap-px overflow-hidden ${r(t).rc} border border-${t.tx}/10 bg-${t.tx}/10 ${cols}">
      ${list.map(card).join('\n      ')}
    </div>`
  const fx = has(t, 'pattern') ? ' data-fx="pattern" data-pattern="dots"' : ''
  if (t.photos[0]) {
    return wrap(
      t,
      `<div class="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
      <div>${heading(c, t)}${sidePhoto(c, t, 'aspect-[4/3] lg:aspect-[4/5]')}</div>
      <div class="lg:self-center">${grid(list.length === 1 ? '' : 'sm:grid-cols-2')}</div>
    </div>`,
      fx,
    )
  }
  const cols = list.length === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : list.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'
  return wrap(t, `${heading(c, t, true)}\n    <div class="mt-14">${grid(cols)}</div>`, fx)
}

const listaPrecos = (c: BlockContent, t: BlockTokens) => {
  const list = items(c, 16)
  const groups = new Map<string, BlockItem[]>()
  for (const item of list) {
    const key = item.group || ''
    groups.set(key, [...(groups.get(key) ?? []), item])
  }
  const columns = [...groups.entries()]
  // Sem categorias: divide a lista em duas colunas.
  if (columns.length === 1 && list.length > 4) {
    const half = Math.ceil(list.length / 2)
    columns.splice(0, 1, [columns[0][0], list.slice(0, half)], ['', list.slice(half)])
  }
  const row = (item: BlockItem) =>
    `<li><div class="flex items-baseline gap-3"><span class="font-display text-lg font-semibold">${esc(item.title)}</span><span aria-hidden="true" class="flex-1 -translate-y-1 border-b border-dotted border-${t.tx}/25"></span>${item.price ? `<span class="font-display text-lg font-semibold tabular-nums">${esc(item.price)}</span>` : ''}</div>${item.text || item.meta ? `<p class="mt-1 text-sm text-${t.tx}/60">${esc([item.text, item.meta].filter(Boolean).join(' · '))}</p>` : ''}</li>`
  return wrap(
    t,
    `${heading(c, t)}
    <div class="reveal mt-14 grid gap-x-16 gap-y-12 md:grid-cols-2">
      ${columns
        .map(
          ([group, rows]) => `<div>
        ${group ? `<h3 class="flex items-center gap-4 font-display text-sm font-semibold uppercase tracking-[0.18em] text-brand">${esc(group)}<span class="h-px flex-1 bg-${t.tx}/10"></span></h3>` : ''}
        <ul class="${group ? 'mt-6 ' : ''}space-y-6">${rows.map(row).join('')}</ul>
      </div>`,
        )
        .join('\n      ')}
    </div>
    ${c.primary ? `<div class="mt-12">${primaryButton(c, t)}</div>` : ''}`,
  )
}

const planos = (c: BlockContent, t: BlockTokens) => {
  const list = items(c, 3)
  const featured = list.length === 3 ? 1 : list.length === 2 ? 1 : 0
  const plan = (item: BlockItem, i: number) => {
    const star = i === featured && list.length > 1
    const tx = star ? t.dtx : t.tx
    const fx = [star ? 'beam' : '', has(t, 'tilt') ? 'tilt' : ''].filter(Boolean).join(' ')
    return `<article${fx ? ` data-fx="${fx}"` : ''} class="relative flex h-full flex-col ${r(t).rc} p-8 ${star ? `bg-${t.dk} text-${t.dtx} shadow-2xl shadow-brand/20 lg:py-12` : `border border-${t.tx}/10 bg-${t.tx}/[0.03]`}">
        ${star && c.badge ? `<span class="absolute -top-3 left-8 rounded-full bg-brand px-3 py-1 text-xs font-bold uppercase tracking-wider text-${t.btx}">${esc(c.badge)}</span>` : ''}
        <h3 class="font-display text-xl font-semibold">${esc(item.title)}</h3>
        ${item.text ? `<p class="mt-2 text-sm text-${tx}/60">${esc(item.text)}</p>` : ''}
        ${item.price ? `<p class="mt-6 font-display text-5xl font-bold tabular-nums"><span${star && has(t, 'shimmer') ? ' data-fx="shimmer"' : ''}>${esc(item.price)}</span>${item.meta ? `<span class="text-base font-medium text-${tx}/50">${esc(item.meta)}</span>` : ''}</p>` : ''}
        <ul class="mt-8 space-y-3 text-sm">${(item.list ?? [])
          .slice(0, 8)
          .map(
            (line) =>
              `<li class="flex gap-3 text-${tx}/85"><span class="${star ? 'text-accent' : 'text-brand'}">${icon('check', 'mt-0.5 size-4')}</span>${esc(line)}</li>`,
          )
          .join('')}</ul>
        <a href="${esc(t.wa)}"${external(t.wa)} class="mt-auto inline-flex min-h-12 items-center justify-center ${r(t).rb} pt-0 font-semibold transition ${star ? `bg-brand text-${t.btx} hover:brightness-110` : `border border-${t.tx}/15 hover:bg-${t.tx}/5`}" style="margin-top:2.5rem">${esc(c.primary || 'Escolher')}</a>
      </article>`
  }
  return wrap(
    t,
    `${heading(c, t, true)}
    <div class="mt-16 grid items-center gap-5 ${list.length >= 3 ? 'lg:grid-cols-3' : list.length === 2 ? 'mx-auto max-w-4xl md:grid-cols-2' : 'mx-auto max-w-md'}">
      ${list.map(plan).join('\n      ')}
    </div>`,
  )
}

const passos = (c: BlockContent, t: BlockTokens) => {
  const list = items(c, 5)
  if (has(t, 'stack')) {
    return wrap(
      t,
      `<div class="grid gap-12 md:grid-cols-[0.9fr_1.1fr]">
      <div class="md:sticky md:top-28 md:self-start">${heading(c, t)}</div>
      <div data-fx="stack" class="space-y-6">
        ${list.map((item, i) => `<article class="${r(t).rc} border border-${t.tx}/10 bg-${t.bg} p-8 shadow-xl"><span class="font-display text-5xl font-bold text-brand tabular-nums">${String(i + 1).padStart(2, '0')}</span><h3 class="mt-4 font-display text-2xl font-semibold">${esc(item.title)}</h3>${item.text ? `<p class="mt-2 leading-relaxed text-${t.tx}/70">${esc(item.text)}</p>` : ''}</article>`).join('\n        ')}
      </div>
    </div>`,
    )
  }
  const cols = list.length >= 4 ? 'md:grid-cols-4' : list.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'
  const top = t.photos[0]
    ? `<div class="grid items-end gap-10 md:grid-cols-2 md:gap-16">
      ${heading(c, t)}
      <div class="reveal group overflow-hidden ${r(t).rc} shadow-xl">${photo(t, c, 0, 'aspect-[16/10] w-full object-cover transition duration-700 ease-out group-hover:scale-105')}</div>
    </div>`
    : heading(c, t)
  return wrap(
    t,
    `${top}
    <div class="relative mt-16">
      <div aria-hidden="true" class="absolute left-6 right-6 top-6 hidden h-px bg-gradient-to-r from-brand via-accent/60 to-transparent md:block"></div>
      <ol data-fx="stagger" class="relative grid gap-10 md:gap-6 ${cols}">
        ${list.map((item, i) => `<li><span class="grid size-12 place-items-center rounded-full border border-brand/40 bg-${t.bg} font-display font-bold text-brand ring-8 ring-brand/10 tabular-nums">${String(i + 1).padStart(2, '0')}</span><h3 class="mt-6 font-display text-xl font-semibold">${esc(item.title)}</h3>${item.text ? `<p class="mt-2 leading-relaxed text-${t.tx}/70">${esc(item.text)}</p>` : ''}</li>`).join('\n        ')}
      </ol>
    </div>`,
    has(t, 'pattern') ? ' data-fx="pattern" data-pattern="grid"' : '',
  )
}

const galeria = (c: BlockContent, t: BlockTokens) => {
  const caps = items(c, 4)
  const cells = ['col-span-2 row-span-2', '', 'row-span-2', '']
  const reveal = has(t, 'image-reveal') ? ' data-fx="image-reveal"' : ''
  return wrap(
    t,
    `${heading(c, t)}
    <div class="reveal mt-12 grid auto-rows-[11rem] grid-cols-2 gap-3 md:auto-rows-[15rem] md:grid-cols-4 md:gap-4">
      ${cells
        .map(
          (cell, i) =>
            `<figure${reveal} class="group relative overflow-hidden ${r(t).rc} ${cell}">${photo(t, c, i, 'size-full object-cover transition duration-700 ease-out group-hover:scale-105')}${caps[i]?.title ? `<figcaption class="absolute bottom-3 left-3 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">${esc(caps[i].title)}</figcaption>` : ''}</figure>`,
        )
        .join('\n      ')}
    </div>`,
  )
}

const depoimentos = (c: BlockContent, t: BlockTokens) =>
  wrap(
    t,
    `${heading(c, t)}
    <div data-fx="stagger" class="mt-14 grid gap-5 md:grid-cols-3">
      ${items(c, 6)
        .map((item) => {
          const initials = esc(
            (item.title ?? '')
              .split(/\s+/)
              .map((part) => part[0] ?? '')
              .join('')
              .slice(0, 2)
              .toUpperCase(),
          )
          return `<figure class="flex flex-col justify-between ${r(t).rc} border border-${t.tx}/10 bg-${t.tx}/[0.03] p-8"><blockquote class="text-lg leading-relaxed">“${esc(item.text)}”</blockquote><figcaption class="mt-8 flex items-center gap-3"><span class="grid size-11 place-items-center rounded-full bg-brand/15 font-display font-bold text-brand">${initials}</span><span><strong class="block font-semibold">${esc(item.title)}</strong>${item.meta ? `<span class="text-sm text-${t.tx}/60">${esc(item.meta)}</span>` : ''}</span></figcaption></figure>`
        })
        .join('\n      ')}
    </div>`,
  )

const letreiro = (c: BlockContent, t: BlockTokens) => {
  const words = items(c, 8).map((item) => item.title)
  return `<section id="${t.id}" aria-label="${esc(c.title || 'Destaques')}" class="bg-brand py-5 text-${t.btx}">
  <div data-fx="marquee" data-speed="40">
    <ul class="flex shrink-0 items-center gap-10 pr-10 font-display text-2xl font-bold uppercase tracking-tight md:text-3xl">
      ${words.map((word) => `<li>${esc(word)}</li><li aria-hidden="true" class="opacity-50">✦</li>`).join('\n      ')}
    </ul>
  </div>
</section>`
}

const faixaDestaque = (c: BlockContent, t: BlockTokens) => `<section id="${t.id}" class="bg-${t.bg} px-3 py-16 md:py-24">
  <div class="reveal relative isolate mx-auto max-w-7xl overflow-hidden ${r(t).rc} border border-${t.dtx}/10 bg-${t.dk} px-6 py-16 text-center text-${t.dtx} md:px-16 md:py-24"${sectionFx(t)}>
    ${t.photos[0] ? `${photo(t, { ...c, alts: [''] }, 0, 'absolute inset-0 -z-30 size-full object-cover opacity-30')}<div aria-hidden="true" class="absolute inset-0 -z-20 bg-gradient-to-b from-${t.dk}/40 via-${t.dk}/70 to-${t.dk}"></div>` : ''}
    <div aria-hidden="true" class="absolute left-1/2 top-0 -z-10 h-[30rem] w-[52rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/45 blur-[110px]"></div>
    <div aria-hidden="true" class="absolute inset-0 -z-10 bg-[radial-gradient(currentColor_1px,transparent_1px)] bg-[size:22px_22px] opacity-[0.08] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"></div>
    <h2${has(t, 'scrub-text') ? ' data-fx="scrub-text"' : ''} class="mx-auto max-w-3xl font-display text-[clamp(2.25rem,5.2vw,4.25rem)] font-bold leading-[1.04] tracking-tight">${has(t, 'scrub-text') ? esc(c.title) : titled(c, t)}</h2>
    ${c.subtitle ? `<p class="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-${t.dtx}/70">${esc(c.subtitle)}</p>` : ''}
    <div class="mt-10 flex justify-center">${primaryButton(c, t)}</div>
  </div>
</section>`

const faq = (c: BlockContent, t: BlockTokens) => `<section id="${t.id}" class="bg-${t.bg} py-24 text-${t.tx} md:py-32">
  <div class="mx-auto grid max-w-7xl gap-12 px-5 md:grid-cols-[0.8fr_1.2fr] md:gap-16 md:px-10">
    <div class="md:sticky md:top-28 md:self-start">
      ${heading(c, t)}
      ${c.primary ? `<div class="mt-9">${primaryButton(c, t)}</div>` : ''}
      ${sidePhoto(c, t)}
    </div>
    <div class="space-y-3">
      ${items(c, 8)
        .map(
          (item) =>
            `<details class="group ${r(t).ri} border border-${t.tx}/10 bg-${t.tx}/[0.03] px-6 transition-colors open:bg-${t.tx}/[0.06]"><summary class="flex min-h-16 items-center justify-between gap-6 py-5 font-display text-lg font-semibold">${esc(item.title)}<span class="grid size-8 shrink-0 place-items-center rounded-full border border-${t.tx}/15 transition-transform duration-300 group-open:rotate-45">${PLUS}</span></summary><p class="pb-6 leading-relaxed text-${t.tx}/70">${esc(item.text)}</p></details>`,
        )
        .join('\n      ')}
    </div>
  </div>
</section>`

function factIcon(label: string): string {
  const text = label.toLowerCase()
  if (/hor[aá]rio|aberto|funciona/.test(text)) return 'clock'
  if (/whats|telefone|fone|ligue|celular/.test(text)) return 'phone'
  if (/e-?mail/.test(text)) return 'message'
  if (/agenda|data|dia/.test(text)) return 'calendar'
  return 'pin'
}

const contato = (c: BlockContent, t: BlockTokens) => {
  const facts = (c.facts ?? []).slice(0, 4)
  // Sem destino de contato o botão apontaria para a própria seção.
  const action = c.primary && !t.wa.startsWith('#')
  // Em fundo da cor da marca, o cartão vira o painel escuro (antes sumia no fundo).
  const onBrand = t.bg === 'brand'
  const cardBg = onBrand ? `bg-${t.dk} text-${t.dtx}` : `bg-brand text-${t.btx}`
  const button = onBrand ? `bg-brand text-${t.btx}` : `bg-${t.btx} text-brand`
  const side = facts.length
    ? `<div class="reveal ${r(t).rc} border border-${t.tx}/10 bg-${t.tx}/[0.04] p-8 md:p-12">
      ${c.note ? `<h3 class="font-display text-xl font-semibold">${esc(c.note)}</h3>` : ''}
      <dl class="mt-6 divide-y divide-${t.tx}/10">
        ${facts.map((fact) => `<div class="flex gap-4 py-5"><dt class="${onBrand ? '' : 'text-brand'}">${icon(factIcon(fact.label))}<span class="sr-only">${esc(fact.label)}</span></dt><dd><strong class="block font-semibold">${esc(fact.label)}</strong><span class="text-${t.tx}/70">${esc(fact.value)}</span></dd></div>`).join('\n        ')}
      </dl>
    </div>`
    : t.photos[0]
      ? `<div class="reveal group relative min-h-[18rem] overflow-hidden ${r(t).rc}">${photo(t, c, 0, 'absolute inset-0 size-full object-cover transition duration-700 ease-out group-hover:scale-105')}</div>`
      : ''
  return `<section id="${t.id}" class="bg-${t.bg} py-24 text-${t.tx} md:py-32">
  <div class="mx-auto grid max-w-7xl gap-5 px-5 ${side ? 'md:grid-cols-[1.2fr_1fr]' : ''} md:px-10">
    <div class="reveal relative isolate flex flex-col justify-between overflow-hidden ${r(t).rc} ${cardBg} p-8 md:p-12">
      <div aria-hidden="true" class="absolute -right-24 -top-24 -z-10 size-72 rounded-full ${onBrand ? 'bg-brand/40' : 'bg-white/15'} blur-3xl"></div>
      <div>
        ${c.kicker ? `<p class="text-sm font-semibold uppercase tracking-[0.18em] opacity-80">${esc(c.kicker)}</p>` : ''}
        <h2 class="mt-4 font-display text-[clamp(2rem,4.4vw,3.4rem)] font-bold leading-[1.05] tracking-tight">${esc(c.title)}</h2>
        ${c.subtitle ? `<p class="mt-4 max-w-md text-lg opacity-80">${esc(c.subtitle)}</p>` : ''}
      </div>
      ${action ? `<a href="${esc(t.wa)}"${external(t.wa)} class="group mt-12 inline-flex min-h-14 w-fit items-center gap-3 ${r(t).rb} ${button} px-7 font-semibold shadow-lg transition hover:-translate-y-0.5">${/wa\.me|whatsapp/.test(t.wa) ? WHATSAPP_ICON : ''}${esc(c.primary)}</a>` : ''}
    </div>
    ${side}
  </div>
</section>`
}

const numeros = (c: BlockContent, t: BlockTokens) => {
  const facts = (c.facts ?? []).slice(0, 4)
  const value = (raw: string) => {
    const match = raw.match(/^([^\d]*)(\d+(?:[.,]\d+)?)(.*)$/)
    if (!has(t, 'count') || !match) return esc(raw)
    const decimals = match[2].includes(',') || match[2].includes('.') ? match[2].split(/[.,]/)[1].length : 0
    return `<span data-fx="count" data-to="${esc(match[2].replace(',', '.'))}" data-decimals="${decimals}" data-prefix="${esc(match[1])}" data-suffix="${esc(match[3])}">${esc(raw)}</span>`
  }
  return wrap(
    t,
    `${heading(c, t, true)}
    <dl class="mt-14 grid grid-cols-2 gap-px overflow-hidden ${r(t).rc} border border-${t.tx}/10 bg-${t.tx}/10 lg:grid-cols-${Math.max(2, facts.length)}">
      ${facts.map((fact) => `<div class="bg-${t.bg} p-8 text-center"><dd class="font-display text-[clamp(2.25rem,5vw,3.75rem)] font-bold tabular-nums text-brand">${value(fact.value)}</dd><dt class="mt-2 text-sm font-semibold uppercase tracking-wider text-${t.tx}/60">${esc(fact.label)}</dt></div>`).join('\n      ')}
    </dl>`,
  )
}

const carrossel = (c: BlockContent, t: BlockTokens) => {
  const list = items(c, 8)
  const fx = has(t, 'horizontal') ? 'horizontal' : 'carousel'
  const width = fx === 'horizontal' ? 'w-[80vw] md:w-[30vw]' : 'w-[85%] sm:w-[48%] lg:w-[31%]'
  return `<section id="${t.id}" class="overflow-hidden bg-${t.bg} py-24 text-${t.tx} md:py-32">
  <div class="mx-auto max-w-7xl px-5 md:px-10">${heading(c, t)}</div>
  <div class="mx-auto mt-12 max-w-7xl ${fx === 'carousel' ? 'px-5 md:px-10' : ''}">
    <div data-fx="${fx}">
      <div class="flex gap-5 ${fx === 'horizontal' ? 'px-5 md:px-10' : ''}">
        ${list
          .map(
            (item, i) => `<article class="group relative ${width} shrink-0 overflow-hidden ${r(t).rc} border border-${t.tx}/10 bg-${t.tx}/[0.03]">
          <div class="aspect-[4/3] overflow-hidden">${photo(t, c, i % Math.max(1, t.photos.length), 'size-full object-cover transition duration-700 group-hover:scale-105')}</div>
          <div class="p-6"><div class="flex items-start justify-between gap-4"><h3 class="font-display text-xl font-semibold">${esc(item.title)}</h3>${item.price ? `<span class="shrink-0 font-semibold text-brand tabular-nums">${esc(item.price)}</span>` : ''}</div>${item.text ? `<p class="mt-2 text-${t.tx}/70">${esc(item.text)}</p>` : ''}${item.meta ? `<p class="mt-4 text-xs font-semibold uppercase tracking-wider text-${t.tx}/50">${esc(item.meta)}</p>` : ''}</div>
        </article>`,
          )
          .join('\n        ')}
      </div>
    </div>
  </div>
</section>`
}

// ---------------------------------------------------------------------------
// Catálogo
// ---------------------------------------------------------------------------

const S = (items: BlockItem[], extra: BlockContent = {}): BlockContent => ({
  kicker: 'Rótulo curto',
  title: 'Título da seção com o benefício',
  highlight: 'benefício',
  subtitle: 'Uma frase de apoio, concreta, dizendo o que a pessoa ganha.',
  primary: 'Ação principal',
  items,
  ...extra,
})
const ITEM = (n: number, extra: BlockItem = {}): BlockItem[] =>
  Array.from({ length: n }, (_, i) => ({ title: `Item ${i + 1}`, text: 'Descrição curta e útil.', icon: ICON_NAMES[i % ICON_NAMES.length], ...extra }))

export const BLOCKS: Record<string, Block> = {
  'hero-retrato': {
    kind: 'hero',
    name: 'Retrato em tela cheia com o nome gigante',
    when: 'Foto de pessoa (profissional, artista, personal, fotógrafo, consultor) ocupando a tela, título à esquerda, botão à direita e o NOME enorme em branco cortando a base. Visual de portfólio premium.',
    photos: 1,
    fields:
      'badge (selo curto verdadeiro), title (até 7 palavras), subtitle (até 2 frases), primary, word (nome curto que vai gigante, 1 ou 2 palavras), alts[0]',
    render: heroRetrato,
    sample: {
      badge: 'Agenda aberta',
      title: 'Título forte do topo em poucas palavras',
      subtitle: 'Frase de apoio dizendo o que a pessoa ganha.',
      primary: 'Ação principal',
      word: 'Nome',
    },
  },
  'hero-vitrine': {
    kind: 'hero',
    name: 'Vitrine de produto com a marca gigante ao fundo',
    when: 'Produto ou prato em destaque no centro, a marca enorme e apagada atrás, título em caixa alta à esquerda, nome e preço à direita e uma fileira de mini-cards de produtos embaixo. Loja, moda, calçados, hamburgueria, doceria, açaí.',
    photos: 4,
    fields:
      'kicker, title (caixa alta, 2 a 5 palavras curtas), subtitle, primary, secondary, word (a marca, 1 palavra), items (2 a 3 produtos reais: title, price, meta), alts',
    render: heroVitrine,
    sample: {
      kicker: 'Coleção',
      title: 'Feito para o seu ritmo',
      subtitle: 'Frase de apoio curta.',
      primary: 'Ver produtos',
      secondary: 'Saiba mais',
      word: 'Marca',
      items: ITEM(3, { price: 'R$ 00', meta: 'detalhe' }),
    },
  },
  'hero-neon': {
    kind: 'hero',
    name: 'Fundo escuro com anel de luz, cartões flutuantes e barra de números',
    when: 'Tecnologia, agência, estúdio, academia, games, personal: título em caixa alta com a última parte na cor da marca, foto dentro de um anel brilhante com 3 cartões de vidro em volta e uma barra de dados embaixo. Pede tema escuro.',
    photos: 1,
    fields:
      'kicker, title (caixa alta), highlight (o trecho final do título), subtitle, primary, secondary, items (3 rótulos curtos com icon), facts (2 a 4 dados verdadeiros: value curto + label), alts[0]',
    render: heroNeon,
    sample: {
      kicker: 'Rótulo',
      title: 'Título forte com final em destaque',
      highlight: 'final em destaque',
      subtitle: 'Frase de apoio.',
      primary: 'Ação principal',
      secondary: 'Ação secundária',
      items: ITEM(3),
      facts: [
        { label: 'Rótulo', value: '10+' },
        { label: 'Rótulo', value: 'Seg–Sáb' },
        { label: 'Rótulo', value: '24h' },
      ],
    },
  },
  'hero-mundo': {
    kind: 'hero',
    name: 'Foto emoldurada em tela cheia com título serifado',
    when: 'Uma foto de clima (paisagem, ambiente, evento, viagem, casamento, pousada, restaurante) num quadro grande arredondado, título elegante com uma palavra em degradê, lista lateral e contador 01 02 03. Cinematográfico.',
    photos: 1,
    fields: 'kicker, title (até 6 palavras), highlight (1 palavra do título), subtitle, primary, secondary, items (3 a 4 palavras da lista lateral), alts[0]',
    render: heroMundo,
    sample: {
      kicker: 'Rótulo',
      title: 'Título com uma palavra especial',
      highlight: 'especial',
      subtitle: 'Frase de apoio.',
      primary: 'Ação principal',
      secondary: 'Ver mais',
      items: ITEM(3),
    },
  },
  'hero-cinema': {
    kind: 'hero',
    name: 'Foto de fundo inteira com título enorme embaixo',
    when: 'Foto forte ocupando a tela com degradê escuro e título enorme em branco. Gastronomia, imóveis de alto padrão, automotivo, eventos.',
    photos: 1,
    fields: 'badge, title (curto), subtitle, primary, secondary, facts (até 3 informações úteis e verdadeiras: label + value), alts[0]',
    render: heroCinema,
    sample: {
      badge: 'Selo verdadeiro',
      title: 'Título do topo forte e curto',
      subtitle: 'Frase de apoio.',
      primary: 'Ação principal',
      secondary: 'Ação secundária',
      facts: [{ label: 'Rótulo', value: 'Informação' }],
    },
  },
  'hero-brilho': {
    kind: 'hero',
    name: 'Centralizado com brilho e foto em moldura de vidro',
    when: 'Título grande no centro sobre um brilho da marca e uma grade fina; selo, 2 botões e uma foto larga embaixo. Produto/serviço premium, clínica, estética, tecnologia.',
    photos: 1,
    fields: 'badge, title, highlight (1 a 2 palavras do título), subtitle, primary, secondary, alts[0]',
    render: heroBrilho,
    sample: {
      badge: 'Selo verdadeiro',
      title: 'Título do topo com a palavra-chave',
      highlight: 'palavra-chave',
      subtitle: 'Frase de apoio.',
      primary: 'Ação principal',
      secondary: 'Ação secundária',
    },
  },
  'hero-dividido': {
    kind: 'hero',
    name: 'Texto + foto alta com foto menor sobreposta',
    when: 'Texto à esquerda e duas fotos em camadas à direita, com selo de vidro. Versátil para serviços locais.',
    photos: 2,
    fields: 'kicker, title, highlight, subtitle, primary, secondary, note (destaque curto sobre a foto), facts (até 3 vantagens curtas: value + label), alts',
    render: heroDividido,
    sample: {
      kicker: 'Rótulo · Cidade',
      title: 'Título que diz o que o negócio faz de melhor',
      highlight: 'de melhor',
      subtitle: 'Frase de apoio.',
      primary: 'Ação principal',
      secondary: 'Ação secundária',
      note: 'Destaque curto',
      facts: [{ label: 'detalhe', value: 'Vantagem' }],
    },
  },
  'hero-editorial': {
    kind: 'hero',
    name: 'Tipografia gigante em caixa alta + mosaico de fotos',
    when: 'Título enorme ocupando a largura e uma faixa com 2 fotos e um cartão na cor da marca. Ousado: moda, barbearia, arquitetura, estúdio.',
    photos: 2,
    fields: 'kicker, title (2 a 5 palavras curtas), highlight (1 palavra), subtitle, primary, secondary, note (chamada do cartão), alts',
    render: heroEditorial,
    sample: {
      kicker: 'Rótulo · Cidade',
      title: 'Título em duas linhas',
      highlight: 'duas',
      subtitle: 'Frase de apoio.',
      primary: 'Ação',
      secondary: 'Ver mais',
      note: 'Chamada curta',
    },
  },

  bento: {
    kind: 'section',
    name: 'Bento com luz que segue o mouse',
    when: 'Serviços ou diferenciais em blocos de tamanhos diferentes: o 1º item grande com foto, os outros com ícone, e um bloco de chamada na cor da marca.',
    photos: 1,
    fields: 'kicker, title, highlight, subtitle, items (4 a 5: title, text, icon, price opcional), primary + note (chamada do bloco final)',
    render: bento,
    sample: S(ITEM(5, { price: '' }), { note: 'Chamada curta' }),
  },
  'cards-foto': {
    kind: 'section',
    name: 'Cards com foto, zoom e etiqueta de vidro',
    when: 'Catálogo com foto: serviços, pratos, imóveis, produtos (3 ou 4 itens com preço ou dado útil).',
    photos: 4,
    fields: 'kicker, title, highlight, subtitle, items (3 ou 4: title, meta curto, price), primary (link "ver todos")',
    render: cardsFoto,
    sample: S(ITEM(3, { price: 'R$ 00', meta: 'detalhe útil' })),
  },
  carrossel: {
    kind: 'section',
    name: 'Vitrine de cards que desliza para o lado',
    when: 'Catálogo maior (5 a 8 itens: imóveis, pratos, produtos, projetos) para passar com o dedo ou as setas.',
    photos: 4,
    fields: 'kicker, title, highlight, subtitle, items (5 a 8: title, text, price, meta)',
    render: carrossel,
    sample: S(ITEM(5, { price: 'R$ 00', meta: 'detalhe' })),
  },
  split: {
    kind: 'section',
    name: 'Foto + texto com lista de vantagens',
    when: 'Sobre o negócio, um serviço em destaque ou "por que escolher": foto grande com cartão de vidro e 3 vantagens com ícone.',
    photos: 1,
    fields: 'kicker, title, highlight, subtitle, note (destaque curto sobre a foto), items (3: title, text, icon), primary opcional',
    render: split,
    sample: S(ITEM(3), { note: 'Destaque curto' }),
  },
  editorial: {
    kind: 'section',
    name: 'Lista numerada com título fixo ao lado',
    when: 'Diferenciais, especialidades, áreas de atuação (advocacia, consultoria, saúde). Elegante.',
    photos: 1,
    fields: 'kicker, title, highlight, subtitle, items (3 a 6: title, text), primary',
    render: editorial,
    sample: S(ITEM(4)),
  },
  'lista-icones': {
    kind: 'section',
    name: 'Grade de diferenciais com linhas finas',
    when: '3, 4 ou 6 diferenciais curtos com ícones em quadrado degradê. Limpo e organizado.',
    photos: 1,
    fields: 'kicker, title, highlight, subtitle, items (3, 4 ou 6: title, text, icon)',
    render: listaIcones,
    sample: S(ITEM(6)),
  },
  'lista-precos': {
    kind: 'section',
    name: 'Tabela de preços estilo cardápio',
    when: 'Serviços/produtos com preço, por categoria, com linha pontilhada até o preço (barbearia, salão, restaurante, oficina).',
    photos: 0,
    fields: 'kicker, title, highlight, subtitle, items (4 a 12: title, price, text curto, group = categoria), primary',
    render: listaPrecos,
    sample: S([...ITEM(3, { price: 'R$ 00', group: 'Categoria A' }), ...ITEM(3, { price: 'R$ 00', group: 'Categoria B' })]),
  },
  planos: {
    kind: 'section',
    name: 'Planos lado a lado com o do meio em destaque',
    when: 'Pacotes, mensalidades ou combos (2 ou 3). O do meio fica escuro, maior e com borda de luz.',
    photos: 0,
    fields:
      'kicker, title, highlight, subtitle, badge (selo do plano em destaque), items (2 ou 3: title, text = para quem, price, meta = "/mês" ou "/sessão", list = o que inclui), primary (texto dos botões)',
    render: planos,
    sample: S(ITEM(3, { price: 'R$ 00', meta: '/mês', list: ['Item incluso', 'Item incluso', 'Item incluso'] }), {
      badge: 'Mais escolhido',
      primary: 'Escolher plano',
    }),
  },
  passos: {
    kind: 'section',
    name: 'Etapas ligadas por uma linha de luz',
    when: 'Como funciona / como agendar: 3 ou 4 etapas reais.',
    photos: 1,
    fields: 'kicker, title, highlight, subtitle, items (3 ou 4: title, text)',
    render: passos,
    sample: S(ITEM(4)),
  },
  galeria: {
    kind: 'section',
    name: 'Mosaico de fotos com legendas de vidro',
    when: 'Ambiente, trabalhos feitos, pratos ou imóveis em 4 fotos de tamanhos diferentes.',
    photos: 4,
    fields: 'kicker, title, highlight, subtitle, items (4 legendas curtas: title), alts (4)',
    render: galeria,
    sample: S(ITEM(4)),
  },
  numeros: {
    kind: 'section',
    name: 'Números grandes em destaque',
    when: 'SOMENTE com números reais informados no pedido (nota, avaliações, anos, clientes) ou dados concretos (horário, área atendida).',
    photos: 0,
    fields: 'kicker, title, subtitle, facts (2 a 4: value curto + label)',
    render: numeros,
    sample: S([], {
      facts: [
        { label: 'Rótulo', value: '4,9' },
        { label: 'Rótulo', value: '120+' },
        { label: 'Rótulo', value: 'Seg–Sáb' },
      ],
    }),
  },
  depoimentos: {
    kind: 'section',
    name: 'Depoimentos em cartões',
    when: 'SOMENTE com depoimentos reais informados no pedido.',
    photos: 0,
    fields: 'kicker, title, subtitle, items (title = nome, text = depoimento, meta = contexto)',
    render: depoimentos,
    sample: S([{ title: 'Nome Sobrenome', text: 'Depoimento real, curto.', meta: 'Contexto' }]),
  },
  letreiro: {
    kind: 'section',
    name: 'Faixa de letreiro correndo',
    when: 'Faixa fina na cor da marca com serviços, bairros ou especialidades correndo. Boa logo depois do topo. No máximo uma.',
    photos: 0,
    fields: 'items (4 a 8 palavras curtas: title)',
    render: letreiro,
    sample: S(ITEM(4)),
  },
  'faixa-destaque': {
    kind: 'section',
    name: 'Painel de chamada com brilho',
    when: 'Chamada para a ação perto do fim: painel escuro com brilho da marca, título forte e botão.',
    photos: 1,
    fields: 'title (frase forte), highlight, subtitle, primary',
    render: faixaDestaque,
    sample: S([], { title: 'Frase forte que leva à ação', highlight: 'ação' }),
  },
  faq: {
    kind: 'section',
    name: 'Perguntas frequentes em 2 colunas',
    when: 'Dúvidas reais do nicho: título fixo à esquerda, perguntas abrindo à direita.',
    photos: 1,
    fields: 'kicker, title, subtitle, items (5 a 7: title = pergunta, text = resposta completa), primary opcional',
    render: faq,
    sample: S([{ title: 'Pergunta real?', text: 'Resposta completa e útil.' }]),
  },
  contato: {
    kind: 'section',
    name: 'Contato: cartão da marca + informações',
    when: 'Fechamento com o botão de contato grande num cartão na cor da marca e, ao lado, só as informações que existem.',
    photos: 1,
    fields: 'kicker, title, subtitle, primary, note (título do quadro de informações), facts (só dados reais: label = Cidade/Horário/Endereço, value)',
    render: contato,
    sample: S([], {
      title: 'Chamada final clara',
      note: 'Informações',
      facts: [
        { label: 'Cidade', value: 'Cidade real' },
        { label: 'Horário', value: 'Só se informado' },
      ],
    }),
  },
}

// Nomes antigos que ainda aparecem em planos salvos.
const ALIASES: Record<string, string> = { hero: 'hero-dividido' }
export const HEADER_BLOCKS = ['menu-pilula', 'menu-barra']

/** Bloco válido para o tipo de parte, ou null. */
export function blockFor(id: unknown, kinds: ('header' | Block['kind'])[]): string | null {
  const key = typeof id === 'string' ? (ALIASES[id] ?? id) : ''
  if (kinds.includes('header')) return HEADER_BLOCKS.includes(key) ? key : null
  return key in BLOCKS && kinds.includes(BLOCKS[key].kind) ? key : null
}

/** Lista curta (id: nome — quando usar) para o diretor de arte. */
export function blocksMenu(kind: 'header' | Block['kind']): string {
  if (kind === 'header') {
    return [
      '- menu-pilula: menu flutuante em pílula de vidro, centralizado. Combina com quase tudo.',
      '- menu-barra: barra larga transparente que ganha fundo ao rolar. Boa com topos de foto inteira (hero-cinema, hero-retrato, hero-mundo).',
    ].join('\n')
  }
  return Object.entries(BLOCKS)
    .filter(([, block]) => block.kind === kind)
    .map(([id, block]) => `- ${id}: ${block.name}. ${block.when}${block.photos ? ` (${block.photos} foto${block.photos > 1 ? 's' : ''})` : ''}`)
    .join('\n')
}

const text = (value: unknown, max: number) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '')

/** Confere o conteúdo que a IA escreveu (só textos, tamanhos limitados). */
export function cleanContent(raw: unknown): BlockContent {
  const input = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const list = (value: unknown) => (Array.isArray(value) ? value : [])
  return {
    kicker: text(input.kicker, 60),
    title: text(input.title, 140),
    highlight: text(input.highlight, 60),
    subtitle: text(input.subtitle, 320),
    badge: text(input.badge, 60),
    primary: text(input.primary, 50),
    secondary: text(input.secondary, 50),
    note: text(input.note, 120),
    word: text(input.word, 24),
    items: list(input.items)
      .slice(0, 16)
      .map((item) => {
        const value = item && typeof item === 'object' ? (item as Record<string, unknown>) : {}
        return {
          title: text(value.title, 90),
          text: text(value.text, 420),
          price: text(value.price, 30),
          meta: text(value.meta, 60),
          icon: ICON_NAMES.includes(String(value.icon)) ? String(value.icon) : undefined,
          group: text(value.group, 40),
          list: list(value.list)
            .map((line) => text(line, 90))
            .filter(Boolean)
            .slice(0, 8),
        }
      })
      .filter((item) => item.title || item.text),
    facts: list(input.facts)
      .slice(0, 4)
      .map((fact) => {
        const value = fact && typeof fact === 'object' ? (fact as Record<string, unknown>) : {}
        return { label: text(value.label, 40), value: text(value.value, 40) }
      })
      .filter((fact) => fact.label && fact.value),
    alts: list(input.alts)
      .map((alt) => text(alt, 140))
      .slice(0, 8),
  }
}

/** Monta o HTML do bloco com o conteúdo e as cores do site. */
export function renderBlock(id: string, content: BlockContent, tokens: BlockTokens): string {
  const block = BLOCKS[id]
  return block ? block.render(content, tokens) : ''
}
