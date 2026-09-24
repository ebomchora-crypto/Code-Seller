import type { ReactNode } from 'react'
import { FloatingPathsBackground } from '@/components/ui/floating-paths'
import { GlassCard } from '@/components/ui/glass-card'

interface AuthLayoutProps {
  children: ReactNode
}

// O AuthLayout é sempre escuro, independente da preferência de tema do
// usuário (não usa useTheme) — é a porta de entrada do produto.
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-accent-ink">
      {/* Gradientes roxos profundos — puramente decorativos, sem animação */}
      <div
        className="pointer-events-none absolute -right-32 -top-32 h-[600px] w-[600px] rounded-full bg-purple-600/20 blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-purple-800/15 blur-[100px]"
        aria-hidden="true"
      />

      <FloatingPathsBackground position={1} className="min-h-screen">
        <div className="flex min-h-screen flex-col lg:flex-row">
          {/* Lado esquerdo — branding, só no desktop */}
          <div className="hidden flex-col justify-between p-16 lg:flex lg:w-[45%]">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Code Sellers" className="h-8 w-8 rounded-lg object-cover" />
              <span className="font-display text-lg font-bold text-white">Code Sellers</span>
            </div>

            <div>
              <p className="mb-6 flex items-center gap-2 text-sm uppercase tracking-widest text-purple-400">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                CRM para vendedores digitais
              </p>
              <h1 className="font-display text-6xl font-bold leading-[1.05] tracking-tight text-white">
                Prospecte.
                <br />
                Feche.
                <br />
                <span className="text-purple-500">Cresça.</span>
              </h1>
              <p className="mt-6 max-w-sm text-lg leading-relaxed text-neutral-400">
                Do primeiro contato ao pagamento recebido, tudo em um único sistema.
              </p>
            </div>

            <p className="text-sm text-neutral-600">© 2026 Code Sellers. Todos os direitos reservados.</p>
          </div>

          {/* Lado direito — formulário */}
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="w-full max-w-md animate-fade-in">
              <div className="mb-8 flex flex-col items-center gap-3 text-center lg:hidden">
                <img src="/logo.png" alt="Code Sellers" className="h-10 w-10 rounded-xl object-cover" />
                <span className="text-2xl font-semibold text-white">Code Sellers</span>
              </div>

              <GlassCard variant="dark" className="rounded-3xl p-8 shadow-glass-strong">
                {children}
              </GlassCard>
            </div>
          </div>
        </div>
      </FloatingPathsBackground>
    </div>
  )
}
