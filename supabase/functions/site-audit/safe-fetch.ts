import { isIP } from 'node:net'
import { resolve4, resolve6 } from 'node:dns/promises'
import { request as httpRequest, type RequestOptions } from 'node:http'
import { request as httpsRequest } from 'node:https'
import { checkServerIdentity } from 'node:tls'
import { Buffer } from 'node:buffer'
import { requestDenoPinned, type NativeNetwork } from './deno-transport.ts'

export const MAX_BYTES = 2_000_000
const SOCIAL = ['facebook.com','fb.com','fb.me','instagram.com','linkedin.com','twitter.com','x.com','tiktok.com','youtube.com','youtu.be','threads.net','threads.com','wa.me','whatsapp.com','linktr.ee','t.me','telegram.me','maps.app.goo.gl','goo.gl','g.page','maps.google.com']
export function socialHost(host: string): boolean {
  return /^maps\.google\.[a-z.]+$/.test(host) || SOCIAL.some(domain => host === domain || host.endsWith('.' + domain))
}

export function publicAddress(raw: string): boolean {
  const ip = raw.replace(/^\[|\]$/g, '').toLowerCase()
  if (isIP(ip) === 4) {
    const [a,b,c] = ip.split('.').map(Number)
    return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 168 || (b === 0 && (c === 0 || c === 2)) || (b === 88 && c === 99) || (b === 31 && c === 196) || (b === 52 && c === 193) || (b === 175 && c === 48))) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
      (a === 203 && b === 0 && c === 113))
  }
  if (isIP(ip) !== 6 || ip.includes('.') || ip.includes('%')) return false
  const halves = ip.split('::')
  const left = halves[0] ? halves[0].split(':') : []
  const right = halves[1] ? halves[1].split(':') : []
  const parts = halves.length === 2 ? [...left, ...Array(8-left.length-right.length).fill('0'), ...right] : left
  const value = parts.reduce((n,part) => (n << 16n) | BigInt('0x'+part), 0n)
  const inRange = (base: string, prefix: number) => (value >> BigInt(128-prefix)) === (BigInt(base) >> BigInt(128-prefix))
  // Accept global unicast only; reject special-purpose, documentation and transition ranges.
  return inRange('0x20000000000000000000000000000000',3) &&
    !inRange('0x20010000000000000000000000000000',23) &&
    !inRange('0x20010db8000000000000000000000000',32) &&
    !inRange('0x20020000000000000000000000000000',16) &&
    !inRange('0x3fff0000000000000000000000000000',20) &&
    !inRange('0x3ffe0000000000000000000000000000',16) &&
    !inRange('0x2620004f800000000000000000000000',48)
}

