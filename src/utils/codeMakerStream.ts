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
// Link para outra página do projeto: "publicacoes.html", "./paginas/x.html",
// "index.html#contato". Devolve a página ('' = inicial) e o #trecho.
export function internalPageLink(href: string): { page: string; hash: string } | null {
  const match = href.trim().match(/^(?:\.\/|\/)?(?:paginas\/)?([a-z0-9-]+)\.html(#[^?]*)?$/i)
  if (!match) return null
  const page = match[1].toLowerCase()
  return { page: page === 'index' ? '' : page, hash: match[2] ?? '' }
}

// `page`: página extra aberta (um #trecho que não existe nela leva à inicial).
// `hash`: trecho para rolar ao abrir. Links entre páginas viram uma mensagem
// para quem mostra o quadro trocar o documento (o site roda isolado).
export function frameDocument(html: string, options: { scrollY?: number; page?: string; hash?: string } = {}): string {
  const start = Math.max(0, Math.round(options.scrollY ?? 0))
  const page = JSON.stringify(options.page ?? '')
  const hash = JSON.stringify((options.hash ?? '').replace(/^#/, ''))
  const extra = `<style>[id]{scroll-margin-top:84px}[data-cs-status]{margin:10px 0 0;font:600 14px/1.4 system-ui,sans-serif}</style><script>(function(){
var page=${page},hash=${hash};
function post(m){try{parent.postMessage(m,'*')}catch(_){}}
function go(p,h){post({codeMakerPage:p,codeMakerHash:h||''})}
var inspecting=false,box=null,tag=null;
function kindOf(h){if(/^tel:/i.test(h))return'phone';if(/^mailto:/i.test(h))return'email';if(/^(?:https?:)?\\/\\/(?:wa\\.me|api\\.whatsapp\\.com|web\\.whatsapp\\.com|chat\\.whatsapp\\.com|(?:www\\.)?whatsapp\\.com)(?:[\\/?#]|$)/i.test(h))return'whatsapp';return''}
function setInspect(on){inspecting=on;document.documentElement.style.cursor=on?'crosshair':'';if(!on&&box){box.style.display='none'}}
function mark(el){if(!box){box=document.createElement('div');box.style.cssText='position:fixed;pointer-events:none;z-index:2147483647;border:2px solid #8b5cf6;background:rgba(139,92,246,.14);border-radius:4px;display:none;transition:all .06s';tag=document.createElement('span');tag.style.cssText='position:absolute;left:-2px;top:-22px;background:#8b5cf6;color:#fff;font:600 11px system-ui,sans-serif;padding:2px 6px;border-radius:4px;white-space:nowrap';box.appendChild(tag);document.documentElement.appendChild(box)}
var r=el.getBoundingClientRect();box.style.display='block';box.style.left=r.left+'px';box.style.top=r.top+'px';box.style.width=r.width+'px';box.style.height=r.height+'px';tag.textContent=el.tagName.toLowerCase()}
function pick(el){var sec=el.closest('header[data-header],section[id],footer')||el.closest('header');var file='';if(sec){if(sec.tagName==='HEADER')file='secoes/header.html';else if(sec.tagName==='FOOTER')file='secoes/footer.html';else file='secoes/'+sec.id+'.html'}
var txt=(el.innerText||el.getAttribute('alt')||'').replace(/\\s+/g,' ').trim().slice(0,120);var h=el.outerHTML;if(h.length>700)h=h.slice(0,700)+'...';
post({csPick:{tag:el.tagName.toLowerCase(),text:txt,file:file,html:h,page:page}})}
document.addEventListener('mousemove',function(e){if(inspecting&&e.target&&e.target.nodeType===1)mark(e.target)},true);
document.addEventListener('click',function(e){if(inspecting){e.preventDefault();e.stopPropagation();if(e.target&&e.target.nodeType===1)pick(e.target);return}var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;if(!a)return;var href=a.getAttribute('href')||'';
var k=kindOf(href.trim());if(k)post({csEvent:k,page:page});
if(href.charAt(0)==='#'){e.preventDefault();var id=decodeURIComponent(href.slice(1));var el=id?document.getElementById(id):null;if(el){el.scrollIntoView({behavior:'smooth'})}else if(page){go('',id)}else{window.scrollTo({top:0,behavior:'smooth'})}return}
var m=href.trim().match(/^(?:\\.\\/|\\/)?(?:paginas\\/)?([a-z0-9-]+)\\.html(#[^?]*)?$/i);
if(m){e.preventDefault();var p=m[1].toLowerCase();go(p==='index'?'':p,(m[2]||'').slice(1));return}
if(!a.getAttribute('target'))a.setAttribute('target','_blank');a.setAttribute('rel','noopener')},true);
var pending=null;
document.addEventListener('submit',function(e){var f=e.target;if(!f||f.tagName!=='FORM')return;e.preventDefault();if(pending)return;var d={name:'',phone:'',email:'',message:'',website:''};
Array.prototype.forEach.call(f.elements,function(x){if(!x.name&&!x.type)return;var n=(x.name||x.id||'').toLowerCase(),v=(x.value||'').trim();if(!v||x.type==='submit'||x.type==='button'||x.type==='password'||x.type==='file')return;
if(/website|url|honey|hp/.test(n)){d.website=v;return}
if(x.type==='email'||/mail/.test(n)){if(!d.email)d.email=v}else if(x.type==='tel'||/tel|fone|whats|celular|phone/.test(n)){if(!d.phone)d.phone=v}else if(x.tagName==='TEXTAREA'||/msg|mensag|message|obs|texto|descri/.test(n)){d.message=d.message?d.message+'\\n'+n+': '+v:v}else if(/nome|name/.test(n)||!d.name){if(!d.name)d.name=v;else d.message=d.message+(d.message?'\\n':'')+n+': '+v}else{d.message=d.message+(d.message?'\\n':'')+n+': '+v}});
var st=f.querySelector('[data-cs-status]');if(!st){st=document.createElement('p');st.setAttribute('data-cs-status','');f.appendChild(st)}st.style.color='';st.textContent='Enviando...';pending={form:f,status:st};
var btn=f.querySelector('[type=submit],button:not([type])');if(btn)btn.disabled=true;
if(d.website){window.setTimeout(function(){done({ok:true})},400);return}
post({csLead:d,page:page})},true);
function done(r){if(!pending)return;var f=pending.form,st=pending.status;pending=null;var btn=f.querySelector('[type=submit],button:not([type])');if(btn)btn.disabled=false;
if(r&&r.ok){st.style.color='#15803d';st.textContent=r.preview?'Prévia: no site publicado, este contato chega direto no seu CRM.':'Recebemos sua mensagem! Entraremos em contato em breve.';f.reset()}else{st.style.color='#b91c1c';st.textContent=r&&r.error==='invalid'?'Confira o nome e o telefone ou e-mail e tente de novo.':'Não foi possível enviar agora. Tente de novo em instantes.'}}
window.addEventListener('message',function(e){if(e.source!==parent)return;var m=e.data||{};if(m.csInspect!==undefined)setInspect(!!m.csInspect);if(m.csLeadResult)done(m.csLeadResult)});
var last=0;window.addEventListener('scroll',function(){var now=Date.now();if(now-last<120)return;last=now;post({codeMakerScroll:window.scrollY})},{passive:true});
var start=${start};window.addEventListener('load',function(){setTimeout(function(){if(hash){var el=document.getElementById(hash);if(el){el.scrollIntoView();return}}if(start>0)window.scrollTo(0,start)},60)});
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
