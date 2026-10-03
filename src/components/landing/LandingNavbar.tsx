import { useState } from 'react'
import { rememberDownloadIntent } from '@/utils/downloadIntent'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Download, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useReducedMotion } from '@/motion/hooks'
import { duration, easing } from '@/motion/tokens'

const navLinks = [
  { href: '#metodo', label: 'Método' },
  { href: '#buyershunter', label: 'Buyers Hunter' },
  { href: '#modulos', label: 'Módulos' },
  { href: '#precos', label: 'Preço' },
  { href: '#faq', label: 'FAQ' },
]

export function LandingNavbar() {
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    // Pílula flutuante, absoluta dentro do Hero (não fixa) — vive só ali,
    // rola junto com a seção, como na referência. Vidro fosco: fundo bem
    // translúcido, blur forte + saturação, borda clara sutil.
    <header className="absolute inset-x-0 top-0 z-30 px-4 pt-4 sm:px-6 sm:pt-6">
      <div className="relative mx-auto w-full max-w-[1280px] rounded-full border border-white/[0.14] bg-[rgba(10,10,12,0.55)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-[24px] backdrop-saturate-150">
        <div className="relative flex h-[64px] items-center justify-between px-5 sm:px-6">
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
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <button
              type="button"
              onClick={() => {
                rememberDownloadIntent('setup')
                navigate('/register')
              }}
              title="Crie sua conta grátis para baixar"
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium text-white/80 transition-colors hover:text-white"
            >
              <Download className="h-4 w-4" />
              Baixar app
            </button>
            <Button
              size="sm"
              magnetic
              className="!bg-landing-primary !text-white shadow-landing-glow hover:!bg-landing-primary-hover"
              onClick={() => navigate('/login')}
            >
              Login
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

      {/* Menu do celular fora da pílula: vidro dentro de vidro não desfoca e o
          texto do Hero aparecia por trás. Fundo sólido + página escurecida. */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              aria-hidden
              tabIndex={-1}
              onClick={() => setMobileOpen(false)}
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reducedMotion ? undefined : { opacity: 0 }}
              transition={{ duration: duration.enter, ease: easing.standard }}
              className="fixed inset-0 -z-10 cursor-default bg-black/70 backdrop-blur-sm lg:hidden"
            />
            <motion.nav
              aria-label="Menu"
              initial={reducedMotion ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: duration.enter, ease: easing.standard }}
              className="mx-auto mt-2 flex w-full max-w-[1280px] flex-col rounded-[24px] border border-white/[0.12] bg-[#0c0b10] p-2 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] lg:hidden"
            >
              <a
                href="#"
                onClick={(event) => {
                  event.preventDefault()
                  setMobileOpen(false)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="rounded-2xl px-4 py-3.5 text-[16px] font-medium text-white/85 transition-colors active:bg-white/[0.06]"
              >
                Início
              </a>
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-2xl px-4 py-3.5 text-[16px] font-medium text-white/85 transition-colors active:bg-white/[0.06]"
                >
                  {link.label}
                </a>
              ))}
              <div className="mx-4 my-2 h-px bg-white/[0.08]" />
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false)
                  rememberDownloadIntent('setup')
                  navigate('/register')
                }}
                className="flex items-center gap-2 rounded-2xl px-4 py-3.5 text-left text-[16px] font-medium text-white/85 transition-colors active:bg-white/[0.06]"
              >
                <Download className="h-[18px] w-[18px] text-white/60" />
                Baixar app para Windows
              </button>
              <div className="mt-2 grid grid-cols-2 gap-2 p-1">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="h-12 rounded-full border border-white/15 text-[15px] font-semibold text-white transition-colors active:bg-white/[0.06]"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="h-12 rounded-full bg-landing-primary text-[15px] font-semibold text-white transition-colors active:bg-landing-primary-hover"
                >
                  Começar grátis
                </button>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}
