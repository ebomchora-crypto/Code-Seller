import { ArrowUpRight, Check } from 'lucide-react'
import { LandingEyebrow } from '@/components/landing/LandingEyebrow'
import { StaggerGroup } from '@/components/motion/StaggerGroup'
import { Reveal } from '@/components/motion/Reveal'
import { motion } from 'motion/react'
import { scaleIn, fadeInUp } from '@/motion/variants'

// Conteúdo idêntico ao ciclo Criar → Organizar → Vender do produto real —
// 3 cards numerados sobre o mesmo fundo dark premium (#08080a) do resto da
// landing, continuando direto do Hero.
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

function StepCard({ step }: { step: (typeof steps)[number] }) {
  return (
    <motion.div
      variants={scaleIn}
      className="group relative overflow-hidden rounded-3xl border border-white/[0.07] bg-[#101014] p-6 shadow-landing-card transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.12]"
    >
      {/* Iluminação roxa sutil no canto — nada de glow exagerado */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-landing-primary/[0.14] blur-3xl transition-opacity duration-300 group-hover:opacity-80"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-6 -right-2 select-none text-[7rem] font-bold leading-none text-white/[0.03]"
      >
        {step.number}
      </span>

      <div className="relative flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-landing-primary-hover/50 text-xs font-bold text-landing-primary-hover">
            {step.number}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-landing-primary-hover">{step.label}</span>
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-white/60 transition-all duration-300 group-hover:rotate-45 group-hover:bg-landing-primary group-hover:text-white">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>

      <h3 className="relative mt-5 text-lg font-semibold text-landing-text">{step.title}</h3>
      <p className="relative mt-2 text-sm leading-relaxed text-landing-text-secondary">{step.description}</p>

      <p className="relative mt-4 flex items-center gap-1.5 text-xs font-medium text-landing-text-muted">
        <Check className="h-3.5 w-3.5 text-landing-primary-hover" />
        {step.tagline}
      </p>
    </motion.div>
  )
}

// Continuação direta do Hero, mesma cor exata (#08080a) — sem curva de
// transição porque não há mudança de cor entre as duas seções.
export function LandingStartCards() {
  return (
    <section id="como-funciona" className="relative overflow-hidden bg-landing-bg py-20 sm:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-landing-primary/[0.06] blur-[120px]"
      />

      <div className="relative mx-auto w-full max-w-7xl px-6 lg:px-8">
        <Reveal variants={fadeInUp} className="max-w-xl">
          <LandingEyebrow>Da ideia ao dinheiro no bolso</LandingEyebrow>
          <h2 className="mt-4 text-3xl font-bold leading-[1.1] tracking-tight text-landing-text sm:text-4xl">
            Uma rota completa para sair do lead e chegar ao pagamento.
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
