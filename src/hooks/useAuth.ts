import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import { getCurrentUser, signInWithEmail, signOut as signOutService, signUpWithEmail } from '@/services/supabase/auth'
import { getUserProfile, updateUserProfile } from '@/services/supabase/userProfile'
import type { AuthUser, UserProfile } from '@/types'

export interface UseAuthResult {
  user: AuthUser | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>) => Promise<{ error: string | null }>
  refreshProfile: () => Promise<void>
}

// Mesmo usuário com os mesmos dados: mantém o objeto antigo. Cada aviso do
// login (trocar de aba, renovar a sessão a cada hora) traz um objeto novo, e
// trocar a referência fazia telas inteiras recarregarem — inclusive cancelando
// a criação de sites no meio.
function sameUser(a: AuthUser | null, b: AuthUser | null): boolean {
  if (!a || !b) return a === b
  return a.id === b.id && a.email === b.email && a.name === b.name && a.avatar_url === b.avatar_url && a.created_at === b.created_at
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(() => {
    getUserProfile()
      .then(setProfile)
      .catch(() => setProfile(null))
  }, [])

  useEffect(() => {
    let isMounted = true

    getCurrentUser().then((response) => {
      if (!isMounted) return
      const next = response.data
      setUser((current) => (sameUser(current, next) ? current : next))
      setLoading(false)
      if (response.data) loadProfile()
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return
      setSession(nextSession)
      if (nextSession?.user) {
        getCurrentUser().then((response) => {
          if (!isMounted) return
          // Falha de rede ao conferir o usuário não desloga quem tem sessão.
          if (!response.data) {
            if (response.error) return
            setUser(null)
            return
          }
          const next = response.data
          setUser((current) => (sameUser(current, next) ? current : next))
          loadProfile()
        })
      } else {
        setUser(null)
        setProfile(null)
      }
    })

    return () => {
      isMounted = false
      subscription.subscription.unsubscribe()
    }
  }, [loadProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    const response = await signInWithEmail(email, password)
    if (response.data) setUser(response.data)
    return { error: response.error }
  }, [])

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const response = await signUpWithEmail(email, password, name)
    if (response.data) setUser(response.data)
    return { error: response.error }
  }, [])

  const signOut = useCallback(async () => {
    await signOutService()
    setUser(null)
    setSession(null)
    setProfile(null)
  }, [])

  // Usado pelo módulo Configurações: ao salvar o perfil, atualizamos o estado
  // global aqui para Sidebar e Header refletirem o novo nome/avatar de imediato.
  const updateProfile = useCallback(
    async (data: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>) => {
      try {
        const updated = await updateUserProfile(data)
        setProfile(updated)
        return { error: null }
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Não foi possível atualizar o perfil.' }
      }
    },
    [],
  )

  const refreshProfile = useCallback(async () => {
    loadProfile()
  }, [loadProfile])

  return { user, profile, session, loading, signIn, signUp, signOut, updateProfile, refreshProfile }
}
