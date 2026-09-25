import { LandingEyebrow } from '@/components/landing/LandingEyebrow'
import { Reveal } from '@/components/motion/Reveal'
import { fadeInLeft } from '@/motion/variants'

const steps = [
  { number: '01', label: 'Ideia', description: 'Um problema real que vale a pena resolver.' },
  { number: '02', label: 'Construção', description: 'A solução criada com IA, funcionando de verdade.' },
  { number: '03', label: 'Oferta', description: 'O projeto embalado como algo que se vende.' },
  { number: '04', label: 'Prospecção', description: 'Empresas certas, encontradas com o Buyers Hunter.' },
  { number: '05', label: 'Abordagem', description: 'A primeira conversa, sem parecer spam.' },
  { number: '06', label: 'Demo', description: 'Mostrar a solução resolvendo o problema, ao vivo.' },
  { number: '07', label: 'Proposta', description: 'Escopo, prazo e valor, por escrito.' },
  { number: '08', label: 'Fechamento', description: 'Cliente pagante, dinheiro no bolso.' },
]

// Trilha vertical conectando os 8 passos — não mais um grid genérico de
// 4 colunas. Linha com gradiente, marcador numerado por cima dela, número
// fantasma gigante atrás de cada label pra dar peso editorial.
function TimelineNode({ step }: { step: (typeof steps)[number] }) {
  return (
    <Reveal variants={fadeInLeft} className="relative flex gap-6 py-7 pl-1 first:pt-0 last:pb-0 sm:gap-8">
      <span
        aria-hidden
        className="relative z-10 mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-landing-primary-hover/60 bg-landing-bg text-xs font-bold text-landing-primary-hover shadow-landing-glow"
      >
        {step.number}
      </span>

      <div className="relative min-w-0 pt-0.5">
        <span
          aria-hidden
          className="pointer-events-none absolute -top-4 left-0 select-none text-[5rem] font-bold leading-none tracking-tighter text-white/[0.035] sm:text-[6rem]"
        >
          {step.number}
        </span>
        <h3 className="relative text-lg font-semibold tracking-[-0.01em] text-landing-text">{step.label}</h3>
        <p className="relative mt-1.5 max-w-sm text-sm leading-relaxed text-landing-text-secondary">
          {step.description}
        </p>
      </div>
    </Reveal>
  )
}

export function LandingTimeline() {
  return (
    <section className="relative overflow-hidden bg-landing-bg py-24 sm:py-32">
      <div className="relative mx-auto w-full max-w-[720px] px-6 sm:px-8">
        <LandingEyebrow>O processo</LandingEyebrow>
        <h2 className="mt-4 max-w-xl text-3xl font-medium leading-[1.1] tracking-[-0.03em] text-landing-text sm:text-4xl">
          O ciclo completo.
        </h2>

        <div className="relative mt-16">
          <span
            aria-hidden
            className="absolute left-[17px] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-landing-border to-transparent"
          />
          {steps.map((step) => (
            <TimelineNode key={step.number} step={step} />
          ))}
        </div>
      </div>
    </section>
  )
}
