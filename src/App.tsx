import { Toaster } from 'sonner'
import { AuthProvider } from '@/stores/AuthContext'
import { AppRouter } from '@/router'

function App() {
  return (
    <AuthProvider>
      <AppRouter />
      <Toaster position="top-right" richColors closeButton />
    </AuthProvider>
  )
}

export default App
