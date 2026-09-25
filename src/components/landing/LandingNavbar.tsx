import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useReducedMotion } from '@/motion/hooks'
import { duration, easing } from '@/motion/tokens'

const navLinks = [
  { href: '#metodo', label: 'Método' },
  { href: '#buyershunter', label: 'Buyers Hunter' },
  { href: '#modulos', label: 'Módulos' },
  { href: '#faq', label: 'FAQ' },
]

export function LandingNavbar() {
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="fixed inset-x-0 top-4 z-50 px-4">
      <div className="mx-auto w-full max-w-5xl">
        {/* Pílula flutuante — fundo escuro translúcido + blur forte (pedido
            explícito: nunca um blur/fundo claro que prejudique a leitura). */}
        <div className="relative overflow-hidden rounded-full border border-white/[0.08] bg-[rgba(10,10,12,0.78)] shadow-glass backdrop-blur-[20px]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.06] to-transparent"
          />

          <div className="relative flex h-14 items-center justify-between pl-4 pr-2">
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Code Sellers" className="h-7 w-7 object-contain" />
              <span className="font-display text-base font-bold text-white">Code Sellers</span>
            </Link>

            <nav className="hidden items-center gap-6 text-sm font-medium text-white/80 lg:flex">
              <a
                href="#"
                onClick={(event) => {
                  event.preventDefault()
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="transition-colors hover:text-white"
              >
                Início
              </a>
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} className="transition-colors hover:text-white">
                  {link.label}
                </a>
              ))}
              <Link to="/login" className="transition-colors hover:text-white">
                Entrar
              </Link>
            </nav>

            <div className="hidden lg:block">
              <Button
                size="sm"
                magnetic
                className="!bg-landing-primary !text-white shadow-landing-glow hover:!bg-landing-primary-hover"
                onClick={() => navigate('/register')}
              >
                Entrar no grupo
              </Button>
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen((value) => !value)}
              aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={mobileOpen}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 lg:hidden"
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
              className="mt-2 flex flex-col gap-1 rounded-2xl border border-white/[0.08] bg-[rgba(10,10,12,0.96)] p-3 shadow-glass-strong backdrop-blur-xl lg:hidden"
            >
              <a
                href="#"
                onClick={(event) => {
                  event.preventDefault()
                  setMobileOpen(false)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="rounded-lg px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/5 hover:text-white"
              >
                Início
              </a>
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
              <Button
                className="mt-1 w-full !bg-landing-primary !text-white hover:!bg-landing-primary-hover"
                onClick={() => navigate('/register')}
              >
                Entrar no grupo
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
