import { LandingFadeIn } from '@/components/landing/LandingFadeIn'
import { LandingKicker } from '@/components/landing/LandingKicker'

interface Step {
  number: string
  label: string
  description: string
}

interface Phase {
  number: string
  label: string
  title: string
  steps: Step[]
  outcome: string
}

// As 8 etapas agrupadas nos 3 movimentos do método — em vez de uma lista
// solta de 8 itens iguais, cada card mostra o movimento, as etapas dele e o
// que sai no final.
const phases: Phase[] = [
  {
    number: '01',
    label: 'Criar',
    title: 'Da ideia à oferta.',
    steps: [
      { number: '01', label: 'Ideia', description: 'Um problema real que vale a pena resolver.' },
      { number: '02', label: 'Construção', description: 'A solução criada com IA, funcionando de verdade.' },
      { number: '03', label: 'Oferta', description: 'O projeto embalado como algo que se vende.' },
    ],
    outcome: 'Oferta pronta pra vender',
  },
  {
    number: '02',
    label: 'Encontrar',
    title: 'Das empresas certas à primeira conversa.',
    steps: [
      { number: '04', label: 'Prospecção', description: 'Empresas certas, encontradas com o Buyers Hunter.' },
      { number: '05', label: 'Abordagem', description: 'A primeira conversa, sem parecer spam.' },
    ],
    outcome: 'Empresas certas na mira',
  },
  {
    number: '03',
    label: 'Vender',
    title: 'Da demo ao dinheiro no bolso.',
    steps: [
      { number: '06', label: 'Demo', description: 'Mostrar a solução resolvendo o problema, ao vivo.' },
      { number: '07', label: 'Proposta', description: 'Escopo, prazo e valor, por escrito.' },
      { number: '08', label: 'Fechamento', description: 'Cliente pagante, dinheiro no bolso.' },
    ],
    outcome: 'Cliente pagante',
  },
]

function PhaseCard({ phase }: { phase: Phase }) {
  return (
    <article className="cs-step group h-full min-h-[440px] px-6 pb-6 pt-7 sm:px-[30px] sm:pb-[26px] sm:pt-[30px]">
      <span aria-hidden className="cs-step-ghost">
        {phase.number}
      </span>

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="cs-step-node grid size-11 place-items-center rounded-full text-[11px] font-medium">
            {phase.number}
          </span>
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#c4b5fd]">{phase.label}</span>
        </div>
        <span
          aria-hidden
          className="grid size-10 place-items-center rounded-full border border-white/20 text-lg transition-all duration-500 group-hover:border-[#a78bfa] group-hover:bg-[#6d28d9]"
        >
          ↗
        </span>
      </div>

      <h3 className="relative z-10 mt-10 max-w-[340px] text-[28px] font-normal leading-[1.04] tracking-[-0.04em] text-white lg:text-[30px]">
        {phase.title}
      </h3>

      <ol className="relative z-10 mt-7">
        {phase.steps.map((step) => (
          <li key={step.number} className="grid grid-cols-[34px_1fr] border-t border-white/[0.08] py-4">
            <span className="pt-[3px] font-mono text-[11px] text-[#b79cff]">{step.number}</span>
            <div>
              <p className="font-display text-[17px] tracking-[-0.02em] text-white">{step.label}</p>
              <p className="mt-1 text-[13px] leading-5 text-white/[0.52]">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="relative z-10 mt-auto flex items-center gap-2.5 border-t border-white/10 pt-6 text-[12px] font-medium tracking-[0.04em] text-white/[0.66]">
        <span className="text-[#a78bfa]">✓</span>
        {phase.outcome}
      </div>
    </article>
  )
}

export function LandingTimeline() {
  return (
    <section className="cs-rail py-24 text-white lg:py-28">
      <span aria-hidden className="cs-rail-signal" />

      <div className="relative z-10 mx-auto w-full max-w-[1280px] px-5 sm:px-8 lg:px-12">
        <LandingFadeIn>
          <div className="grid gap-9 lg:grid-cols-[1.1fr_0.62fr] lg:items-end lg:gap-20">
            <div className="text-center lg:text-left">
              <LandingKicker tone="dark">O processo</LandingKicker>
              <h2 className="text-[42px] font-normal leading-[0.98] tracking-[-0.055em] sm:text-[52px] lg:text-[60px]">
                O ciclo completo.
                <span className="mt-3 block text-[#a78bfa]">8 etapas, 3 movimentos.</span>
              </h2>
            </div>

            <div className="cs-glass-card">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#c4b5fd]">
                  Criar • Encontrar • Vender
                </span>
                <span className="font-mono text-[13px] text-white/40">01 — 08</span>
              </div>
              <p className="pt-4 text-[15px] leading-7 text-white/60">
                Cada etapa termina com algo concreto e já empurra a próxima — da ideia ao dinheiro no
                bolso.
              </p>
            </div>
          </div>
        </LandingFadeIn>

        <div className="relative mt-16 grid gap-4 lg:mt-20 lg:grid-cols-3">
          <span aria-hidden className="cs-steps-line hidden lg:block" />
          {phases.map((phase, index) => (
            <LandingFadeIn key={phase.number} className="h-full" delay={index * 0.09}>
              <PhaseCard phase={phase} />
            </LandingFadeIn>
          ))}
        </div>

        <p className="mt-8 hidden justify-end text-[11px] font-medium uppercase tracking-[0.16em] text-white/[0.38] lg:flex">
          Crie com IA. Encontre com o Buyers Hunter. Venda com método.
        </p>
      </div>
    </section>
  )
}
