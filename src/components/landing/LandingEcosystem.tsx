import { LandingEyebrow } from '@/components/landing/LandingEyebrow'
import { StaggerGroup } from '@/components/motion/StaggerGroup'
import { Reveal } from '@/components/motion/Reveal'
import { motion } from 'motion/react'
import { fadeInUp, scaleIn } from '@/motion/variants'

const pillars = [
  { label: 'IA', title: 'Criação', description: 'Transforme ideias em sites e sistemas reais, prontos para apresentar.' },
  { label: 'Code Hunter', title: 'Prospecção', description: 'Encontre empresas com potencial real de compra, sem tentar no escuro.' },
  { label: 'Método Code Sellers', title: 'Venda', description: 'Um processo estruturado pra conduzir cada conversa até o fechamento.' },
]

const flow = ['IA', 'Produto', 'Code Hunter', 'Oportunidades', 'Método', 'Cliente']

export function LandingEcosystem() {
  return (
    <section className="relative overflow-hidden bg-landing-bg py-24 sm:py-32">
      <div className="relative mx-auto w-full max-w-[1280px] px-6 sm:px-8 lg:px-12">
        <Reveal variants={fadeInUp} className="mx-auto max-w-2xl text-center">
          <LandingEyebrow>O ecossistema</LandingEyebrow>
          <h2 className="mt-4 text-3xl font-medium leading-[1.1] tracking-[-0.03em] text-landing-text sm:text-4xl">
            Um sistema inteiro para transformar habilidade em receita.
          </h2>
        </Reveal>

        <StaggerGroup delay={0.1} className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {pillars.map((pillar) => (
            <motion.div
              key={pillar.label}
              variants={scaleIn}
              className="rounded-landing-lg border border-landing-border bg-landing-surface-card p-8 shadow-landing-card"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-landing-primary-hover">
                {pillar.label}
              </span>
              <h3 className="mt-3 text-xl font-medium tracking-[-0.02em] text-landing-text">{pillar.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-landing-text-secondary">{pillar.description}</p>
            </motion.div>
          ))}
        </StaggerGroup>

        <Reveal
          variants={fadeInUp}
          className="mt-8 flex flex-wrap items-center justify-center gap-x-1 gap-y-3 rounded-landing-lg border border-landing-border bg-landing-surface-card px-6 py-6"
        >
          {flow.map((step, index) => (
            <span key={step} className="flex items-center gap-1">
              <span
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  index === flow.length - 1
                    ? 'bg-landing-primary text-white'
                    : 'border border-landing-border text-landing-text-secondary'
                }`}
              >
                {step}
              </span>
              {index < flow.length - 1 && <span className="px-1 text-landing-text-muted">→</span>}
            </span>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
