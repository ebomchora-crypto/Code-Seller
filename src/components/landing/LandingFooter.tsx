import { Link } from 'react-router-dom'

export function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.08] bg-accent-ink">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Code Sellers" className="h-7 w-7 object-contain" />
          <span className="font-display text-sm font-semibold text-white">Code Sellers</span>
        </div>

        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-neutral-400">
          <a href="#funcionalidades" className="transition-colors hover:text-white">
            Funcionalidades
          </a>
          <a href="#como-funciona" className="transition-colors hover:text-white">
            Como funciona
          </a>
          <Link to="/login" className="transition-colors hover:text-white">
            Entrar
          </Link>
          <Link to="/register" className="transition-colors hover:text-white">
            Criar conta
          </Link>
        </nav>

        <p className="text-sm text-neutral-600">© 2026 Code Sellers. Todos os direitos reservados.</p>
      </div>
    </footer>
  )
}
