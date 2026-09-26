import { useState } from 'react'
import { Bot, CreditCard, DollarSign, ListChecks, Search, Users } from 'lucide-react'
import { SectionLabel } from '@/components/ui/section-label'
import { PurpleDivider } from '@/components/ui/purple-divider'

interface Topic {
  id: string
  title: string
  description: string
  icon: typeof Users
  category: string
}

const TOPICS: Topic[] = [
  { id: 'crm', title: 'CRM e Contatos', description: 'Organize e acompanhe seus contatos e leads.', icon: Users, category: 'CRM' },
  { id: 'deals', title: 'Negócios e Pipeline', description: 'Gerencie propostas e o funil de vendas.', icon: ListChecks, category: 'Negócios' },
  { id: 'financial', title: 'Financeiro', description: 'Receitas, despesas e contas a receber.', icon: DollarSign, category: 'Financeiro' },
  { id: 'tasks', title: 'Tarefas', description: 'Organize seu dia a dia e não perca prazos.', icon: ListChecks, category: 'Tarefas' },
  { id: 'autopilot', title: 'CS Copilot', description: 'Seu assistente de IA para vendas.', icon: Bot, category: 'CS Copilot' },
  { id: 'billing', title: 'Planos e Cobrança', description: 'Assinaturas, upgrades e pagamentos.', icon: CreditCard, category: 'Planos' },
]

interface HelpCenterProps {
  search: string
  onSearchChange: (value: string) => void
  onSelectTopic: (category: string) => void
}

export function HelpCenter({ search, onSearchChange, onSelectTopic }: HelpCenterProps) {
  const [focused, setFocused] = useState(false)

  return (
    <section id="ajuda" className="scroll-mt-24 py-12">
      <div className="text-center">
        <div className="flex justify-center">
          <SectionLabel>Central de ajuda</SectionLabel>
        </div>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-[var(--text-primary)]">Como podemos ajudar?</h2>
        <div className="mt-3 flex justify-center">
          <PurpleDivider />
        </div>
      </div>

      <div className="mx-auto mt-8 w-full max-w-xl">
        <div
          className={`flex items-center gap-3 rounded-2xl border bg-[var(--bg-muted)] px-5 py-4 transition-colors ${
            focused ? 'border-purple-400' : 'border-[var(--border-default)]'
          }`}
        >
          <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Busque artigos, tutoriais..."
            className="w-full bg-transparent text-base text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
          />
        </div>
      </div>

      <div className="mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOPICS.map((topic) => {
          const Icon = topic.icon
          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => onSelectTopic(topic.category)}
              className="flex flex-col items-start gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 text-left transition-all duration-200 hover:border-[var(--border-default)] hover:shadow-[var(--shadow-card)]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--bg-muted)] text-[var(--text-secondary)]">
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{topic.title}</p>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">{topic.description}</p>
              </div>
              <span className="text-xs font-medium text-purple-500">Ver perguntas →</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
