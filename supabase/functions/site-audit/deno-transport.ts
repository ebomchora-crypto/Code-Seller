import type { FetchBudget, RawPage } from './safe-fetch.ts'

interface Socket {
  read(buffer: Uint8Array): Promise<number|null>
  write(buffer: Uint8Array): Promise<number>
  close(): void
  handshake?: () => Promise<unknown>
}
export interface NativeNetwork {
  connect(options: {hostname: string;port: number}): Promise<Socket>
  startTls(socket: Socket,options: {hostname: string;alpnProtocols: string[]}): Promise<Socket>
}
const MAX_BODY=2_000_000
const MAX_HEADER=65_536
const encoder=new TextEncoder()
function close(socket: Socket|undefined) {try{socket?.close()}catch{/* A timed-out socket may already be closed. */}}

class Reader {
  socket: Socket
  buffer=new Uint8Array(0)
  offset=0
  wireBytes=0
  headerBytes=0
  constructor(socket: Socket) {this.socket=socket}
  async fill(): Promise<boolean> {
    if(this.offset<this.buffer.length) return true
    const next=new Uint8Array(16_384)
    const count=await this.socket.read(next)
    if(count===null) return false
    if(count<=0) throw new Error('Resposta HTTP interrompida.')
    this.wireBytes+=count
    if(this.wireBytes>MAX_BODY+MAX_HEADER+262_144) throw new Error('Resposta HTTP excede limite de bytes/framing.')
    this.buffer=next.subarray(0,count);this.offset=0
    return true
  }
  async exact(length: number): Promise<Uint8Array> {
    const result=new Uint8Array(length)
    let offset=0
    while(offset<length) {
      if(!await this.fill()) throw new Error('Resposta HTTP truncada.')
      const count=Math.min(length-offset,this.buffer.length-this.offset)
      result.set(this.buffer.subarray(this.offset,this.offset+count),offset)
      this.offset+=count;offset+=count
    }
    return result
  }
  async line(): Promise<string> {
    const bytes: number[]=[]
    for(;;) {
      if(!await this.fill()) throw new Error('Cabecalho/framing HTTP truncado.')
      const byte=this.buffer[this.offset++]
      bytes.push(byte)
      if(++this.headerBytes>MAX_HEADER || bytes.length>8192) throw new Error('Cabecalho/framing HTTP excede limite.')
      if(byte===10) {
        if(bytes.length<2 || bytes[bytes.length-2]!==13) throw new Error('Framing HTTP invalido.')
        return new TextDecoder('latin1').decode(Uint8Array.from(bytes.slice(0,-2)))
      }
    }
  }
}

