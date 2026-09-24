import { supabase } from '@/lib/supabaseClient'
import type { AuthUser, ServiceResponse } from '@/types'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Ocorreu um erro inesperado. Tente novamente.'
}

function mapAuthUser(user: {
  id: string
  email?: string
  created_at: string
  user_metadata?: Record<string, unknown>
}): AuthUser {
  return {
    id: user.id,
    email: user.email ?? '',
    name: typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : undefined,
    avatar_url:
      typeof user.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : undefined,
    created_at: user.created_at,
  }
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<ServiceResponse<AuthUser>> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { data: null, error: error.message, loading: false }
    if (!data.user) return { data: null, error: 'Não foi possível autenticar.', loading: false }
    return { data: mapAuthUser(data.user), error: null, loading: false }
  } catch (error) {
    return { data: null, error: getErrorMessage(error), loading: false }
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  name: string,
): Promise<ServiceResponse<AuthUser>> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error) return { data: null, error: error.message, loading: false }
    if (!data.user) return { data: null, error: 'Não foi possível criar a conta.', loading: false }
    return { data: mapAuthUser(data.user), error: null, loading: false }
  } catch (error) {
    return { data: null, error: getErrorMessage(error), loading: false }
  }
}

export async function signOut(): Promise<ServiceResponse<null>> {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) return { data: null, error: error.message, loading: false }
    return { data: null, error: null, loading: false }
  } catch (error) {
    return { data: null, error: getErrorMessage(error), loading: false }
  }
}

export async function getCurrentUser(): Promise<ServiceResponse<AuthUser>> {
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) return { data: null, error: error.message, loading: false }
    if (!data.user) return { data: null, error: null, loading: false }
    return { data: mapAuthUser(data.user), error: null, loading: false }
  } catch (error) {
    return { data: null, error: getErrorMessage(error), loading: false }
  }
}

export async function resetPasswordForEmail(email: string): Promise<ServiceResponse<null>> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) return { data: null, error: error.message, loading: false }
    return { data: null, error: null, loading: false }
  } catch (error) {
    return { data: null, error: getErrorMessage(error), loading: false }
  }
}
