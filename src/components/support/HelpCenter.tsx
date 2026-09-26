import { Bot, Crosshair, ListChecks, Search, UserCog, Users, Wallet, type LucideIcon } from 'lucide-react'
import { SilkRibbons } from '@/components/auth/SilkRibbons'
import { OVERALL_STATUS } from '@/data/systemStatus'

interface Topic {
  title: string
  description: string
  icon: LucideIcon
  color: string
  /** Categoria do FAQ que o tópico abre. */
  category: string
}

const TOPICS: Topic[] = [
  { title: 'CRM e contatos', description: 'Organize e acompanhe seus leads.', icon: Users, color: '#a78bfa', category: 'CRM' },
  { title: 'Negócios e pipeline', description: 'Propostas e o funil de vendas.', icon: ListChecks, color: '#818cf8', category: 'Negócios' },
  { title: 'Financeiro', description: 'Receitas, despesas e a receber.', icon: Wallet, color: '#34d399', category: 'Financeiro' },
  { title: 'CS Copilot', description: 'Seu assistente de IA para vendas.', icon: Bot, color: '#e879f9', category: 'CS Copilot' },
  { title: 'Buyers Hunter', description: 'Prospecção de empresas por nicho e cidade.', icon: Crosshair, color: '#fbbf24', category: 'Buyers Hunter' },
  { title: 'Conta e acesso', description: 'E-mail, senha e cancelamento.', icon: UserCog, color: '#60a5fa', category: 'Conta' },
]

const STATUS_LABEL = {
  operational: 'Todos os sistemas operacionais',
  degraded: 'Alguns sistemas com lentidão',
  outage: 'Instabilidade em um ou mais sistemas',
}

const STATUS_DOT = {
  operational: 'bg-emerald-400 shadow-[0_0_10px_#34d399]',
  degraded: 'bg-amber-400 shadow-[0_0_10px_#fbbf24]',
  outage: 'bg-red-400 shadow-[0_0_10px_#f87171]',
}

interface HelpCenterProps {
  search: string
  onSearchChange: (value: string) => void
  onSelectTopic: (category: string) => void
}

// Topo do Suporte: o mesmo tecido roxo do Dashboard, com a busca no centro e
// o status dos sistemas; embaixo, os tópicos que abrem o FAQ filtrado.
export function HelpCenter({ search, onSearchChange, onSelectTopic }: HelpCenterProps) {
  return (
    <div className="flex flex-col gap-4">
      <section className="relative isolate overflow-hidden rounded-[28px] bg-[#0f0a1c] px-6 py-12 text-center text-white ring-1 ring-white/[0.07] sm:px-10 sm:py-14">
        <div className="absolute inset-0 opacity-70" aria-hidden>
          <SilkRibbons className="h-full w-full animate-silk-drift" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,10,28,0.92)_25%,rgba(15,10,28,0.55)_70%,rgba(15,10,28,0.3))]" aria-hidden />

        <div className="relative mx-auto max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1 text-[12.5px] text-white/80 backdrop-blur-md">
            <span className={`size-1.5 rounded-full ${STATUS_DOT[OVERALL_STATUS]}`} />
            {STATUS_LABEL[OVERALL_STATUS]}
          </span>
          <h1 className="mt-5 font-display text-[32px] font-bold leading-tight tracking-tight sm:text-[42px]">Como podemos ajudar?</h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-white/65">
            Busque nas perguntas frequentes ou fale direto com a gente pelo WhatsApp.
          </p>

          <label className="mx-auto mt-7 flex max-w-xl items-center gap-3 rounded-full border border-white/20 bg-white/[0.1] px-5 py-3.5 backdrop-blur-xl transition focus-within:border-white/40 focus-within:bg-white/[0.14]">
            <Search className="size-[18px] shrink-0 text-white/60" />
            <span className="sr-only">Buscar na ajuda</span>
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Busque sua dúvida…"
              className="w-full bg-transparent text-[15px] text-white outline-none placeholder:text-white/45"
            />
          </label>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {TOPICS.map((topic) => (
          <button
            key={topic.category}
            type="button"
            onClick={() => onSelectTopic(topic.category)}
            className="group flex items-center gap-3 rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 text-left shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent-ring)]"
          >
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${topic.color}1f`, color: topic.color }}
            >
              <topic.icon className="size-[18px]" />
            </span>
            <span className="min-w-0">
              <span className="block text-[13.5px] font-semibold leading-tight text-[var(--text-primary)] sm:truncate sm:text-[14px]">{topic.title}</span>
              <span className="hidden truncate text-[12.5px] text-[var(--text-muted)] sm:block">{topic.description}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
