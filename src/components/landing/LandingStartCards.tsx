import { ArrowUpRight } from 'lucide-react'
import { LandingEyebrow } from '@/components/landing/LandingEyebrow'
import { StaggerGroup } from '@/components/motion/StaggerGroup'
import { Reveal } from '@/components/motion/Reveal'
import { motion } from 'motion/react'
import { scaleIn, fadeInUp } from '@/motion/variants'

// O ciclo central do método: Criar → Encontrar → Vender. Cards grandes,
// numeração gigante em background (opacity baixíssima), mesmo fundo dark
// premium do Hero.
const steps = [
  {
    number: '01',
    label: 'Criar',
    title: 'Crie sites e sistemas com IA.',
    description: 'Transforme ideias em soluções funcionais, responsivas e prontas para apresentar.',
  },
  {
    number: '02',
    label: 'Encontrar',
    title: 'Encontre empresas certas.',
    description: 'Use o Buyers Hunter para colocar oportunidades qualificadas no seu radar.',
  },
  {
    number: '03',
    label: 'Vender',
    title: 'Transforme oportunidade em cliente.',
    description: 'Aprenda oferta, abordagem, demonstração, proposta e fechamento.',
  },
]

function StepCard({ step }: { step: (typeof steps)[number] }) {
  return (
    <motion.div
      variants={scaleIn}
      className="group relative flex min-h-[280px] flex-col overflow-hidden rounded-landing-lg border border-white/[0.07] bg-landing-surface-card p-8 shadow-landing-card transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.14]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-landing-primary/[0.14] blur-3xl transition-opacity duration-300 group-hover:opacity-80"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-8 -right-3 select-none text-[9rem] font-semibold leading-none tracking-tighter text-white/[0.04]"
      >
        {step.number}
      </span>

      <div className="relative flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-landing-primary-hover/50 text-xs font-bold text-landing-primary-hover">
            {step.number}
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-landing-primary-hover">
            {step.label}
          </span>
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-white/60 transition-all duration-300 group-hover:rotate-45 group-hover:bg-landing-primary group-hover:text-white">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>

      <h3 className="relative mt-auto pt-10 text-xl font-medium leading-snug tracking-[-0.02em] text-landing-text">
        {step.title}
      </h3>
      <p className="relative mt-3 text-sm leading-relaxed text-landing-text-secondary">{step.description}</p>
    </motion.div>
  )
}

export function LandingStartCards() {
  return (
    <section id="metodo" className="relative overflow-hidden bg-landing-bg py-24 sm:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-landing-primary/[0.06] blur-[120px]"
      />

      <div className="relative mx-auto w-full max-w-[1280px] px-6 sm:px-8 lg:px-12">
        <Reveal variants={fadeInUp} className="max-w-xl">
          <LandingEyebrow>O método</LandingEyebrow>
          <h2 className="mt-4 text-3xl font-medium leading-[1.1] tracking-[-0.03em] text-landing-text sm:text-4xl">
            Criar é fácil. O difícil é transformar em venda.
          </h2>
        </Reveal>

        <StaggerGroup delay={0.1} className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {steps.map((step) => (
            <StepCard key={step.number} step={step} />
          ))}
        </StaggerGroup>
      </div>
    </section>
  )
}
