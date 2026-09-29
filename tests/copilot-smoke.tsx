import './mock-crm'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from '../src/stores/AuthContext'
import CopilotPage from '../src/pages/autopilot'
import '../src/styles/globals.css'

// Standalone test entry, never part of the production build.
createRoot(document.getElementById('root')!).render(
  <MemoryRouter initialEntries={['/copilot']}>
    <AuthProvider><div style={{height:'100dvh'}}><CopilotPage /></div><Toaster /></AuthProvider>
  </MemoryRouter>,
)
