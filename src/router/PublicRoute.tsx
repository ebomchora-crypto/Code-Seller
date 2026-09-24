import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthContext } from '@/stores/AuthContext'
import { Spinner } from '@/components/ui/Spinner'

interface PublicRouteProps {
  children: ReactNode
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { user, loading } = useAuthContext()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" className="text-purple-600" />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
