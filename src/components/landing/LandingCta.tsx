import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { SectionCurve } from '@/components/ui/section-curve'
import { Reveal } from '@/components/motion/Reveal'
import { reveal } from '@/motion/variants'

export function LandingCta() {
  const navigate = useNavigate()

  return (
    <section className="relative bg-accent-ink">
      <SectionCurve fromColor="#f5f3f2" toColor="#0b0014" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-600/10 blur-[140px]" />
      </div>

      <div className="relative mx-auto w-full max-w-3xl px-6 py-24 text-center lg:px-8">
        <Reveal variants={reveal}>
          <h2 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Pronto para vender mais?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-neutral-400">
            Crie sua conta gratuitamente e comece a organizar seu funil de vendas hoje mesmo.
          </p>
          <div className="mt-8">
            <Button size="lg" magnetic className="shadow-purple-glow" onClick={() => navigate('/register')}>
              Criar conta grátis
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
