import './mock-crm'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from '../src/stores/AuthContext'
import CommercialLibraryPage from '../src/pages/academy/library'
import CopilotPage from '../src/pages/autopilot'
import '../src/styles/globals.css'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <AuthProvider><Routes>
      <Route path="/tests/commercial-library.html" element={<CommercialLibraryPage />} />
      <Route path="/copilot" element={<div style={{ height: '100dvh' }}><CopilotPage /></div>} />
    </Routes><Toaster /></AuthProvider>
  </BrowserRouter>,
)
