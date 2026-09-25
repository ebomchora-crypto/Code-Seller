import { Building2, FileCheck2, ListChecks, MessageSquare, Rocket, Target } from 'lucide-react'
import { LandingEyebrow } from '@/components/landing/LandingEyebrow'
import { StaggerGroup } from '@/components/motion/StaggerGroup'
import { motion } from 'motion/react'
import { scaleIn } from '@/motion/variants'

// Benefícios concretos, sem métricas inventadas (sem "+10 mil alunos" etc.
// — não existem dados reais pra isso ainda). Cada um ganhou um ícone
// próprio e uma linha de contexto — não é mais um chip genérico com check.
const benefits = [
  {
    icon: Rocket,
    title: 'Projeto pronto',
    description: 'Não é protótipo. É algo que você já pode mostrar e vender.',
  },
  {
    icon: Target,
    title: 'Oferta mais clara',
    description: 'O que você resolve, dito sem enrolação — fácil de vender.',
  },
  {
    icon: Building2,
    title: 'Empresas qualificadas',
    description: 'Uma lista de quem realmente precisa da sua solução.',
  },
  {
    icon: MessageSquare,
    title: 'Abordagem estruturada',
    description: 'Um roteiro pra puxar conversa sem parecer spam.',
  },
  {
    icon: ListChecks,
    title: 'Pipeline organizado',
    description: 'Cada oportunidade no seu estágio, sem se perder no caos.',
  },
  {
    icon: FileCheck2,
    title: 'Proposta profissional',
    description: 'Escopo, prazo e valor, prontos pra enviar.',
  },
]

export function LandingBenefits() {
  return (
    <section className="relative overflow-hidden bg-landing-bg py-24 sm:py-32">
      <div className="relative mx-auto w-full max-w-[1280px] px-6 sm:px-8 lg:px-12">
        <LandingEyebrow>O que você leva</LandingEyebrow>
        <h2 className="mt-4 max-w-xl text-3xl font-medium leading-[1.1] tracking-[-0.03em] text-landing-text sm:text-4xl">
          Resultado concreto, não promessa vaga.
        </h2>

        <StaggerGroup delay={0.06} className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              variants={scaleIn}
              className="group relative overflow-hidden rounded-landing-lg border border-landing-border bg-landing-surface-card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.14]"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -right-2 -top-4 select-none text-6xl font-bold leading-none tracking-tighter text-white/[0.04]"
              >
                {String(index + 1).padStart(2, '0')}
              </span>

              <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-landing-primary-soft text-landing-primary-hover transition-colors duration-300 group-hover:bg-landing-primary group-hover:text-white">
                <benefit.icon className="h-5 w-5" />
              </span>

              <h3 className="relative mt-5 text-base font-semibold text-landing-text">{benefit.title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-landing-text-secondary">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </StaggerGroup>
      </div>
    </section>
  )
}
