import { supabase } from '@/lib/supabaseClient'
import type {
  Portfolio,
  PortfolioInput,
  PortfolioProject,
  PortfolioProjectInput,
  PublicPortfolio,
  PublicPortfolioProject,
} from '@/types'

const BUCKET = 'portfolio'
const MAX_IMAGE_BYTES = 3 * 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw new Error(error.message)
  if (!data.user) throw new Error('Usuário não autenticado.')
  return data.user.id
}

function friendlyError(message: string, code?: string): Error {
  if (code === '23505' || /duplicate key|portfolios_slug_key/i.test(message)) {
    return new Error('Esse apelido já está em uso. Escolha outro.')
  }
  if (code === '23514' || /check constraint/i.test(message)) {
    return new Error('Esse apelido não é permitido. Escolha outro.')
  }
  return new Error(message)
}

// ---------- Dono (editor) ----------

export async function getMyPortfolio(): Promise<Portfolio | null> {
  const userId = await currentUserId()
  const { data, error } = await supabase.from('portfolios').select('*').eq('user_id', userId).maybeSingle()
  if (error) throw new Error(error.message)
  return data as Portfolio | null
}

export async function savePortfolio(input: PortfolioInput): Promise<Portfolio> {
  const userId = await currentUserId()
  const { data, error } = await supabase
    .from('portfolios')
    .upsert({ ...input, user_id: userId }, { onConflict: 'user_id' })
    .select('*')
    .single()
  if (error) throw friendlyError(error.message, error.code)
  return data as Portfolio
}

export async function setPublished(published: boolean): Promise<Portfolio> {
  const userId = await currentUserId()
  const { data, error } = await supabase.from('portfolios').update({ published }).eq('user_id', userId).select('*').single()
  if (error) throw new Error(error.message)
  return data as Portfolio
}

export async function getMyProjects(): Promise<PortfolioProject[]> {
  const userId = await currentUserId()
  const { data, error } = await supabase
    .from('portfolio_projects')
    .select('*')
    .eq('user_id', userId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as PortfolioProject[]
}

export async function createProject(input: PortfolioProjectInput, position: number): Promise<PortfolioProject> {
  const userId = await currentUserId()
  const { data, error } = await supabase
    .from('portfolio_projects')
    .insert({ ...input, user_id: userId, position })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as PortfolioProject
}

export async function updateProject(id: string, input: Partial<PortfolioProjectInput & { position: number }>): Promise<PortfolioProject> {
  const { data, error } = await supabase.from('portfolio_projects').update(input).eq('id', id).select('*').single()
  if (error) throw new Error(error.message)
  return data as PortfolioProject
}

export async function deleteProject(project: PortfolioProject): Promise<void> {
  const { error } = await supabase.from('portfolio_projects').delete().eq('id', project.id)
  if (error) throw new Error(error.message)
  if (project.image_url) void removeImage(project.image_url)
}

export async function uploadPortfolioImage(file: File): Promise<string> {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error('Envie uma imagem JPG, PNG ou WebP.')
  if (file.size > MAX_IMAGE_BYTES) throw new Error('Imagem muito grande. O limite é 3 MB.')
  const userId = await currentUserId()
  const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${userId}/${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw new Error(error.message)
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

// Remove do Storage uma imagem do portfólio a partir da URL pública (melhor esforço).
export async function removeImage(publicUrl: string): Promise<void> {
  const marker = `/object/public/${BUCKET}/`
  const index = publicUrl.indexOf(marker)
  if (index === -1) return
  await supabase.storage.from(BUCKET).remove([publicUrl.slice(index + marker.length)])
}

// Link do portfólio para os modelos de mensagem ({portfolio}); só se publicado.
export async function getMyPublishedPortfolioLink(): Promise<string | null> {
  try {
    const mine = await getMyPortfolio()
    return mine?.published ? `${window.location.origin}/p/${mine.slug}` : null
  } catch {
    return null
  }
}

// ---------- Público (/p/:slug) ----------

const PUBLIC_PORTFOLIO_COLUMNS = 'slug, display_name, headline, bio, avatar_url, whatsapp, city'
const PUBLIC_PROJECT_COLUMNS = 'id, title, client_label, category, description, url, image_url, testimonial, testimonial_author'

export async function getPublicPortfolio(
  slug: string,
): Promise<{ portfolio: PublicPortfolio; projects: PublicPortfolioProject[] } | null> {
  const { data, error } = await supabase
    .from('portfolios')
    .select(`user_id, ${PUBLIC_PORTFOLIO_COLUMNS}`)
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null

  const { user_id: userId, ...portfolio } = data as PublicPortfolio & { user_id: string }
  const { data: projects, error: projectsError } = await supabase
    .from('portfolio_projects')
    .select(PUBLIC_PROJECT_COLUMNS)
    .eq('user_id', userId)
    .eq('visible', true)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })
  if (projectsError) throw new Error(projectsError.message)
  return { portfolio, projects: (projects ?? []) as PublicPortfolioProject[] }
}

export async function registerPortfolioView(slug: string): Promise<void> {
  await supabase.rpc('increment_portfolio_view', { p_slug: slug })
}

export async function reportPortfolio(slug: string, reason: string): Promise<void> {
  const { error } = await supabase.from('portfolio_reports').insert({ slug, reason })
  if (error) throw new Error(error.message)
}
