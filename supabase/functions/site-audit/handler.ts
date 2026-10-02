import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import type { LeadSiteAudit, SiteAuditResult } from '../_shared/lead-intelligence.ts'
import { analyzeHtml, applySemantic } from './analysis.ts'
import { safeFetch, validateUrl, createBudget } from './safe-fetch.ts'
import { semanticAnalysis, readBounded } from './semantic.ts'

const ACTIVE=['queued','fetching','analyzing']
const STALE_MS=120_000
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'}
type Dependencies = {
  admin: SupabaseClient
  userClient: (authorization: string) => SupabaseClient
  env: (name: string) => string | undefined
  waitUntil?: (promise: Promise<unknown>) => void
  fetchPage?: typeof safeFetch
  aiFetch?: typeof fetch
  backgroundError?: (message: string) => void
}
class HttpError extends Error {
  status: number
  constructor(status: number,message: string) {super(message);this.status=status}
}
const json=(body: unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...CORS,'Content-Type':'application/json'}})
const databaseError=()=>new HttpError(503,'Banco indisponivel ou sem permissao. Tente novamente; resultados existentes foram preservados.')
function stale(audit: LeadSiteAudit): boolean {return ACTIVE.includes(audit.status) && Date.now()-new Date(audit.updated_at || audit.created_at).getTime()>STALE_MS}
function fetchMessage(error: unknown): string {
  const message=error instanceof Error ? error.message : 'Falha tecnica durante a coleta.'
  if(/cert|ssl|tls/i.test(message)) return 'SSL/TLS: certificado ou conexao segura invalida. Tente novamente apos corrigir o site.'
  if(/ENOTFOUND|EAI_AGAIN|dns/i.test(message)) return 'DNS: site nao encontrado ou resolucao indisponivel. Tente novamente.'
  if(/ECONNREFUSED|ENETUNREACH|EHOSTUNREACH|ECONNRESET/i.test(message)) return 'Site offline ou conexao interrompida. Tente novamente.'
  return message.slice(0,600)
}

async function complete(admin: SupabaseClient,audit: LeadSiteAudit,status: 'failed'|'partial'|'completed',result: SiteAuditResult|null,error: string|null,finalUrl: string|null): Promise<LeadSiteAudit> {
  const response=await admin.rpc('complete_lead_audit',{p_audit_id:audit.id,p_status:status,p_result:result,p_error:error,p_final_url:finalUrl})
  if(response.error || !response.data) throw databaseError()
  const saved=response.data as LeadSiteAudit
  if(saved.id!==audit.id || saved.user_id!==audit.user_id || saved.contact_id!==audit.contact_id) throw databaseError()
  return saved
}
async function expire(admin: SupabaseClient,audit: LeadSiteAudit): Promise<LeadSiteAudit> {
  return stale(audit) ? await complete(admin,audit,'failed',null,'Timeout: processamento interrompido ou prazo excedido. Inicie uma nova auditoria.',audit.final_url ?? null) : audit
}

async function phase(admin: SupabaseClient,audit: LeadSiteAudit,from: string,to: string): Promise<boolean> {
  const {data,error}=await admin.from('lead_site_audits').update({status:to}).eq('id',audit.id).eq('user_id',audit.user_id).eq('contact_id',audit.contact_id).eq('status',from).select('id').maybeSingle()
  if(error) throw databaseError()
  return !!data
}

