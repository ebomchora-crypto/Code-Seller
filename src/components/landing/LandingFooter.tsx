import { Link } from 'react-router-dom'

export function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.08] bg-landing-bg">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Code Sellers" className="h-7 w-7 object-contain" />
          <span className="text-sm font-semibold text-landing-text">Code Sellers</span>
        </div>

        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-landing-text-secondary">
          <a href="#funcionalidades" className="transition-colors hover:text-landing-text">
            Funcionalidades
          </a>
          <a href="#como-funciona" className="transition-colors hover:text-landing-text">
            Como funciona
          </a>
          <Link to="/login" className="transition-colors hover:text-landing-text">
            Entrar
          </Link>
          <Link to="/register" className="transition-colors hover:text-landing-text">
            Criar conta
          </Link>
        </nav>

        <p className="text-sm text-landing-text-muted">© 2026 Code Sellers. Todos os direitos reservados.</p>
      </div>
    </footer>
  )
}
