import type { ComponentType, SVGProps } from 'react'
import { motion } from 'motion/react'
import {
  AutopilotIcon,
  CrmIcon,
  DealsIcon,
  FinancialIcon,
  ProspectionIcon,
  TasksIcon,
} from '@/components/layout/navIcons'
import { SectionLabel } from '@/components/ui/section-label'
import { SpotlightCard } from '@/components/motion/SpotlightCard'
import { StaggerGroup } from '@/components/motion/StaggerGroup'
import { scaleIn } from '@/motion/variants'

interface Feature {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  title: string
  description: string
  comingSoon?: boolean
}

// Módulos reais do produto — nada inventado. Prospecção é sinalizada como
// "em breve" porque é um ModulePlaceholder de verdade no app hoje.
const features: Feature[] = [
  {
    icon: CrmIcon,
    title: 'CRM de contatos',
    description: 'Organize leads e clientes com status, tags e histórico completo em um só lugar.',
  },
  {
    icon: DealsIcon,
    title: 'Pipeline de negócios',
    description: 'Acompanhe cada negociação em um Kanban visual, do primeiro contato ao fechamento.',
  },
  {
    icon: FinancialIcon,
    title: 'Financeiro',
    description: 'Controle recebíveis, pagamentos e recorrências sem sair do CRM.',
  },
  {
    icon: TasksIcon,
    title: 'Tarefas',
    description: 'Organize follow-ups e lembretes vinculados a contatos e negócios.',
  },
  {
    icon: AutopilotIcon,
    title: 'AutoPilot (IA)',
    description: 'Assistente de IA que analisa seu pipeline e sugere próximos passos.',
  },
  {
    icon: ProspectionIcon,
    title: 'Prospecção',
    description: 'Encontre e priorize novos potenciais clientes para seus serviços.',
    comingSoon: true,
  },
]

export function LandingFeatures() {
  return (
    <section id="funcionalidades" className="bg-paper py-24">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
        <div className="max-w-xl">
          <SectionLabel>Funcionalidades</SectionLabel>
          <h2 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink">
            Tudo que você precisa para vender
          </h2>
          <p className="mt-3 text-base text-neutral-600">
            Um sistema único para organizar leads, negociações, finanças e tarefas do seu negócio
            de serviços digitais.
          </p>
        </div>

        <StaggerGroup delay={0.08} className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <motion.div key={feature.title} variants={scaleIn}>
                <SpotlightCard className="h-full !border-neutral-200 !bg-white p-6">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
                      <Icon className="h-5 w-5" />
                    </span>
                    {feature.comingSoon && (
                      <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                        Em breve
                      </span>
                    )}
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold text-ink">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600">{feature.description}</p>
                </SpotlightCard>
              </motion.div>
            )
          })}
        </StaggerGroup>
      </div>
    </section>
  )
}