export async function runAudit(deps: Dependencies,audit: LeadSiteAudit): Promise<void> {
  let finalUrl: string|null=null
  try {
    if(!await phase(deps.admin,audit,'queued','fetching')) return
    const budget=createBudget()
    const fetchPage=deps.fetchPage ?? safeFetch
    const page=await fetchPage(audit.url,budget)
    finalUrl=page.url
    if(!/^(?:text\/html|application\/xhtml\+xml)(?:;|$)/i.test(page.headers['content-type'] ?? '')) throw new Error('O site nao retornou conteudo HTML valido (Content-Type).')
    if(!await phase(deps.admin,audit,'fetching','analyzing')) return
    const analysis=analyzeHtml(page.body,page.url,page)
    const result=analysis.result
    let partial=analysis.insufficient
    // Only same-origin HTML link candidates are sampled. No assets, social links or form submissions.
    const candidates=analysis.links.slice(0,4)
    const checked: {url: string;status: number|null;error: string|null}[]=[]
    for(const link of candidates) {
      if(budget.deadline-Date.now()<2_000 || budget.bytes>=1_800_000) {partial=true;result.limitations.push('Amostra de links interrompida pelo limite global de coleta.');break}
      try {
        const sampled=await fetchPage(link,budget,{},new URL(page.url).origin)
        checked.push({url:link,status:sampled.status,error:null})
      } catch(error) {
        const message=fetchMessage(error)
        const status=/HTTP (\d{3})/.exec(message)?.[1]
        checked.push({url:link,status:status?Number(status):null,error:message})
        partial=true
        result.findings.push({id:'link-'+checked.length,kind:'issue',title:'Falha em link da amostra interna',evidence:`GET ${link}: ${message}`,source_url:link,impact:'Pode interromper a navegacao neste caminho; demais links nao foram verificados.',recommendation:'Verificar o destino e acesso antes de alterar a navegacao.',priority:'medium',type:'observed'})
      }
    }
    result.metrics.link_check={label:'Links internos (amostra limitada)',status:checked.length?'measured':'not_measured',value:checked.length?JSON.stringify(checked):null,evidence:`${checked.length} de ${analysis.links.length} candidatos (maximo 4); sem formularios, assets ou links externos. ${checked.filter(c=>c.status===404 || c.status===410).length} respostas 404/410.`}
    result.limitations.push('Paginas analisadas: HTML da URL inicial/final; links adicionais receberam apenas verificacao HTTP por amostragem.')
    if(analysis.insufficient) {partial=true;result.limitations.push('Analise comercial nao executada: texto HTML insuficiente.')}
    else {
      try {
        const config=await deps.admin.from('app_config').select('key,value').in('key',['code_maker_api_key','code_maker_model'])
        if(config.error) throw new Error('Configuracao comercial indisponivel.')
        const settings=new Map<string,string>((config.data ?? []).map((c:{key:string;value:string})=>[c.key,c.value]))
        const key=deps.env('CODE_MAKER_API_KEY') || settings.get('code_maker_api_key')
        const model=settings.get('code_maker_model') || deps.env('CODE_MAKER_MODEL') || 'deepseek-v4-flash'
        if(!key) throw new Error('Analise comercial nao executada: provedor de IA nao configurado.')
        result.metrics.semantic_input_characters={label:'Caracteres enviados para analise comercial',status:'measured',value:analysis.text.length,evidence:'Texto/amostra da pagina inicial; cobertura explicita nas limitacoes'}
        applySemantic(result,await semanticAnalysis(analysis.text,page.url,key,model,deps.aiFetch))
      } catch(error) {
        partial=true
        // Do not expose provider response bodies or credentials in stored errors.
        const message=error instanceof Error ? error.message : ''
        result.limitations.push(/^(Analise comercial|Configuracao comercial|JSON |Resposta comercial|Resumo semantico|Fato |Inferencia |Finding |Proveniencia |Chave )/.test(message) ? message.slice(0,300) : 'Analise comercial indisponivel/timeout; fatos HTML preservados.')
      }
    }
    await complete(deps.admin,audit,partial?'partial':'completed',result,null,finalUrl)
  } catch(error) {
    await complete(deps.admin,audit,'failed',null,fetchMessage(error),finalUrl)
  }
}

