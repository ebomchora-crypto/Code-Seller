import { Search } from 'lucide-react'
import { LandingEyebrow } from '@/components/landing/LandingEyebrow'
import { MockupFrame } from '@/components/landing/MockupFrame'
import { Reveal } from '@/components/motion/Reveal'
import { fadeInLeft, fadeInUp } from '@/motion/variants'

const filters = ['Cidade', 'Nicho', 'Possui site', 'Avaliação', 'Categoria']

// Leads fictícios, só pra demonstração visual da ferramenta — não é uma
// integração real, é a interface do Buyers Hunter (produto próprio, distinto
// do método Code Sellers).
const leads = [
  { name: 'Clínica Vita', tag: 'Sem site', score: 91 },
  { name: 'Advocacia Almeida', tag: 'Site desatualizado', score: 86 },
  { name: 'Studio Move', tag: 'Baixa presença digital', score: 82 },
]

function scoreColor(score: number) {
  if (score >= 88) return 'text-landing-primary-hover'
  if (score >= 80) return 'text-landing-highlight'
  return 'text-landing-text-secondary'
}

export function LandingBuyersHunter() {
  return (
    <section id="buyershunter" className="relative overflow-hidden bg-landing-surface-2 py-24 sm:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-1/2 h-[460px] w-[460px] -translate-y-1/2 translate-x-1/3 rounded-full bg-landing-primary/[0.1] blur-[140px]"
      />

      <div className="relative mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-14 px-6 sm:px-8 lg:grid-cols-2 lg:px-12">
        <Reveal variants={fadeInLeft}>
          <LandingEyebrow>Buyers Hunter</LandingEyebrow>
          <h2 className="mt-4 text-3xl font-medium leading-[1.1] tracking-[-0.03em] text-landing-text sm:text-4xl">
            Pare de procurar clientes no escuro.
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-landing-text-secondary">
            Encontre empresas com potencial real para comprar o que você está construindo — a
            ferramenta que coloca oportunidades qualificadas no seu radar.
          </p>
        </Reveal>

        <Reveal variants={fadeInUp}>
          <MockupFrame label="buyershunter.app">
            <div className="flex items-center gap-2 rounded-landing-sm border border-white/10 bg-white/[0.03] px-3 py-2.5">
              <Search className="h-4 w-4 shrink-0 text-landing-text-muted" />
              <span className="text-sm text-landing-text-muted">Buscar empresas por nicho ou cidade...</span>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {filters.map((filter) => (
                <span
                  key={filter}
                  className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-[11px] text-landing-text-muted"
                >
                  {filter}
                </span>
              ))}
            </div>

            <div className="mt-4 space-y-2">
              {leads.map((lead) => (
                <div
                  key={lead.name}
                  className="flex items-center justify-between rounded-landing-sm border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-landing-text">{lead.name}</p>
                    <p className="text-xs text-landing-text-muted">{lead.tag}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${scoreColor(lead.score)}`}>{lead.score}</p>
                    <p className="text-[10px] uppercase tracking-wide text-landing-text-muted">Score</p>
                  </div>
                </div>
              ))}
            </div>
          </MockupFrame>
        </Reveal>
      </div>
    </section>
  )
}
