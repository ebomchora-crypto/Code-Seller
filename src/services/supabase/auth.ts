import { supabase } from '@/lib/supabaseClient'
import type { AuthUser, ServiceResponse } from '@/types'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return translateAuthError(error.message)
  return 'Ocorreu um erro inesperado. Tente novamente.'
}

// Mensagens mais comuns do Supabase Auth, que vêm em inglês.
const AUTH_ERROR_MESSAGES: Array<[RegExp, string]> = [
  [/invalid login credentials/i, 'E-mail ou senha incorretos.'],
  [/email not confirmed/i, 'Confirme seu e-mail antes de entrar — enviamos um link pra sua caixa de entrada.'],
  [/user already registered|already been registered/i, 'Já existe uma conta com esse e-mail.'],
  [/password should be at least/i, 'A senha deve ter no mínimo 6 caracteres.'],
  [/unable to validate email|invalid email/i, 'Informe um e-mail válido.'],
  [/rate limit|too many requests/i, 'Muitas tentativas seguidas. Aguarde um pouco e tente de novo.'],
  [/provider is not enabled|unsupported provider/i, 'Login com Google ainda não está ativado.'],
  [/failed to fetch|network/i, 'Sem conexão com o servidor. Verifique sua internet e tente de novo.'],
  [/database error saving new user/i, 'Não foi possível criar sua conta com o Google (erro ao salvar no banco de dados).'],
  [/access_denied|access denied/i, 'O login com Google foi cancelado.'],
]

// Quando o Supabase volta do Google com erro, ele coloca error/error_description
// na query ou no hash da URL (fluxo implicit). Sem ler isso, o usuário só cai
// na landing deslogado, sem saber o porquê.
export function getOAuthErrorFromUrl(): string | null {
  const search = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const description = search.get('error_description') ?? hash.get('error_description')
  const code = search.get('error') ?? hash.get('error')
  if (!description && !code) return null
  return translateAuthError(description ?? code ?? '')
}

function translateAuthError(message: string): string {
  const match = AUTH_ERROR_MESSAGES.find(([pattern]) => pattern.test(message))
  return match ? match[1] : message
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
    if (error) return { data: null, error: translateAuthError(error.message), loading: false }
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
      // full_name é o que o trigger handle_new_user grava em user_profiles.
      options: { data: { name, full_name: name } },
    })
    if (error) return { data: null, error: translateAuthError(error.message), loading: false }
    if (!data.user) return { data: null, error: 'Não foi possível criar a conta.', loading: false }
    return { data: mapAuthUser(data.user), error: null, loading: false }
  } catch (error) {
    return { data: null, error: getErrorMessage(error), loading: false }
  }
}

// Redireciona pro Google e volta pra raiz do site, onde o supabase-js lê a
// sessão da URL e o RootRoute mostra o Dashboard. O provider precisa estar
// ativo no Supabase (Authentication → Providers → Google) e a URL do site
// cadastrada em Authentication → URL Configuration.
export async function signInWithGoogle(): Promise<ServiceResponse<null>> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) return { data: null, error: translateAuthError(error.message), loading: false }
    return { data: null, error: null, loading: false }
  } catch (error) {
    return { data: null, error: getErrorMessage(error), loading: false }
  }
}

export async function signOut(): Promise<ServiceResponse<null>> {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) return { data: null, error: translateAuthError(error.message), loading: false }
    return { data: null, error: null, loading: false }
  } catch (error) {
    return { data: null, error: getErrorMessage(error), loading: false }
  }
}

export async function getCurrentUser(): Promise<ServiceResponse<AuthUser>> {
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) return { data: null, error: translateAuthError(error.message), loading: false }
    if (!data.user) return { data: null, error: null, loading: false }
    return { data: mapAuthUser(data.user), error: null, loading: false }
  } catch (error) {
    return { data: null, error: getErrorMessage(error), loading: false }
  }
}

export async function resetPasswordForEmail(email: string): Promise<ServiceResponse<null>> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) return { data: null, error: translateAuthError(error.message), loading: false }
    return { data: null, error: null, loading: false }
  } catch (error) {
    return { data: null, error: getErrorMessage(error), loading: false }
  }
}
