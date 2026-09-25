import { LandingEyebrow } from '@/components/landing/LandingEyebrow'
import { Reveal } from '@/components/motion/Reveal'
import { fadeInUp } from '@/motion/variants'

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
      </div>
    </section>
  )
}
