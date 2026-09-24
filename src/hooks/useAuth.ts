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
      setUser(response.data)
      setLoading(false)
      if (response.data) loadProfile()
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return
      setSession(nextSession)
      if (nextSession?.user) {
        getCurrentUser().then((response) => {
          if (!isMounted) return
          setUser(response.data)
          if (response.data) loadProfile()
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