export function validateUrl(input: string): URL {
  let url: URL
  let normalized=input.trim()
  if(!/^https?:\/\//i.test(normalized)) {
    if(!/^[a-z0-9.-]+(?::\d+)?(?:[/?#]|$)/i.test(normalized)) throw new Error('URL invalida: informe um site HTTP/HTTPS oficial.')
    normalized='https://'+normalized
  }
  try { url = new URL(normalized) } catch { throw new Error('URL invalida: informe um site HTTP/HTTPS oficial.') }
  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase().replace(/\.$/, '')
  if (!['http:','https:'].includes(url.protocol) || url.username || url.password ||
      (url.port && url.port !== (url.protocol === 'https:' ? '443' : '80'))) throw new Error('URL bloqueada: protocolo, credenciais ou porta nao permitidos.')
  if (socialHost(host) || (/^(www\.)?google\.[a-z.]+$/.test(host) && /^\/maps(?:\/|$)/.test(url.pathname))) throw new Error('Rede social/Maps nao e site oficial para auditoria.')
  if (!host || !host.includes('.') && !isIP(host) || /(^|\.)(localhost|local|internal|invalid|test|home|lan)$/.test(host) || (isIP(host) && !publicAddress(host))) throw new Error('SSRF: destino local, privado ou reservado bloqueado.')
  url.hash = ''
  return url
}

export type FetchBudget = { deadline: number; bytes: number; redirects: number }
export const createBudget = (ms = 30_000): FetchBudget => ({ deadline: Date.now()+ms, bytes:0, redirects:0 })
export type RawPage = { status: number; headers: Record<string,string>; body: string; bytes: number }
export type FetchedPage = RawPage & { url: string; elapsed: number; redirects: number }
type Dependencies = {
  resolve?: (host: string) => Promise<string[]>
  request?: (url: URL, ip: string, budget: FetchBudget) => Promise<RawPage>
}

export async function resolvePublicHost(host: string): Promise<string[]> {
  if (isIP(host)) return [host]
  const results = await Promise.allSettled([resolve4(host),resolve6(host)])
  const addresses: string[] = []
  for (const result of results) {
    if (result.status === 'fulfilled') addresses.push(...result.value)
    else if (!['ENODATA','ENOTFOUND'].includes(result.reason?.code)) throw new Error('DNS indisponivel: nao foi possivel validar todos os enderecos.')
  }
  if (!addresses.length) throw new Error('DNS: site nao encontrado.')
  return addresses
}

export function pinnedOptions(url: URL, ip: string): RequestOptions & { servername?: string; rejectUnauthorized: boolean; checkServerIdentity: typeof checkServerIdentity } {
  const host = url.hostname.replace(/^\[|\]$/g, '')
  return {
    protocol: url.protocol, hostname: ip, family: isIP(ip), port: url.protocol === 'https:' ? 443 : 80,
    method: 'GET', path: url.pathname+url.search, agent:false,
    headers: { Host:url.host, Accept:'text/html,application/xhtml+xml', 'Accept-Encoding':'identity', 'User-Agent':'CodeSellersSiteAudit/1.0', Connection:'close' },
    servername: isIP(host) ? undefined : host, rejectUnauthorized:true,
    checkServerIdentity: (_hostname,cert) => checkServerIdentity(host,cert),
  }
}

function timeRemaining(budget: FetchBudget): number {
  const remaining = budget.deadline-Date.now()
  if (remaining <= 0) throw new Error('Timeout: limite global da coleta excedido.')
  return remaining
}
async function bounded<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([promise,new Promise<never>((_,reject) => {timer=setTimeout(()=>reject(new Error('Timeout na coleta/DNS.')),ms)})])
  } finally {clearTimeout(timer)}
}

export async function requestPinned(url: URL, ip: string, budget: FetchBudget): Promise<RawPage> {
  const native=(globalThis as unknown as {Deno?: NativeNetwork}).Deno
  if(native) {
    if(typeof native.connect!=='function' || typeof native.startTls!=='function') throw new Error('Runtime sem transporte numerico TLS seguro disponivel.')
    return await requestDenoPinned(url,ip,budget,native)
  }
  const timeout = Math.min(8_000,timeRemaining(budget))
  return await new Promise((resolve,reject) => {
    let timer: ReturnType<typeof setTimeout>
    const req = (url.protocol === 'https:' ? httpsRequest : httpRequest)(pinnedOptions(url,ip),res => {
      const headers: Record<string,string> = {}
      for (const [key,value] of Object.entries(res.headers)) if (value !== undefined) headers[key.toLowerCase()] = Array.isArray(value) ? value.join(', ') : String(value)
      const status = res.statusCode ?? 0
      const fail = (message: string) => {res.destroy();req.destroy(new Error(message))}
      if (headers['content-encoding'] && headers['content-encoding'].toLowerCase() !== 'identity') {fail('Conteudo comprimido recusado para limitar bytes com seguranca.');return}
      if (Number(headers['content-length'] ?? 0)+budget.bytes > MAX_BYTES) {fail('HTML excede limite global de bytes.');return}
      const chunks: Buffer[] = []
      let bytes = 0
      res.on('data',chunk => {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
        bytes += buffer.length
        if (budget.bytes+bytes > MAX_BYTES) {fail('HTML excede limite global de bytes.');return}
        chunks.push(buffer)
      })
      res.on('error',reject)
      res.on('aborted',()=>reject(new Error('Conexao interrompida durante coleta.')))
      res.on('end',() => {
        clearTimeout(timer)
        const bodyBuffer = Buffer.concat(chunks)
        const charset = /charset\s*=\s*["']?([^\s;"']+)/i.exec(headers['content-type'] ?? '')?.[1] ?? 'utf-8'
        try {resolve({status,headers,body:new TextDecoder(charset).decode(bodyBuffer),bytes})}
        catch {reject(new Error('Codificacao HTML nao suportada.'))}
      })
    })
    timer=setTimeout(()=>req.destroy(new Error('Timeout: site nao respondeu no prazo.')),timeout)
    req.on('error',error => {clearTimeout(timer);reject(error)})
    req.end()
  })
}

export async function safeFetch(input: string, budget: FetchBudget, deps: Dependencies = {}, requiredOrigin?: string): Promise<FetchedPage> {
  const start = Date.now()
  let url = validateUrl(input)
  let redirects = 0
  for (;;) {
    if (requiredOrigin && url.origin !== requiredOrigin) throw new Error('Amostra bloqueada: redirecionamento fora da origem analisada.')
    const host = url.hostname.replace(/^\[|\]$/g, '')
    const addresses = await bounded((deps.resolve ?? resolvePublicHost)(host),timeRemaining(budget))
    if (!addresses.length || addresses.some(ip=>!publicAddress(ip))) throw new Error('SSRF: DNS retornou endereco privado/reservado.')
    const page = await bounded((deps.request ?? requestPinned)(url,addresses[0],budget),timeRemaining(budget))
    budget.bytes += page.bytes
    if (budget.bytes > MAX_BYTES) throw new Error('HTML excede limite global de bytes.')
    if (page.headers['content-encoding'] && page.headers['content-encoding'].toLowerCase() !== 'identity') throw new Error('Conteudo comprimido nao suportado.')
    if ([301,302,303,307,308].includes(page.status)) {
      if (++redirects > 3 || ++budget.redirects > 6) throw new Error('Limite de redirecionamentos excedido.')
      if (!page.headers.location) throw new Error('Redirecionamento sem destino.')
      url = validateUrl(new URL(page.headers.location,url).href)
      continue
    }
    if (page.status < 200 || page.status >= 300) throw new Error(`HTTP ${page.status}: ${page.status === 403 ? 'acesso bloqueado/anti-bot (possivel Cloudflare)' : page.status === 429 ? 'limite de acesso; tente novamente mais tarde' : 'site indisponivel'}.`)
    return {...page,url:url.href,elapsed:Date.now()-start,redirects}
  }
}
