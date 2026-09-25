import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export function LandingNavbar() {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-accent-ink/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Code Sellers" className="h-8 w-8 object-contain" />
          <span className="font-display text-lg font-bold text-white">Code Sellers</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-neutral-300 md:flex">
          <a href="#funcionalidades" className="transition-colors hover:text-white">
            Funcionalidades
          </a>
          <a href="#como-funciona" className="transition-colors hover:text-white">
            Como funciona
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden text-sm font-medium text-neutral-300 transition-colors hover:text-white sm:block"
          >
            Entrar
          </Link>
          <Button size="sm" magnetic onClick={() => navigate('/register')}>
            Criar conta
          </Button>
        </div>
      </div>
    </header>
  )
}
