import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'

type Variant = 'primary' | 'secondary'
type Tone = 'dark' | 'light'

interface LandingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  tone?: Tone
  arrow?: boolean
  children: ReactNode
}

// Botão único e consistente pra toda a landing — evita o problema de cada
// CTA ter seu próprio className de 15 utilitários repetidos. `tone` decide
// o contraste do variant='secondary' (borda clara em seção escura, borda
// escura em seção clara); `variant='primary'` é sempre roxo vivo + branco,
// a única cor de ação em toda a página.
export function LandingButton({
  variant = 'primary',
  tone = 'dark',
  arrow = false,
  children,
  className = '',
  ...props
}: LandingButtonProps) {
  const base =
    'group inline-flex h-12 items-center justify-center gap-2 rounded-landing-md px-6 text-[15px] font-medium transition-all duration-200 active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-primary-hover focus-visible:ring-offset-2 focus-visible:ring-offset-landing-bg'

  const variants: Record<Variant, string> = {
    primary:
      'bg-landing-primary text-white shadow-landing-glow hover:-translate-y-px hover:bg-landing-primary-hover',
    secondary:
      tone === 'dark'
        ? 'border border-white/15 text-landing-text hover:-translate-y-px hover:border-white/30 hover:bg-white/[0.04]'
        : 'border border-landing-text-dark/15 text-landing-text-dark hover:-translate-y-px hover:border-landing-text-dark/30 hover:bg-black/[0.03]',
  }

  return (
    <button type="button" className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
      {arrow && <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-[3px]" />}
    </button>
  )
}
