import { LandingFadeIn } from '@/components/landing/LandingFadeIn'
import { LandingKicker } from '@/components/landing/LandingKicker'

const stuck = [
  'Salva tutorial e não executa',
  'Projeto com cara de template barato',
  'Trava na hora de cobrar',
  'Prospecção aleatória e sem contexto',
]

const active = [
  'Rota rápida da ideia à demo',
  'Site ou sistema que prova valor',
  'Clientes qualificados na mira',
  'Proposta pronta para negociar',
]

// "A virada" — papel com grid vertical, headline centralizada e o card
// dividido: preso no tutorial (escuro, apagado) × em modo Code Sellers
// (roxo, com feixe de luz e brilho à deriva).
export function LandingEcosystem() {
  return (
    <section className="cs-paper px-4 py-24 text-[#151318] sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto w-full max-w-[1200px]">
        <LandingFadeIn className="text-center">
          <LandingKicker align="center">A virada</LandingKicker>
          <h2 className="mx-auto max-w-[1000px] text-[40px] font-normal leading-[0.98] tracking-[-0.05em] sm:text-[48px] lg:text-[54px]">
            Pare de criar sem destino e prospectar sem critério.
          </h2>
        </LandingFadeIn>

        <div className="mt-14 grid overflow-hidden rounded-[22px] border border-[rgba(20,14,34,0.1)] shadow-[0_40px_120px_rgba(46,22,90,0.18)] lg:mt-16 lg:grid-cols-2 lg:rounded-[24px]">
          <LandingFadeIn className="h-full">
            <article className="h-full min-h-[500px] bg-[#121017] p-7 text-white lg:min-h-[580px] lg:p-12">
              <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/[0.35]">
                Preso no tutorial
              </span>
              <h3 className="mt-12 text-[40px] font-normal leading-none tracking-[-0.045em] text-white/[0.42] lg:mt-14 lg:text-[52px]">
                Mais uma aula.
                <br />
                Mais uma ferramenta.
                <br />
                Zero pipeline.
              </h3>
              <ul className="mt-12 space-y-4 text-[15px] text-white/50 lg:mt-14">
                {stuck.map((item) => (
                  <li key={item} className="flex gap-3 border-t border-white/10 pt-4">
                    <span aria-hidden>×</span>
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          </LandingFadeIn>

          <LandingFadeIn className="h-full" delay={0.08}>
            <article className="cs-accent-card h-full min-h-[520px] p-7 text-white lg:min-h-[580px] lg:p-12">
              <div className="relative z-10">
                <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/60">
                  Em modo Code Sellers
                </span>
                <h3 className="mt-12 text-[40px] font-normal leading-none tracking-[-0.045em] lg:mt-14 lg:text-[52px]">
                  Solução pronta.
                  <br />
                  Oferta afiada.
                  <br />
                  Buyers Hunter ativa.
                </h3>
                <ul className="mt-12 space-y-4 text-[15px] text-white/[0.84] lg:mt-14">
                  {active.map((item) => (
                    <li key={item} className="flex gap-3 border-t border-white/20 pt-4">
                      <span aria-hidden>+</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </LandingFadeIn>
        </div>
      </div>
    </section>
  )
}
