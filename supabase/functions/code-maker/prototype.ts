import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import { buildPrototypeContext, prototypeBrief, type PrototypeContact } from '../_shared/prototype-context.ts'
import type { LeadIntelligence, LeadPrototypeOptions, LeadSiteAudit } from '../_shared/lead-intelligence.ts'

export class PrototypeError extends Error {
  status: number
  constructor(message: string, status: number) { super(message); this.status = status }
}
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

export async function findPrototype(admin: SupabaseClient, userId: string, requestId: string, contactId: string) {
  const {data,error} = await admin.from('sites').select('*').eq('user_id',userId).eq('prototype_request_id',requestId).maybeSingle()
  if (error) throw error
  if (data && data.contact_id !== contactId) throw new PrototypeError('Este pedido ja pertence a outro lead.',409)
  return data
}

export async function prepareLeadPrototype(admin: SupabaseClient, userId: string, body: Record<string,unknown>) {
  if (!uuid(body.contact_id) || !uuid(body.request_id) || (body.audit_id != null && !uuid(body.audit_id))) throw new PrototypeError('Lead, auditoria ou identificador do pedido invalido.',400)
  const input = body.prototype_options as Partial<LeadPrototypeOptions> | null
  if (!input || !['whatsapp','quote','booking','call','institutional','lead_capture'].includes(String(input.conversionGoal)) || !['auto','dark','minimal','elegant','vibrant'].includes(String(input.style)) || typeof input.useCurrentWebsite !== 'boolean' || typeof input.fixAuditIssues !== 'boolean') throw new PrototypeError('Opcoes do prototipo invalidas.',400)
  const options = input as LeadPrototypeOptions
  const {data:contact,error:contactError} = await admin.from('contacts').select('id,user_id,name,niche,city,phone,email,current_site,updated_at').eq('id',body.contact_id).eq('user_id',userId).maybeSingle()
  if (contactError) throw contactError
  if (!contact) throw new PrototypeError('Lead nao encontrado ou sem permissao.',403)
  let audit: LeadSiteAudit | null = null
  if (body.audit_id) {
    const {data,error} = await admin.from('lead_site_audits').select('*').eq('id',body.audit_id).eq('contact_id',contact.id).eq('user_id',userId).maybeSingle()
    if (error) throw error
    if (!data) throw new PrototypeError('Auditoria nao encontrada ou sem permissao.',403)
    if (!['completed','partial'].includes(data.status) || !data.result) throw new PrototypeError('Esta auditoria ainda nao pode ser usada.',409)
    audit = data as LeadSiteAudit
  }
  const existing = await findPrototype(admin,userId,body.request_id,body.contact_id)
  if (existing) return {existing,contactId:body.contact_id,requestId:body.request_id}
  const {data:intelligence,error:intelligenceError} = await admin.from('lead_intelligence').select('*').eq('contact_id',contact.id).eq('user_id',userId).maybeSingle()
  if (intelligenceError) throw intelligenceError
  if (!body.audit_id && (options.useCurrentWebsite || options.fixAuditIssues)) {
    const {data,error} = await admin.from('lead_site_audits').select('*').eq('contact_id',contact.id).eq('user_id',userId).in('status',['completed','partial']).order('created_at',{ascending:false}).limit(1).maybeSingle()
    if (error) throw error
    if (data?.result) audit = data as LeadSiteAudit
  }
  const context = buildPrototypeContext(contact as PrototypeContact,intelligence as LeadIntelligence | null,audit,options)
  return {existing:null,contactId:contact.id,requestId:body.request_id,context,brief:prototypeBrief(context,options)}
}
