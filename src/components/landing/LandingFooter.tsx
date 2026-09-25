import { Link } from 'react-router-dom'

// Estrutura em duas linhas (logo+tagline / colunas de links, depois divisória
// + copyright centralizado) — réplica do layout da referência pedida, na
// paleta dark-premium do Code Sellers. Continua direto do preto (#08080a)
// em que o gradiente do LandingCta termina, sem quebra de cor.
export function LandingFooter() {
  return (
    <footer className="bg-landing-bg">
      <div className="mx-auto w-full max-w-7xl px-6 pt-14 lg:px-8">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Code Sellers" className="h-7 w-7 object-contain" />
              <span className="text-sm font-semibold text-landing-text">Code Sellers</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-landing-text-secondary">
              Organize leads, acompanhe negociações e feche vendas com a ajuda da IA — tudo em um
              só CRM.
            </p>
          </div>

          <div className="flex gap-16">
            <nav className="flex flex-col gap-2.5 text-sm text-landing-text-secondary">
              <a href="#funcionalidades" className="transition-colors hover:text-landing-text">
                Funcionalidades
              </a>
              <a href="#como-funciona" className="transition-colors hover:text-landing-text">
                Como funciona
              </a>
            </nav>
            <nav className="flex flex-col gap-2.5 text-sm text-landing-text-secondary">
              <Link to="/login" className="transition-colors hover:text-landing-text">
                Entrar
              </Link>
              <Link to="/register" className="transition-colors hover:text-landing-text">
                Criar conta
              </Link>
            </nav>
          </div>
        </div>

        <div className="mt-10 border-t border-white/[0.08] py-6 text-center">
          <p className="text-sm text-landing-text-muted">© 2026 Code Sellers. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
