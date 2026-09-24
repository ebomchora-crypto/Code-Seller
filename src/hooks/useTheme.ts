import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuthContext } from '@/stores/AuthContext'
import type { Theme } from '@/types'

const STORAGE_KEY = 'code-sellers-theme'

function readStoredPreference(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'dark'
  } catch {
    return 'dark'
  }
}

function resolveTheme(preference: Theme): 'light' | 'dark' {
  if (preference !== 'system') return preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyResolvedTheme(resolved: 'light' | 'dark') {
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(resolved)
}

function persistPreference(preference: Theme) {
  try {
    // O script anti-FOUC em index.html só entende 'light'/'dark' — se a
    // preferência for 'system', gravamos o tema já resolvido para o próximo
    // carregamento não gravar a classe 'system' (inválida) no <html>.
    localStorage.setItem(STORAGE_KEY, preference === 'system' ? resolveTheme(preference) : preference)
  } catch {
    // localStorage indisponível (ex: modo privado) — a preferência só dura a sessão.
  }
}

// Tema com fonte dupla: localStorage para aplicação imediata (sem flash, já
// coberto pelo script inline em index.html) e user_profiles.theme como fonte
// de verdade entre dispositivos, sincronizada em background via AuthContext.
// `preference` pode ser 'system' (resolvido ao vivo via prefers-color-scheme);
// `resolvedTheme` é sempre 'light' | 'dark' e é o que efetivamente vira classe
// no <html>.
export function useTheme() {
  const { profile, updateProfile } = useAuthContext()
  const [preference, setPreferenceState] = useState<Theme>(() => readStoredPreference())
  const syncedFromProfile = useRef(false)

  // Quando o perfil carrega pela primeira vez, se o banco tiver uma
  // preferência diferente do que já está aplicado via localStorage, o banco
  // vence (é a fonte de verdade entre dispositivos).
  useEffect(() => {
    if (!profile || syncedFromProfile.current) return
    syncedFromProfile.current = true

    if (profile.theme && profile.theme !== preference) {
      setPreferenceState(profile.theme)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  useEffect(() => {
    applyResolvedTheme(resolveTheme(preference))
    persistPreference(preference)

    if (preference !== 'system') return

    // Preferência 'system': acompanha mudanças do SO enquanto essa opção
    // estiver ativa (ex: usuário troca o tema do Windows/macOS em tempo real).
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    function handleChange() {
      applyResolvedTheme(resolveTheme('system'))
    }
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [preference])

  const setTheme = useCallback(
    (next: Theme) => {
      setPreferenceState(next)
      void updateProfile({ theme: next })
    },
    [updateProfile],
  )

  const toggleTheme = useCallback(() => {
    setTheme(resolveTheme(preference) === 'dark' ? 'light' : 'dark')
  }, [preference, setTheme])

  return { theme: preference, resolvedTheme: resolveTheme(preference), setTheme, toggleTheme }
}
