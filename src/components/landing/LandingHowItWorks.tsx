import { motion } from 'motion/react'
import { SectionLabel } from '@/components/ui/section-label'
import { StepNumber } from '@/components/ui/step-number'
import { StaggerGroup } from '@/components/motion/StaggerGroup'
import { fadeInUp } from '@/motion/variants'

const steps = [
  {
    number: '01',
    title: 'Organize seus leads',
    description: 'Cadastre contatos, adicione tags e acompanhe o histórico de cada relacionamento.',
  },
  {
    number: '02',
    title: 'Acompanhe o pipeline',
    description: 'Mova negócios pelo Kanban conforme cada negociação avança, sem perder o timing.',
  },
  {
    number: '03',
    title: 'Feche e receba',
    description: 'Registre o pagamento e acompanhe recebíveis direto no módulo financeiro.',
  },
]

export function LandingHowItWorks() {
  return (
    <section id="como-funciona" className="bg-paper pb-24">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
        <div className="max-w-xl">
          <SectionLabel>Como funciona</SectionLabel>
          <h2 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink">
            Do lead ao pagamento, em três passos
          </h2>
        </div>

        <StaggerGroup delay={0.12} className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {steps.map((step) => (
            <motion.div key={step.number} variants={fadeInUp} className="group">
              <StepNumber number={step.number} />
              <h3 className="mt-4 font-display text-lg font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">{step.description}</p>
            </motion.div>
          ))}
        </StaggerGroup>
      </div>
    </section>
  )
}
