import { AuthProvider } from '@/stores/AuthContext'
import { AppRouter } from '@/router'
import { ThemedToaster } from '@/components/ui/ThemedToaster'

function App() {
  return (
    <AuthProvider>
      <AppRouter />
      <ThemedToaster />
    </AuthProvider>
  )
}

export default App
