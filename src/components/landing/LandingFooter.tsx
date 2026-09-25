const footerLinks = [
  { href: '#', label: 'Início' },
  { href: '#metodo', label: 'Método' },
  { href: '#codehunter', label: 'Code Hunter' },
  { href: '#modulos', label: 'Módulos' },
  { href: '#faq', label: 'FAQ' },
]

export function LandingFooter() {
  return (
    <footer className="bg-landing-bg">
      <div className="mx-auto w-full max-w-[1280px] px-6 pt-14 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Code Sellers" className="h-7 w-7 object-contain" />
              <span className="text-sm font-semibold text-landing-text">Code Sellers</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-landing-text-secondary">
              Crie soluções com IA, encontre empresas qualificadas e transforme projetos em
              vendas.
            </p>
          </div>

          <nav className="flex flex-col gap-2.5 text-sm text-landing-text-secondary">
            {footerLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(event) => {
                  if (link.href === '#') {
                    event.preventDefault()
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }
                }}
                className="transition-colors hover:text-landing-text"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-10 border-t border-white/[0.08] py-6 text-center">
          <p className="text-sm text-landing-text-muted">© 2026 Code Sellers.</p>
        </div>
      </div>
    </footer>
  )
}
