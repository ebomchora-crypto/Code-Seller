import { supabase } from '@/lib/supabaseClient'
import { joinContinuation, type SiteBrief, type SiteParts, type SitePlan } from '../../../supabase/functions/code-maker/site'
import { splitStreamEnd, visibleStreamText } from '@/utils/codeMakerStream'

export type SiteStatus = 'planning' | 'building' | 'ready' | 'error'
export type StoredPlan = SitePlan & { actions?: string[] }

export interface Site {
  id: string
  user_id: string
  slug: string
  name: string
  contact_id: string | null
  brief: SiteBrief
  plan: StoredPlan | null
  parts: SiteParts
  html: string | null
  status: SiteStatus
  published: boolean
  views: number
  created_at: string
  updated_at: string
}

export type SiteSummary = Pick<Site, 'id' | 'slug' | 'name' | 'status' | 'published' | 'views' | 'html' | 'updated_at' | 'created_at'>

export interface SiteVersion {
  id: string
  site_id: string
  kind: 'create' | 'edit' | 'restore'
  instruction: string | null
  actions: string[]
  plan: StoredPlan | null
  parts: SiteParts | null
  created_at: string
}

export interface CodeMakerUsage {
  sites_today: number
  /** null = sem limite. */
  sites_limit: number | null
  edits_today: number
  edits_limit: number
}

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/code-maker`
const MAX_CONTINUATIONS = 5

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Sessão expirada. Entre novamente.')
  return {
    Authorization: `Bearer ${token}`,
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
  }
}

async function post(body: Record<string, unknown>, signal?: AbortSignal): Promise<Response> {
  let response: Response
  try {
    response = await fetch(FUNCTION_URL, { method: 'POST', headers: await authHeaders(), body: JSON.stringify(body), signal })
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') throw error
    throw new Error('Sem conexão com o servidor. Confira a internet e tente de novo.')
  }
  const type = response.headers.get('Content-Type') ?? ''
  if (!response.ok || type.includes('application/json')) {
    const data = (await response.json().catch(() => ({}))) as { error?: string }
    if (!response.ok) throw new Error(data.error ?? 'Algo deu errado. Tente de novo.')
    // JSON com sucesso só acontece nas ações que não são ao vivo.
    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })
  }
  return response
}

async function postJson<T>(body: Record<string, unknown>): Promise<T> {
  const response = await post(body)
  return (await response.json()) as T
}

export function getCodeMakerUsage(): Promise<CodeMakerUsage> {
  return postJson<CodeMakerUsage>({ action: 'usage' })
}

export async function createSite(brief: SiteBrief, contactId?: string | null): Promise<Pick<Site, 'id' | 'slug' | 'name' | 'status'>> {
  const data = await postJson<{ site: Pick<Site, 'id' | 'slug' | 'name' | 'status'> }>({
    action: 'create',
    brief,
    contact_id: contactId ?? undefined,
  })
  return data.site
}

// Chama uma ação ao vivo (plan, part, edit) até a IA terminar. Se a chamada
// passar do tempo, continua de onde parou. `onText` recebe o texto inteiro
// até o momento, a cada pedaço que chega.
export async function streamCodeMaker(
  body: Record<string, unknown>,
  onText: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  let partial = ''
  for (let round = 0; round <= MAX_CONTINUATIONS; round++) {
    const response = await post(partial ? { ...body, partial } : body, signal)
    const reader = response.body?.getReader()
    if (!reader) throw new Error('Resposta vazia do servidor.')
    const decoder = new TextDecoder()
    let raw = ''
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      raw += decoder.decode(value, { stream: true })
      const visible = visibleStreamText(raw)
      onText(partial ? joinContinuation(partial, visible) : visible)
    }
    raw += decoder.decode()
    const { text, end } = splitStreamEnd(raw)
    const full = partial ? joinContinuation(partial, text) : text
    if (end?.kind === 'ok') return full
    if (end?.kind === 'error') throw new Error(end.message)
    // Tempo da chamada acabou (ou a conexão caiu no meio): continua.
    partial = full
  }
  throw new Error('A IA demorou demais para terminar. Tente de novo.')
}

const SUMMARY_COLUMNS = 'id, slug, name, status, published, views, html, updated_at, created_at'

export async function listSites(): Promise<SiteSummary[]> {
  const { data, error } = await supabase.from('sites').select(SUMMARY_COLUMNS).order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as SiteSummary[]
}

export async function getSite(id: string): Promise<Site | null> {
  const { data, error } = await supabase.from('sites').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return data as Site | null
}

export async function updateSite(id: string, changes: Partial<Pick<Site, 'name' | 'slug' | 'published'>>): Promise<Site> {
  const { data, error } = await supabase.from('sites').update(changes).eq('id', id).select('*').single()
  if (error) {
    if (error.code === '23505') throw new Error('Esse link já está em uso. Escolha outro.')
    if (error.code === '23514' && error.message.includes('reserved')) throw new Error('Esse nome é usado pelo próprio sistema. Escolha outro.')
    if (error.code === '23514') throw new Error('Use só letras minúsculas, números e hífen (3 a 48 caracteres).')
    throw new Error(error.message)
  }
  return data as Site
}

export async function deleteSite(id: string): Promise<void> {
  const { error } = await supabase.from('sites').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function listSiteVersions(siteId: string): Promise<SiteVersion[]> {
  const { data, error } = await supabase
    .from('site_versions')
    .select('id, site_id, kind, instruction, actions, plan, parts, created_at')
    .eq('site_id', siteId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as SiteVersion[]
}

// Volta o site para uma versão anterior (e registra isso no histórico).
export async function restoreSiteVersion(site: Site, version: SiteVersion, html: string): Promise<Site> {
  if (!version.plan || !version.parts) throw new Error('Esta versão não pode ser restaurada.')
  const { data, error } = await supabase
    .from('sites')
    .update({ plan: version.plan, parts: version.parts, html, status: 'ready' })
    .eq('id', site.id)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  const { error: versionError } = await supabase.from('site_versions').insert({
    site_id: site.id,
    user_id: site.user_id,
    kind: 'restore',
    instruction: null,
    actions: [],
    plan: version.plan,
    parts: version.parts,
  })
  if (versionError) throw new Error(versionError.message)
  return data as Site
}

export async function getPublicSite(slug: string): Promise<{ name: string; html: string } | null> {
  const { data, error } = await supabase.rpc('get_public_site', { p_slug: slug })
  if (error) throw new Error(error.message)
  return (data as { name: string; html: string } | null) ?? null
}

const ASSET_BUCKET = 'site-assets'
const MAX_SIDE = { logo: 800, photo: 1920 } as const

// Reduz a imagem no navegador antes de enviar: sites leves e dentro do limite.
async function shrinkImage(file: File, kind: 'logo' | 'photo'): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) throw new Error('Não foi possível ler esta imagem. Use JPG, PNG ou WebP.')
  const scale = Math.min(1, MAX_SIDE[kind] / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  // Logo em PNG (mantém o fundo transparente); fotos em JPG.
  const type = kind === 'logo' ? 'image/png' : 'image/jpeg'
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Não foi possível preparar a imagem.'))), type, 0.86),
  )
}

export async function uploadSiteAsset(file: File, kind: 'logo' | 'photo'): Promise<string> {
  if (!/^image\/(jpeg|png|webp|heic|heif|gif)$/.test(file.type) && !/\.(jpe?g|png|webp|heic)$/i.test(file.name)) {
    throw new Error('Envie imagens (JPG, PNG ou WebP).')
  }
  if (file.size > 25 * 1024 * 1024) throw new Error('Imagem muito grande (máximo 25 MB).')
  const { data } = await supabase.auth.getUser()
  if (!data.user) throw new Error('Sessão expirada. Entre novamente.')
  const blob = await shrinkImage(file, kind)
  const extension = blob.type === 'image/png' ? 'png' : 'jpg'
  const path = `${data.user.id}/${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage.from(ASSET_BUCKET).upload(path, blob, { contentType: blob.type, upsert: false })
  if (error) throw new Error(error.message.includes('exceeded') ? 'Imagem muito grande.' : error.message)
  return supabase.storage.from(ASSET_BUCKET).getPublicUrl(path).data.publicUrl
}
