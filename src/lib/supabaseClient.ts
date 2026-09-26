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

// "Manter conectado" no login: marcado (padrão) guarda a sessão no
// localStorage como sempre; desmarcado guarda no sessionStorage, que some ao
// fechar a aba. A escolha vale pro próximo login e fica salva em REMEMBER_KEY.
const REMEMBER_KEY = 'code-sellers-remember-session'

function readStore(store: () => Storage, key: string): string | null {
  try {
    return store().getItem(key)
  } catch {
    return null
  }
}

const authStorage = {
  getItem: (key: string) => readStore(() => localStorage, key) ?? readStore(() => sessionStorage, key),
  setItem: (key: string, value: string) => {
    const remember = readStore(() => localStorage, REMEMBER_KEY) !== 'false'
    try {
      if (remember) {
        localStorage.setItem(key, value)
        sessionStorage.removeItem(key)
      } else {
        sessionStorage.setItem(key, value)
        localStorage.removeItem(key)
      }
    } catch {
      // Storage bloqueado (modo privado restrito) — a sessão vive só em memória.
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    } catch {
      // idem
    }
  },
}

export function setRememberSession(remember: boolean) {
  try {
    localStorage.setItem(REMEMBER_KEY, remember ? 'true' : 'false')
  } catch {
    // idem
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  { auth: { storage: authStorage } },
)
