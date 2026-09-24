import { supabase } from '@/lib/supabaseClient'
import type { UserProfile } from '@/types'

async function getCurrentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw new Error(error.message)
  if (!data.user) throw new Error('Usuário não autenticado.')
  return data.user.id
}

export async function createUserProfile(data: Partial<UserProfile>): Promise<UserProfile> {
  const userId = await getCurrentUserId()

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .upsert({ ...data, id: userId }, { onConflict: 'id' })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return profile
}

// A função handle_new_user (SQL) cria o perfil automaticamente para novos
// cadastros. Este fallback cobre usuários criados antes dessa migração, que
// ainda não têm uma linha em user_profiles.
export async function getUserProfile(): Promise<UserProfile | null> {
  const userId = await getCurrentUserId()

  const { data, error } = await supabase.from('user_profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw new Error(error.message)
  if (data) return data

  return createUserProfile({})
}

export async function updateUserProfile(
  data: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>,
): Promise<UserProfile> {
  const userId = await getCurrentUserId()

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .update(data)
    .eq('id', userId)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return profile
}

const AVATARS_BUCKET = 'avatars'
const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function validateAvatarFile(file: File): void {
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    throw new Error('Formato inválido. Envie uma imagem JPEG, PNG ou WebP.')
  }
  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    throw new Error('Arquivo muito grande. O limite é 2MB.')
  }
}

// O bucket `avatars` é público por design (avatares não precisam de signed
// URL) — diferente de `proposals`/`receipts`, guardamos a URL pública direto
// em user_profiles.avatar_url.
export async function uploadAvatar(file: File): Promise<string> {
  validateAvatarFile(file)
  const userId = await getCurrentUserId()

  const extension = file.name.split('.').pop() ?? 'jpg'
  const path = `${userId}/avatar.${extension}`

  const { error: uploadError } = await supabase.storage.from(AVATARS_BUCKET).upload(path, file, { upsert: true })
  if (uploadError) throw new Error(uploadError.message)

  const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path)
  const publicUrl = `${data.publicUrl}?t=${Date.now()}` // cache-busting ao trocar de foto

  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', userId)
  if (updateError) throw new Error(updateError.message)

  return publicUrl
}

// Logo da empresa — não estava no escopo original de userProfile.ts, mas o
// ProfileSection pede um upload "similar ao avatar". Reaproveita o mesmo
// bucket público `avatars` com um nome de arquivo diferente (logo.*), em vez
// de criar uma infraestrutura de Storage inteira só para isso.
export async function uploadCompanyLogo(file: File): Promise<string> {
  validateAvatarFile(file)
  const userId = await getCurrentUserId()

  const extension = file.name.split('.').pop() ?? 'jpg'
  const path = `${userId}/logo.${extension}`

  const { error: uploadError } = await supabase.storage.from(AVATARS_BUCKET).upload(path, file, { upsert: true })
  if (uploadError) throw new Error(uploadError.message)

  const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path)
  const publicUrl = `${data.publicUrl}?t=${Date.now()}`

  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({ company_logo_url: publicUrl })
    .eq('id', userId)
  if (updateError) throw new Error(updateError.message)

  return publicUrl
}

export async function deleteCompanyLogo(): Promise<void> {
  const userId = await getCurrentUserId()

  const { data: files, error: listError } = await supabase.storage.from(AVATARS_BUCKET).list(userId)
  if (listError) throw new Error(listError.message)

  const logoFiles = (files ?? []).filter((file) => file.name.startsWith('logo.'))
  if (logoFiles.length > 0) {
    const { error: removeError } = await supabase.storage
      .from(AVATARS_BUCKET)
      .remove(logoFiles.map((file) => `${userId}/${file.name}`))
    if (removeError) throw new Error(removeError.message)
  }

  const { error: updateError } = await supabase.from('user_profiles').update({ company_logo_url: null }).eq('id', userId)
  if (updateError) throw new Error(updateError.message)
}

export async function deleteAvatar(): Promise<void> {
  const userId = await getCurrentUserId()

  const { data: files, error: listError } = await supabase.storage.from(AVATARS_BUCKET).list(userId)
  if (listError) throw new Error(listError.message)

  // Filtramos por "avatar." porque a mesma pasta também guarda o logo da
  // empresa (logo.*) — remover tudo aqui apagaria o logo por engano.
  const avatarFiles = (files ?? []).filter((file) => file.name.startsWith('avatar.'))
  if (avatarFiles.length > 0) {
    const { error: removeError } = await supabase.storage
      .from(AVATARS_BUCKET)
      .remove(avatarFiles.map((file) => `${userId}/${file.name}`))
    if (removeError) throw new Error(removeError.message)
  }

  const { error: updateError } = await supabase.from('user_profiles').update({ avatar_url: null }).eq('id', userId)
  if (updateError) throw new Error(updateError.message)
}

export async function updateEmail(newEmail: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ email: newEmail })
  if (error) throw new Error(error.message)
}

export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw new Error(error.message)
}

export interface ActiveSession {
  current: boolean
  created_at: string
  user_agent?: string
}

// O SDK do Supabase no frontend só tem acesso à sessão atual — listar TODAS
// as sessões ativas do usuário exige a Supabase Admin API (chave service_role,
// que nunca deve rodar no navegador).
// TODO: usar a Admin API (via Edge Function) para listar todas as sessões.
export async function getActiveSessions(): Promise<ActiveSession[]> {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw new Error(error.message)
  if (!data.session) return []

  return [
    {
      current: true,
      created_at: data.session.user.last_sign_in_at ?? data.session.user.created_at,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    },
  ]
}

export async function signOutOtherSessions(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: 'others' })
  if (error) throw new Error(error.message)
}
