// Code Maker no navegador: leitura das respostas ao vivo, documento da prévia
// e apelido do link. Testado em src/utils/codeMakerStream.test.mjs.

export type StreamEnd = { kind: 'ok' } | { kind: 'continue' } | { kind: 'error'; message: string } | null

// Toda resposta ao vivo termina com uma linha de controle: <<<OK>>>,
// <<<CONTINUA>>> ou <<<ERRO:mensagem>>>. Separa o texto da IA dessa linha
// (também com a linha chegando pela metade, para não piscar na tela).
export function splitStreamEnd(raw: string): { text: string; end: StreamEnd } {
  const match = raw.match(/\n?<<<(OK|CONTINUA|ERRO:([\s\S]*?))>>>\s*$/)
  if (match) {
    const text = raw.slice(0, match.index)
    if (match[1] === 'OK') return { text, end: { kind: 'ok' } }
    if (match[1] === 'CONTINUA') return { text, end: { kind: 'continue' } }
    return { text, end: { kind: 'error', message: (match[2] ?? '').trim() || 'Algo deu errado. Tente de novo.' } }
  }
  return { text: raw, end: null }
}

// Texto para mostrar enquanto chega: esconde a linha de controle mesmo
// quando ela ainda está chegando pela metade.
export function visibleStreamText(raw: string): string {
  return splitStreamEnd(raw).text.replace(/\n<<<[^\n]*$/, '').replace(/\n<{1,2}$/, '')
}

// Script e estilo que entram só na prévia e na página pública (o site fica
// dentro de um quadro isolado): links "#secao" rolam a página em vez de
// sair do quadro, links externos abrem em outra aba e a posição da rolagem
// é devolvida para a prévia manter o lugar quando o site é atualizado.
export function frameDocument(html: string, options: { scrollY?: number } = {}): string {
  const start = Math.max(0, Math.round(options.scrollY ?? 0))
  const extra = `<style>[id]{scroll-margin-top:84px}</style><script>(function(){
document.addEventListener('click',function(e){var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;if(!a)return;var href=a.getAttribute('href')||'';
if(href.charAt(0)==='#'){e.preventDefault();var id=decodeURIComponent(href.slice(1));var el=id?document.getElementById(id):null;if(el){el.scrollIntoView({behavior:'smooth'})}else{window.scrollTo({top:0,behavior:'smooth'})}return}
if(!a.getAttribute('target'))a.setAttribute('target','_blank');a.setAttribute('rel','noopener')},true);
var last=0;window.addEventListener('scroll',function(){var now=Date.now();if(now-last<120)return;last=now;try{parent.postMessage({codeMakerScroll:window.scrollY},'*')}catch(_){}} ,{passive:true});
var start=${start};if(start>0){window.addEventListener('load',function(){setTimeout(function(){window.scrollTo(0,start)},60)})}
})();</script>`
  return /<\/body>/i.test(html) ? html.replace(/<\/body>(?![\s\S]*<\/body>)/i, `${extra}</body>`) : html + extra
}

export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$/

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .replace(/-+$/g, '')
}

export function publicSiteUrl(slug: string, origin = typeof window !== 'undefined' ? window.location.origin : 'https://codesellers.vercel.app'): string {
  return `${origin}/${slug}`
}

// Executa tarefas com no máximo `limit` ao mesmo tempo.
export async function runWithLimit<T>(items: T[], limit: number, task: (item: T) => Promise<void>): Promise<void> {
  const queue = [...items]
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift() as T
      await task(item)
    }
  })
  await Promise.all(workers)
}

// Cores do painel de código: separa o HTML em pedaços com um tipo cada.
export type CodeToken = { kind: 'text' | 'tag' | 'attr' | 'string' | 'comment'; value: string }

const TOKEN_PATTERN = /(<!--[\s\S]*?(?:-->|$))|(<\/?[a-zA-Z][\w-]*|\/?>)|(\s[\w:@.[\]/-]+(?==))|("[^"]*"?)/g

export function tokenizeHtml(code: string): CodeToken[] {
  const tokens: CodeToken[] = []
  let last = 0
  let insideTag = false
  for (const match of code.matchAll(TOKEN_PATTERN)) {
    const index = match.index ?? 0
    const [value, comment, tag, attr, string] = match
    // Atributos e textos entre aspas só contam dentro de uma tag.
    if (!comment && !tag && !insideTag) continue
    if (index > last) tokens.push({ kind: 'text', value: code.slice(last, index) })
    if (comment) tokens.push({ kind: 'comment', value })
    else if (tag) {
      tokens.push({ kind: 'tag', value })
      insideTag = !tag.endsWith('>')
    } else if (attr) tokens.push({ kind: 'attr', value })
    else if (string) tokens.push({ kind: 'string', value })
    last = index + value.length
  }
  if (last < code.length) tokens.push({ kind: 'text', value: code.slice(last) })
  return tokens
}

// Link do botão "Criar site" (CRM e Buyers Hunter): abre o Code Maker com
// os dados do negócio já preenchidos.
export function newSiteLink(data: {
  name: string
  niche?: string | null
  city?: string | null
  phone?: string | null
  contactId?: string | null
  rating?: number | null
  reviews?: number | null
}): string {
  const params = new URLSearchParams({ novo: '1', nome: data.name })
  if (data.niche) params.set('nicho', data.niche)
  if (data.city) params.set('cidade', data.city)
  if (data.phone) params.set('telefone', data.phone)
  if (data.contactId) params.set('contato', data.contactId)
  if (data.rating) params.set('nota', String(data.rating))
  if (data.reviews) params.set('avaliacoes', String(data.reviews))
  return `/code-maker?${params.toString()}`
}

// Nome do arquivo para baixar o site.
export function downloadName(slug: string): string {
  return `${slug || 'site'}.html`
}
