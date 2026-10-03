import { Link } from 'react-router-dom'

const footerLinks = [
  { href: '#', label: 'Início' },
  { href: '#metodo', label: 'Método' },
  { href: '#buyershunter', label: 'Buyers Hunter' },
  { href: '#modulos', label: 'Módulos' },
  { href: '#precos', label: 'Preço' },
  { href: '#faq', label: 'FAQ' },
]

// Rodapé continua o preto do fim do CTA com fade — sem corte entre os dois.
export function LandingFooter() {
  return (
    <footer className="bg-landing-bg">
      <div className="mx-auto w-full max-w-[1040px] px-6 sm:px-8">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-[300px]">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Code Sellers" className="h-8 w-8 object-contain" />
              <span className="font-display text-[24px] tracking-[-0.03em] text-white">Code Sellers</span>
            </div>
            <p className="mt-5 text-sm leading-6 text-white/[0.66]">
              Crie com IA, encontre clientes e venda.
            </p>
          </div>

          <nav className="grid grid-cols-2 gap-x-16 gap-y-2.5 text-sm text-white/[0.78]">
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
                className="transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-12 flex flex-col items-center gap-3 border-t border-white/[0.12] py-7 sm:flex-row sm:justify-between">
          <p className="text-center text-sm text-white/40">© 2026 Code Sellers. Todos os direitos reservados.</p>
          <div className="flex gap-6 text-sm text-white/55">
            <Link to="/termos" className="transition-colors hover:text-white">
              Termos de Uso
            </Link>
            <Link to="/privacidade" className="transition-colors hover:text-white">
              Política de Privacidade
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