export function createAuditHandler(deps: Dependencies): (request: Request)=>Promise<Response> {
  return async request=>{
    if(request.method==='OPTIONS') return new Response(null,{status:204,headers:CORS})
    if(request.method!=='POST') return json({error:'Metodo nao permitido.'},405)
    try {
      const authorization=request.headers.get('Authorization') ?? ''
      if(!/^Bearer\s+\S+$/i.test(authorization)) throw new HttpError(401,'Autenticacao necessaria.')
      const {data:auth,error:authError}=await deps.userClient(authorization).auth.getUser()
      if(authError || !auth.user) throw new HttpError(401,'Sessao invalida ou expirada.')
      const userId=auth.user.id
      let body: Record<string,unknown>
      try {
        const value: unknown=JSON.parse(await readBounded(request.body,4096))
        if(!value || typeof value!=='object' || Array.isArray(value)) throw new Error('body')
        body=value as Record<string,unknown>
      } catch {throw new HttpError(400,'JSON invalido ou excessivo.')}
      if(body.action==='status') {
        if(Object.keys(body).some(k=>!['action','audit_id'].includes(k)) || typeof body.audit_id!=='string' || !UUID.test(body.audit_id)) throw new HttpError(400,'Status requer somente action e audit_id UUID.')
        const {data,error}=await deps.admin.from('lead_site_audits').select('*').eq('id',body.audit_id).eq('user_id',userId).maybeSingle()
        if(error) throw databaseError()
        if(!data) throw new HttpError(404,'Auditoria nao encontrada.')
        return json({audit:await expire(deps.admin,data as LeadSiteAudit)})
      }
      if(body.action!=='audit' || Object.keys(body).some(k=>!['action','contact_id','request_id'].includes(k)) ||
        typeof body.contact_id!=='string' || !UUID.test(body.contact_id) || typeof body.request_id!=='string' || !UUID.test(body.request_id)) throw new HttpError(400,'Auditoria requer somente action, contact_id e request_id UUID; URL vem do lead.')
      const {data:contact,error:contactError}=await deps.admin.from('contacts').select('id,current_site').eq('id',body.contact_id).eq('user_id',userId).maybeSingle()
      if(contactError) throw databaseError()
      if(!contact) throw new HttpError(404,'Lead nao encontrado.')
      const duplicate=async():Promise<LeadSiteAudit|null>=>{
        const {data:retry,error}=await deps.admin.from('lead_site_audits').select('*').eq('user_id',userId).eq('request_id',body.request_id).maybeSingle()
        if(error) throw databaseError()
        if(retry) {
          if(retry.contact_id!==body.contact_id) throw new HttpError(409,'request_id ja utilizado para outro lead; use um novo UUID.')
          return await expire(deps.admin,retry as LeadSiteAudit)
        }
        const {data:active,error:activeError}=await deps.admin.from('lead_site_audits').select('*').eq('user_id',userId).eq('contact_id',body.contact_id).in('status',ACTIVE).maybeSingle()
        if(activeError) throw databaseError()
        if(active) {const current=await expire(deps.admin,active as LeadSiteAudit);return ACTIVE.includes(current.status)?current:null}
        return null
      }
      const existing=await duplicate()
      if(existing) return json({audit:existing})
      if(typeof contact.current_site!=='string' || !contact.current_site.trim()) throw new HttpError(400,'Lead sem site oficial; adicione um site para auditar.')
      let url: string
      try {url=validateUrl(contact.current_site).href} catch(error) {throw new HttpError(400,fetchMessage(error))}
      const currentTime=Date.now()
      for(const [duration,limit] of [[3_600_000,6],[86_400_000,30]]) {
        const {count,error}=await deps.admin.from('lead_site_audits').select('id',{count:'exact',head:true}).eq('user_id',userId).gte('created_at',new Date(currentTime-duration).toISOString())
        if(error || count===null) throw databaseError()
        if(count>=limit) throw new HttpError(429,'Limite de auditorias atingido (6/hora, 30/dia). Aguarde antes de tentar novamente.')
      }
      const {data:created,error:insertError}=await deps.admin.from('lead_site_audits').insert({user_id:userId,contact_id:body.contact_id,request_id:body.request_id,status:'queued',url}).select('*').single()
      if(insertError) {
        if(insertError.code==='23505') {const raced=await duplicate();if(raced)return json({audit:raced})}
        throw databaseError()
      }
      if(!created) throw databaseError()
      const audit=created as LeadSiteAudit
      if(deps.waitUntil) {
        deps.waitUntil(runAudit(deps,audit).catch(()=>deps.backgroundError?.('SiteAudit: falha ao persistir estado terminal; consultar status para recuperacao.')))
        return json({audit},202)
      }
      await runAudit(deps,audit)
      const {data:finished,error:readError}=await deps.admin.from('lead_site_audits').select('*').eq('id',audit.id).eq('user_id',userId).maybeSingle()
      if(readError || !finished) throw databaseError()
      return json({audit:finished})
    } catch(error) {
      return json({error:error instanceof HttpError?error.message:'Servico de auditoria indisponivel. Tente novamente.'},error instanceof HttpError?error.status:503)
    }
  }
}
