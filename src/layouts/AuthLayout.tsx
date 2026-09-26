import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AuthShowcase } from '@/components/auth/AuthShowcase'

interface AuthLayoutProps {
  children: ReactNode
}

// Telas de acesso: formulário em fundo branco à esquerda, painel com as fitas
// roxas à direita (só no desktop). Sempre claro, independente do tema do app.
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[#fff] font-sans text-[#0f0d14]">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="flex min-h-screen flex-col px-6 py-7 sm:px-10 lg:px-14">
          <Link to="/" className="flex items-center gap-2.5 self-start" aria-label="Code Sellers — voltar ao início">
            <img src="/logo.png" alt="" className="h-8 w-8 object-contain" />
            <span className="font-display text-[17px] font-semibold tracking-[-0.02em] text-[#0f0d14]">Code Sellers</span>
          </Link>

          <main className="flex flex-1 items-center justify-center py-10">
            <div className="w-full max-w-[404px] animate-fade-in">{children}</div>
          </main>

          <p className="text-center text-[12px] text-[#9a97a3] lg:text-left">
            © 2026 Code Sellers. Todos os direitos reservados.
          </p>
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-0 h-screen py-4 pr-4">
            <AuthShowcase />
          </div>
        </div>
      </div>
    </div>
  )
}
