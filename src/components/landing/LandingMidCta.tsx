import { useNavigate } from 'react-router-dom'
import { LandingButton } from '@/components/landing/LandingButton'
import { Reveal } from '@/components/motion/Reveal'
import { reveal } from '@/motion/variants'

// CTA intermediário — mais discreto que o final, reforça o ciclo do método
// no meio da página sem repetir o mesmo bloco a cada 300px.
export function LandingMidCta() {
  const navigate = useNavigate()

  return (
    <section className="relative overflow-hidden bg-landing-surface-2 py-20 sm:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-landing-primary/[0.14] blur-[120px]"
      />
      <div className="relative mx-auto flex w-full max-w-[880px] flex-col items-center px-6 text-center sm:px-8">
        <Reveal variants={reveal} className="flex flex-col items-center">
          <h2 className="text-3xl font-medium leading-[1.15] tracking-[-0.03em] text-landing-text sm:text-4xl">
            Seu próximo projeto precisa ter destino.
          </h2>
          <p className="mt-3 text-lg font-medium text-landing-text-secondary">Crie. Encontre. Venda.</p>
          <div className="mt-8">
            <LandingButton onClick={() => navigate('/register')}>Entrar no grupo</LandingButton>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
