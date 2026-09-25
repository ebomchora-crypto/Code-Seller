import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useReducedMotion } from '@/motion/hooks'
import { duration, easing } from '@/motion/tokens'

const navLinks = [
  { href: '#funcionalidades', label: 'Funcionalidades' },
  { href: '#como-funciona', label: 'Como funciona' },
]

export function LandingNavbar() {
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="fixed inset-x-0 top-4 z-50 px-4">
      <div className="mx-auto w-full max-w-5xl">
        {/* Pílula flutuante com gradiente + brilho no topo, sem depender de
            imagem — só CSS (glass/gradient já são a linguagem visual do app). */}
        <div className="relative overflow-hidden rounded-full border border-white/10 bg-white/[0.07] shadow-glass backdrop-blur-lg">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent"
          />

          <div className="relative flex h-14 items-center justify-between pl-4 pr-2">
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Code Sellers" className="h-7 w-7 object-contain" />
              <span className="font-display text-base font-bold text-white">Code Sellers</span>
            </Link>

            <nav className="hidden items-center gap-7 text-sm font-medium text-white/80 md:flex">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} className="transition-colors hover:text-white">
                  {link.label}
                </a>
              ))}
              <Link to="/login" className="transition-colors hover:text-white">
                Entrar
              </Link>
            </nav>

            <div className="hidden md:block">
              <Button
                size="sm"
                magnetic
                // bg-[#fff], não bg-white: globals.css remapeia `.dark .bg-white` (inclusive
                // a variante `!`) pra var(--bg-card), e o tema padrão do site é dark.
                className="!bg-[#fff] !text-accent hover:!bg-white/90"
                onClick={() => navigate('/register')}
              >
                Criar conta
              </Button>
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen((value) => !value)}
              aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={mobileOpen}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 md:hidden"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: duration.enter, ease: easing.standard }}
              className="mt-2 flex flex-col gap-1 rounded-2xl border border-white/10 bg-accent-ink/95 p-3 shadow-glass-strong backdrop-blur-xl md:hidden"
            >
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/5 hover:text-white"
                >
                  {link.label}
                </a>
              ))}
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/5 hover:text-white"
              >
                Entrar
              </Link>
              <Button className="mt-1 w-full" onClick={() => navigate('/register')}>
                Criar conta
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
