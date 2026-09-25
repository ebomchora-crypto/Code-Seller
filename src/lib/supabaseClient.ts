import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Antes isso lançava e derrubava o app inteiro na inicialização (sem
// ErrorBoundary, qualquer exceção aqui deixa a tela em branco) — inclusive a
// landing pública, que não depende de autenticação nenhuma. Agora só avisa no
// console e segue com um client "morto" (URL válida, porém inexistente):
// páginas públicas renderizam normalmente, e só as chamadas que realmente
// dependem de auth/dados (login, CRM etc.) falham — com erro de rede
// tratável pelos try/catch que já existem nesses fluxos — em vez de branco.
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase environment variables. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY — auth-dependent features will not work until they are set.',
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
)
