import { Check } from 'lucide-react'
import { LandingEyebrow } from '@/components/landing/LandingEyebrow'
import { StaggerGroup } from '@/components/motion/StaggerGroup'
import { motion } from 'motion/react'
import { scaleIn } from '@/motion/variants'

// Benefícios concretos, sem métricas inventadas (sem "+10 mil alunos" etc.
// — não existem dados reais pra isso ainda).
const benefits = [
  'Projeto pronto',
  'Oferta mais clara',
  'Empresas qualificadas',
  'Abordagem estruturada',
  'Pipeline organizado',
  'Proposta profissional',
]

export function LandingBenefits() {
  return (
    <section className="relative overflow-hidden bg-landing-bg py-24 sm:py-32">
      <div className="relative mx-auto w-full max-w-[1280px] px-6 sm:px-8 lg:px-12">
        <LandingEyebrow>O que você leva</LandingEyebrow>
        <h2 className="mt-4 max-w-xl text-3xl font-medium leading-[1.1] tracking-[-0.03em] text-landing-text sm:text-4xl">
          Resultado concreto, não promessa vaga.
        </h2>

        <StaggerGroup delay={0.06} className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit) => (
            <motion.div
              key={benefit}
              variants={scaleIn}
              className="flex items-center gap-3 rounded-landing-md border border-landing-border bg-landing-surface-card px-5 py-4"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-landing-primary-soft text-landing-primary-hover">
                <Check className="h-3.5 w-3.5" />
              </span>
              <span className="text-sm font-medium text-landing-text">{benefit}</span>
            </motion.div>
          ))}
        </StaggerGroup>
      </div>
    </section>
  )
}
