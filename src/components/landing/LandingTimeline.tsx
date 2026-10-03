import { LandingFadeIn } from '@/components/landing/LandingFadeIn'
import { LandingKicker } from '@/components/landing/LandingKicker'

interface Step {
  number: string
  label: string
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
      { number: '01', label: 'Ideia' },
      { number: '02', label: 'Construção com IA' },
      { number: '03', label: 'Oferta' },
    ],
    outcome: 'Oferta pronta pra vender',
  },
  {
    number: '02',
    label: 'Encontrar',
    title: 'Das empresas certas à conversa.',
    steps: [
      { number: '04', label: 'Prospecção' },
      { number: '05', label: 'Abordagem' },
    ],
    outcome: 'Empresas certas na mira',
  },
  {
    number: '03',
    label: 'Vender',
    title: 'Da demonstração ao pagamento.',
    steps: [
      { number: '06', label: 'Demonstração' },
      { number: '07', label: 'Proposta' },
      { number: '08', label: 'Fechamento' },
    ],
    outcome: 'Cliente pagante',
  },
]

function PhaseCard({ phase }: { phase: Phase }) {
  return (
    <article className="cs-step group h-full min-h-[360px] px-6 pb-6 pt-7 sm:px-[30px] sm:pb-[26px] sm:pt-[30px]">
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
            <p className="font-display text-[17px] tracking-[-0.02em] text-white">{step.label}</p>
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
    <section id="metodo" className="cs-rail scroll-mt-6 py-24 text-white lg:py-28">
      <span aria-hidden className="cs-rail-signal" />

      <div className="relative z-10 mx-auto w-full max-w-[1280px] px-5 sm:px-8 lg:px-12">
        <LandingFadeIn>
          <div className="text-center lg:text-left">
            <LandingKicker tone="dark">O método</LandingKicker>
            <h2 className="text-[42px] font-normal leading-[0.98] tracking-[-0.055em] sm:text-[52px] lg:text-[60px]">
              Criar. Encontrar. <span className="text-[#a78bfa]">Vender.</span>
            </h2>
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

      </div>
    </section>
  )
}
