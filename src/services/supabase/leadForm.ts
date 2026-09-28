import { supabase } from '@/lib/supabaseClient'

export interface LeadForm {
  user_id: string
  slug: string
  enabled: boolean
  title: string
  subtitle: string | null
  ask_email: boolean
  ask_niche: boolean
  ask_city: boolean
  ask_message: boolean
  submissions: number
}

export type LeadFormInput = Omit<LeadForm, 'user_id' | 'submissions'>

export interface PublicLeadForm {
  slug: string
  title: string
  subtitle: string | null
  ask_email: boolean
  ask_niche: boolean
  ask_city: boolean
  ask_message: boolean
  owner_name: string
  owner_company: string | null
  owner_avatar: string | null
}

export interface LeadFormSubmission {
  name: string
  phone: string
  email?: string
  niche?: string
  city?: string
  message?: string
}

export function leadFormUrl(slug: string, origin = typeof window !== 'undefined' ? window.location.origin : 'https://codesellers.vercel.app') {
  return `${origin}/f/${slug}`
}

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw new Error(error.message)
  if (!data.user) throw new Error('Usuário não autenticado.')
  return data.user.id
}

export async function getMyLeadForm(): Promise<LeadForm | null> {
  const userId = await currentUserId()
  const { data, error } = await supabase.from('lead_forms').select('*').eq('user_id', userId).maybeSingle()
  if (error) throw new Error(error.message)
  return data as LeadForm | null
}

export async function saveLeadForm(input: LeadFormInput): Promise<LeadForm> {
  const userId = await currentUserId()
  const { data, error } = await supabase
    .from('lead_forms')
    .upsert({ ...input, user_id: userId }, { onConflict: 'user_id' })
    .select('*')
    .single()
  if (error) {
    if (error.code === '23505') throw new Error('Esse endereço já está em uso. Escolha outro.')
    if (error.code === '23514') throw new Error('Endereço inválido ou reservado. Escolha outro.')
    throw new Error('Não foi possível salvar o formulário.')
  }
  return data as LeadForm
}

// Sugestão de endereço: o do portfólio, se existir.
export async function getPortfolioSlug(): Promise<string | null> {
  const userId = await currentUserId()
  const { data } = await supabase.from('portfolios').select('slug').eq('user_id', userId).maybeSingle()
  return (data?.slug as string | undefined) ?? null
}

export async function getPublicLeadForm(slug: string): Promise<PublicLeadForm | null> {
  const { data, error } = await supabase.rpc('get_lead_form', { p_slug: slug })
  if (error) throw new Error('Não foi possível abrir o formulário.')
  return (data as PublicLeadForm | null) ?? null
}

export async function submitLeadForm(slug: string, input: LeadFormSubmission): Promise<void> {
  const { data, error } = await supabase.rpc('submit_lead_form', {
    p_slug: slug,
    p_name: input.name,
    p_phone: input.phone,
    p_email: input.email || null,
    p_niche: input.niche || null,
    p_city: input.city || null,
    p_message: input.message || null,
  })
  if (error) throw new Error('Não foi possível enviar agora. Tente de novo em instantes.')
  const result = data as { ok: boolean; error?: string }
  if (!result.ok) {
    if (result.error === 'invalid') throw new Error('Confira os dados: nome e um WhatsApp com DDD são obrigatórios.')
    if (result.error === 'rate_limited') throw new Error('Muitos envios agora. Tente de novo mais tarde.')
    throw new Error('Este formulário não está mais disponível.')
  }
}
