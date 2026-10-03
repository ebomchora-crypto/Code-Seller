import { AuthProvider } from '@/stores/AuthContext'
import { BillingProvider } from '@/stores/BillingContext'
import { AppRouter } from '@/router'
import { ThemedToaster } from '@/components/ui/ThemedToaster'
import { AppErrorBoundary } from '@/components/ui/AppErrorBoundary'

function App() {
  return (
    <AuthProvider>
      <BillingProvider>
        <AppErrorBoundary>
          <AppRouter />
        </AppErrorBoundary>
      </BillingProvider>
      <ThemedToaster />
    </AuthProvider>
  )
}

export default App
