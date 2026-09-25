import { Minus, Plus } from 'lucide-react'
import { Reveal } from '@/components/motion/Reveal'
import { fadeInUp } from '@/motion/variants'

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

// Painel comparativo único (sem gap entre as metades) — réplica estrutural
// da referência, na paleta roxa do Code Sellers.
export function LandingEcosystem() {
  return (
    <section className="relative overflow-hidden bg-landing-bg py-24 sm:py-32">
      <div className="relative mx-auto w-full max-w-[1280px] px-6 sm:px-8 lg:px-12">
        <Reveal variants={fadeInUp} className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-medium leading-[1.15] tracking-[-0.03em] text-landing-text sm:text-4xl">
            Pare de criar sem destino e prospectar sem critério.
          </h2>
        </Reveal>

        <Reveal
          variants={fadeInUp}
          className="mt-14 grid grid-cols-1 overflow-hidden rounded-landing-lg border border-landing-border sm:grid-cols-2"
        >
          <div className="bg-landing-surface-card p-8 sm:p-10">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-landing-text-muted">
              Preso no tutorial
            </span>
            <p className="mt-4 text-2xl font-medium leading-snug text-landing-text-secondary">
              Mais uma aula.
              <br />
              Mais uma ferramenta.
              <br />
              Zero pipeline.
            </p>
            <ul className="mt-8 space-y-4 border-t border-landing-border pt-6">
              {stuck.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-landing-text-muted">
                  <Minus className="mt-0.5 h-4 w-4 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gradient-to-br from-landing-primary to-landing-deep p-8 sm:p-10">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
              Em modo Code Sellers
            </span>
            <p className="mt-4 text-2xl font-semibold leading-snug text-white">
              Solução pronta.
              <br />
              Oferta afiada.
              <br />
              Buyers Hunter ativa.
            </p>
            <ul className="mt-8 space-y-4 border-t border-white/15 pt-6">
              {active.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-white/90">
                  <Plus className="mt-0.5 h-4 w-4 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
