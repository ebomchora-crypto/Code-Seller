import { createContext, useContext, type ReactNode } from 'react'
import { useAuth, type UseAuthResult } from '@/hooks/useAuth'

const AuthContext = createContext<UseAuthResult | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export function useAuthContext(): UseAuthResult {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
