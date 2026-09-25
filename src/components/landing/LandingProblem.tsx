import { Fragment } from 'react'
import { ArrowRight } from 'lucide-react'
import { LandingEyebrow } from '@/components/landing/LandingEyebrow'
import { Reveal } from '@/components/motion/Reveal'
import { fadeInUp } from '@/motion/variants'

const flow = ['Criar', 'Posicionar', 'Encontrar', 'Abordar', 'Demonstrar', 'Propor', 'Fechar']

// Único momento de fundo claro da landing — contraste deliberado com o resto
// (dark premium), pra marcar a virada de "aprender ferramenta" pra
// "transformar habilidade em venda". Grid decorativo quase invisível no
// fundo, texto sempre escuro sobre claro (alto contraste garantido).
export function LandingProblem() {
  return (
    <section className="relative overflow-hidden bg-landing-bg-light py-24 sm:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage: 'linear-gradient(to right, rgba(17,16,20,0.035) 1px, transparent 1px)',
          backgroundSize: '80px 100%',
        }}
      />

      <div className="relative mx-auto w-full max-w-[1280px] px-6 sm:px-8 lg:px-12">
        <Reveal variants={fadeInUp} className="max-w-2xl">
          <LandingEyebrow tone="light">O problema</LandingEyebrow>
          <h2 className="mt-4 text-3xl font-medium leading-[1.12] tracking-[-0.03em] text-landing-text-dark sm:text-4xl lg:text-5xl">
            Criar é apenas o começo. O dinheiro entra quando aquilo que você cria resolve um
            problema e alguém compra.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-[#4a4750]">
            A maioria aprende ferramenta. Poucos aprendem a transformar habilidade em oferta,
            oportunidade e venda.
          </p>
        </Reveal>

        <Reveal
          variants={fadeInUp}
          className="mt-16 flex flex-wrap items-center gap-x-1 gap-y-4 rounded-landing-lg border border-landing-border-light bg-white/60 p-6 shadow-landing-card-light sm:p-8"
        >
          {flow.map((step, index) => (
            <Fragment key={step}>
              <span className="rounded-full border border-landing-text-dark/10 bg-white px-4 py-2 text-sm font-medium text-landing-text-dark">
                {step}
              </span>
              {index < flow.length - 1 && (
                <ArrowRight className="mx-1 h-4 w-4 shrink-0 text-landing-deep/50" aria-hidden />
              )}
            </Fragment>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
