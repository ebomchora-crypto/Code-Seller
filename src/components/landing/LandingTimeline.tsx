import { LandingEyebrow } from '@/components/landing/LandingEyebrow'
import { StaggerGroup } from '@/components/motion/StaggerGroup'
import { motion } from 'motion/react'
import { scaleIn } from '@/motion/variants'

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

export function LandingTimeline() {
  return (
    <section className="relative overflow-hidden bg-landing-bg py-24 sm:py-32">
      <div className="relative mx-auto w-full max-w-[1280px] px-6 sm:px-8 lg:px-12">
        <LandingEyebrow>O processo</LandingEyebrow>
        <h2 className="mt-4 max-w-xl text-3xl font-medium leading-[1.1] tracking-[-0.03em] text-landing-text sm:text-4xl">
          O ciclo completo.
        </h2>

        <StaggerGroup delay={0.06} className="mt-14 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <motion.div key={step.number} variants={scaleIn} className="border-t border-landing-border pt-5">
              <span className="text-sm font-semibold text-landing-primary-hover">{step.number}</span>
              <h3 className="mt-2 text-base font-medium tracking-[-0.01em] text-landing-text">{step.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-landing-text-secondary">{step.description}</p>
            </motion.div>
          ))}
        </StaggerGroup>
      </div>
    </section>
  )
}
