import { AuthProvider } from '@/stores/AuthContext'
import { AppRouter } from '@/router'
import { ThemedToaster } from '@/components/ui/ThemedToaster'
import { AppErrorBoundary } from '@/components/ui/AppErrorBoundary'

function App() {
  return (
    <AuthProvider>
      <AppErrorBoundary>
        <AppRouter />
      </AppErrorBoundary>
      <ThemedToaster />
    </AuthProvider>
  )
}

export default App
