import { Minus, Plus } from 'lucide-react'
import { LandingEyebrow } from '@/components/landing/LandingEyebrow'
import { Reveal } from '@/components/motion/Reveal'
import { fadeInLeft, fadeInRight, fadeInUp } from '@/motion/variants'

const before = [
  'Aprende e não executa',
  'Cria projeto sem destino',
  'Não sabe precificar',
  'Prospecta aleatoriamente',
  'Trava na abordagem',
  'Não sabe fechar',
]

const after = [
  'Cria algo demonstrável',
  'Apresenta valor',
  'Encontra empresas certas',
  'Sabe iniciar a conversa',
  'Envia proposta',
  'Conduz o fechamento',
]

export function LandingComparison() {
  return (
    <section className="relative overflow-hidden bg-landing-surface-2 py-24 sm:py-32">
      <div className="relative mx-auto w-full max-w-[1280px] px-6 sm:px-8 lg:px-12">
        <Reveal variants={fadeInUp} className="mx-auto max-w-xl text-center">
          <LandingEyebrow>Antes / depois</LandingEyebrow>
          <h2 className="mt-4 text-3xl font-medium leading-[1.1] tracking-[-0.03em] text-landing-text sm:text-4xl">
            De "mais uma ferramenta" a um pipeline de vendas.
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Reveal variants={fadeInLeft} className="rounded-landing-lg border border-landing-border bg-landing-bg p-8 sm:p-10">
            <p className="text-lg font-medium leading-snug text-landing-text-secondary">
              Mais uma ferramenta.
              <br />
              Mais um tutorial.
              <br />
              Zero clientes.
            </p>
            <ul className="mt-7 space-y-3.5">
              {before.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-landing-text-muted">
                  <Minus className="mt-0.5 h-4 w-4 shrink-0 text-landing-text-muted" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal
            variants={fadeInRight}
            className="rounded-landing-lg border border-landing-primary/25 bg-landing-primary-soft p-8 sm:p-10"
          >
            <p className="text-lg font-medium leading-snug text-landing-text">
              Projeto.
              <br />
              Oferta.
              <br />
              Pipeline. Venda.
            </p>
            <ul className="mt-7 space-y-3.5">
              {after.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-landing-text">
                  <Plus className="mt-0.5 h-4 w-4 shrink-0 text-landing-primary-hover" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
