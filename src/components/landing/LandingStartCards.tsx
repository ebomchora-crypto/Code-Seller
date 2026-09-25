import { ArrowUpRight, Check } from 'lucide-react'
import { Eyebrow } from '@/components/ui/eyebrow'
import { SectionCurve } from '@/components/ui/section-curve'
import { StaggerGroup } from '@/components/motion/StaggerGroup'
import { Reveal } from '@/components/motion/Reveal'
import { motion } from 'motion/react'
import { scaleIn, fadeInUp } from '@/motion/variants'

// Conteúdo idêntico ao ciclo Criar → Organizar → Vender do produto real —
// mesma ideia de 3 cards numerados da referência visual, só que em cards
// escuros (glass) sobre o accent-ink, continuando o tom do Hero logo acima.
const steps = [
  {
    number: '01',
    label: 'Criar',
    title: 'Organize seus leads',
    description: 'Cadastre contatos, adicione tags e acompanhe o histórico completo de cada relacionamento.',
    tagline: 'Seu funil, sempre visível',
  },
  {
    number: '02',
    label: 'Organizar',
    title: 'Acompanhe o pipeline',
    description: 'Mova negócios pelo Kanban conforme cada negociação avança, sem perder o timing.',
    tagline: 'Nada esquecido no meio do caminho',
  },
  {
    number: '03',
    label: 'Vender',
    title: 'Feche e receba',
    description: 'Registre o pagamento e acompanhe recebíveis direto no módulo financeiro.',
    tagline: 'Venda fechada, dinheiro rastreado',
  },
]

function DarkStepCard({ step }: { step: (typeof steps)[number] }) {
  return (
    <motion.div
      variants={scaleIn}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-glass-strong backdrop-blur-xl transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.06]"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-6 -right-2 font-display text-[7rem] font-bold leading-none text-white/5 transition-colors duration-300 group-hover:text-accent-bright/10"
      >
        {step.number}
      </span>

      <div className="relative flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-accent-bright/60 text-xs font-bold text-accent-bright">
            {step.number}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-accent-bright">{step.label}</span>
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-white/60 transition-all duration-300 group-hover:rotate-45 group-hover:bg-accent-500 group-hover:text-white">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>

      <h3 className="relative mt-5 font-display text-lg font-semibold text-white">{step.title}</h3>
      <p className="relative mt-2 text-sm leading-relaxed text-neutral-400">{step.description}</p>

      <p className="relative mt-4 flex items-center gap-1.5 text-xs font-medium text-neutral-500">
        <Check className="h-3.5 w-3.5 text-accent-bright" />
        {step.tagline}
      </p>
    </motion.div>
  )
}

// Continuação direta do Hero — mesma linguagem escura (accent-ink), curva de
// entrada partindo do "paper" que o próprio Hero já deixa como cor de saída.
// Não mexe em nada do BlackHoleHeroSection, é uma seção nova, independente.
export function LandingStartCards() {
  return (
    <section id="como-funciona" className="relative overflow-hidden bg-accent-ink">
      <SectionCurve fromColor="#f5f3f2" toColor="#0b0014" />

      <div className="relative mx-auto w-full max-w-7xl px-6 pb-20 pt-2 lg:px-8">
        <Reveal variants={fadeInUp} className="max-w-xl">
          <Eyebrow variant="dark">Da ideia ao dinheiro no bolso</Eyebrow>
          <h2 className="mt-3 font-display text-2xl font-bold leading-snug tracking-tight text-white sm:text-3xl">
            Uma rota completa para sair do lead e chegar ao pagamento.
          </h2>
        </Reveal>

        <StaggerGroup delay={0.1} className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {steps.map((step) => (
            <DarkStepCard key={step.number} step={step} />
          ))}
        </StaggerGroup>
      </div>
    </section>
  )
}