async function responseHead(reader: Reader): Promise<{status: number;headers: Record<string,string>}> {
  for(let interim=0;interim<4;interim++) {
    const match=/^HTTP\/1\.[01] ([1-5]\d\d)(?: [^\r\n]*)?$/.exec(await reader.line())
    if(!match) throw new Error('Status HTTP invalido.')
    const status=Number(match[1]),headers: Record<string,string>={}
    for(;;) {
      const line=await reader.line()
      if(!line) break
      // Reject control characters and folded headers to avoid ambiguous HTTP framing.
      // eslint-disable-next-line no-control-regex
      const field=/^([!#$%&'*+.^_`|~0-9A-Za-z-]+):[ \t]*([^\x00-\x08\x0a-\x1f\x7f]*)$/.exec(line)
      if(!field) throw new Error('Cabecalho HTTP invalido.')
      const key=field[1].toLowerCase(),value=field[2].trim()
      if(key in headers && ['content-length','transfer-encoding','content-encoding','location'].includes(key)) throw new Error('Cabecalho HTTP ambiguo.')
      headers[key]=key in headers?headers[key]+', '+value:value
    }
    if(status>=200) return {status,headers}
    if(status===101) throw new Error('Upgrade de protocolo nao permitido.')
  }
  throw new Error('Respostas HTTP intermediarias excessivas.')
}

async function readResponse(socket: Socket,budget: FetchBudget): Promise<RawPage> {
  const reader=new Reader(socket)
  const {status,headers}=await responseHead(reader)
  const remaining=MAX_BODY-budget.bytes
  if(headers['content-encoding'] && headers['content-encoding'].toLowerCase()!=='identity') throw new Error('Conteudo comprimido recusado para limitar bytes com seguranca.')
  const lengthHeader=headers['content-length'],transfer=headers['transfer-encoding']
  if(transfer && (transfer.toLowerCase()!=='chunked' || lengthHeader!==undefined)) throw new Error('Framing HTTP ambiguo ou nao suportado.')
  if(lengthHeader!==undefined && !/^\d+$/.test(lengthHeader)) throw new Error('Content-Length invalido.')
  const length=lengthHeader!==undefined?Number(lengthHeader):null
  if(length!==null && (!Number.isSafeInteger(length) || length>remaining)) throw new Error('HTML excede limite global de bytes.')
  const chunks: Uint8Array[]=[]
  let bytes=0
  const append=(chunk: Uint8Array)=>{
    bytes+=chunk.length
    if(bytes>remaining) throw new Error('HTML excede limite global de bytes.')
    chunks.push(chunk)
  }
  if(status===204 || status===304) { /* These responses have no message body. */ }
  else if(transfer) {
    for(;;) {
      const line=await reader.line()
      if(!/^[0-9a-f]+(?:;[^\r\n]*)?$/i.test(line)) throw new Error('Tamanho de chunk HTTP invalido.')
      const size=Number.parseInt(line.split(';')[0],16)
      if(!Number.isSafeInteger(size) || size>remaining-bytes) throw new Error('HTML excede limite global de bytes.')
      if(size===0) {while(await reader.line()) {/* Bounded trailers are ignored, never merged into response headers. */}break}
      append(await reader.exact(size))
      const end=await reader.exact(2)
      if(end[0]!==13 || end[1]!==10) throw new Error('Chunk HTTP malformado.')
    }
  } else if(length!==null) append(await reader.exact(length))
  else while(await reader.fill()) {
    append(reader.buffer.slice(reader.offset));reader.offset=reader.buffer.length
  }
  const body=new Uint8Array(bytes)
  let offset=0
  for(const chunk of chunks) {body.set(chunk,offset);offset+=chunk.length}
  const charset=/charset\s*=\s*["']?([^\s;"']+)/i.exec(headers['content-type'] ?? '')?.[1] ?? 'utf-8'
  try {return {status,headers,body:new TextDecoder(charset).decode(body),bytes}}
  catch {throw new Error('Codificacao HTML nao suportada.')}
}

export async function requestDenoPinned(url: URL,ip: string,budget: FetchBudget,runtime: NativeNetwork): Promise<RawPage> {
  const timeout=Math.min(8_000,budget.deadline-Date.now())
  if(timeout<=0) throw new Error('Timeout: limite global da coleta excedido.')
  let socket: Socket|undefined,timer: ReturnType<typeof setTimeout>|undefined,stopped=false
  const operation=async()=>{
    // TLS wraps this exact numeric TCP connection; hostname is only the SNI/certificate identity.
    socket=await runtime.connect({hostname:ip,port:url.protocol==='https:'?443:80})
    if(stopped) {close(socket);throw new Error('Timeout na conexao.')}
    if(url.protocol==='https:') {
      const upgraded=await runtime.startTls(socket,{hostname:url.hostname.replace(/^\[|\]$/g,''),alpnProtocols:['http/1.1']})
      socket=upgraded
      if(stopped) {close(socket);throw new Error('Timeout TLS.')}
      if(!socket.handshake) throw new Error('Runtime TLS sem verificacao de handshake disponivel.')
      await socket.handshake()
    }
    if(stopped) throw new Error('Timeout na conexao.')
    const wire=encoder.encode(`GET ${url.pathname+url.search} HTTP/1.1\r\nHost: ${url.host}\r\nAccept: text/html,application/xhtml+xml\r\nAccept-Encoding: identity\r\nUser-Agent: CodeSellersSiteAudit/1.0\r\nConnection: close\r\n\r\n`)
    let offset=0
    while(offset<wire.length) {
      const count=await socket.write(wire.subarray(offset))
      if(count<=0) throw new Error('Conexao interrompida durante envio HTTP.')
      offset+=count
    }
    return await readResponse(socket,budget)
  }
  try {
    return await Promise.race([operation(),new Promise<never>((_,reject)=>{
      timer=setTimeout(()=>{stopped=true;close(socket);reject(new Error('Timeout: site nao respondeu no prazo.'))},timeout)
    })])
  } finally {stopped=true;clearTimeout(timer);close(socket)}
}
