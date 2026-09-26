import { AlertTriangle, BarChart2, CheckSquare, MessageSquare, Send, User, type LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { CopilotComposer } from '@/components/autopilot/CopilotComposer'
import { CopilotOrb } from '@/components/autopilot/CopilotOrb'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { EASE_PREMIUM } from '@/utils/animations'
import type { AutoPilotContext, QuickPrompt } from '@/types'

interface QuickPromptsProps {
  onSelect: (prompt: string) => void
  sending: boolean
  hasContext: boolean
}

const ICONS: Record<string, LucideIcon> = {
  BarChart2,
  AlertTriangle,
  MessageSquare,
  Send,
  User,
  CheckSquare,
}

export const QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: 'analyze_pipeline',
    label: 'Analisar meu pipeline',
    prompt: 'Analise meu pipeline atual e me diga quais deals merecem atenção prioritária esta semana.',
    icon: 'BarChart2',
    category: 'analysis',
  },
  {
    id: 'stalled_deals',
    label: 'Ver deals parados',
    prompt: 'Quais negócios estão parados há mais tempo? O que você sugere fazer com cada um?',
    icon: 'AlertTriangle',
    category: 'follow_up',
  },
  {
    id: 'generate_approach',
    label: 'Gerar abordagem para lead',
    prompt: 'Me ajude a gerar uma mensagem de abordagem para um novo lead. Me pergunte as informações necessárias.',
    icon: 'MessageSquare',
    category: 'message',
  },
  {
    id: 'follow_up',
    label: 'Criar follow-up',
    prompt: 'Preciso criar mensagens de follow-up para deals que não tiveram atividade recente. Me mostre quais são e sugira mensagens.',
    icon: 'Send',
    category: 'follow_up',
  },
  {
    id: 'summarize_contact',
    label: 'Resumir contato',
    prompt: 'Me ajude a criar um resumo completo de um contato específico. Qual contato você quer resumir?',
    icon: 'User',
    category: 'analysis',
  },
  {
    id: 'suggest_tasks',
    label: 'Sugerir tarefas',
    prompt: 'Com base no meu pipeline e nos deals parados, quais tarefas você sugere que eu crie para esta semana?',
    icon: 'CheckSquare',
    category: 'task',
  },
]

// Uma linha explicando o que cada sugestão entrega.
const DESCRIPTIONS: Record<string, string> = {
  analyze_pipeline: 'Quais negócios merecem atenção esta semana',
  stalled_deals: 'O que está parado e como destravar',
  generate_approach: 'Mensagem pronta para um lead novo',
  follow_up: 'Retome quem esfriou, com texto pronto',
  summarize_contact: 'Tudo sobre um contato em poucas linhas',
  suggest_tasks: 'Um plano de tarefas para a semana',
}

interface WelcomeProps extends QuickPromptsProps {
  context: AutoPilotContext | null
}

// Tela inicial do CS Copilot: orbe, saudação ciente dos dados, compositor
// grande e sugestões em cards.
export function QuickPrompts({ onSelect, sending, hasContext, context }: WelcomeProps) {
  const reducedMotion = useReducedMotion()
  const summary = context?.summary
  const reveal = (delay: number) => ({
    initial: reducedMotion ? false : { opacity: 0, y: 14, filter: 'blur(6px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    transition: { duration: 0.7, ease: EASE_PREMIUM, delay },
  })

  return (
    <div className="m-auto flex w-full max-w-3xl flex-col items-center px-5 py-10 sm:px-8">
      <motion.div {...reveal(0)}>
        <CopilotOrb size="lg" />
      </motion.div>

      <motion.h1
        {...reveal(0.08)}
        className="mt-7 text-center font-display text-[28px] font-bold leading-tight tracking-tight text-[var(--text-primary)] sm:text-[36px]"
      >
        Como posso ajudar nas suas vendas hoje?
      </motion.h1>
      <motion.p {...reveal(0.14)} className="mt-3 max-w-lg text-center text-[14.5px] leading-relaxed text-[var(--text-muted)]">
        {summary
          ? `Já estou por dentro dos seus ${summary.total_contacts} contatos, ${summary.active_deals} negócios ativos e ${summary.pending_tasks} tarefas pendentes.`
          : 'Estou lendo seus contatos, negócios e tarefas para responder com os seus dados.'}
      </motion.p>

      <motion.div {...reveal(0.2)} className="mt-8 w-full">
        <CopilotComposer onSend={onSelect} sending={sending} hasContext={hasContext} size="large" />
      </motion.div>

      <motion.div {...reveal(0.28)} className="mt-6 grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_PROMPTS.map((quickPrompt) => {
          const Icon = ICONS[quickPrompt.icon] ?? MessageSquare
          return (
            <button
              key={quickPrompt.id}
              type="button"
              onClick={() => onSelect(quickPrompt.prompt)}
              disabled={sending}
              className="group flex items-start gap-3 rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent-ring)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-tint)] text-[var(--accent-text)] transition-colors group-hover:bg-[var(--accent-solid)] group-hover:text-white">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13.5px] font-semibold text-[var(--text-primary)]">{quickPrompt.label}</span>
                <span className="mt-0.5 block text-[12.5px] leading-snug text-[var(--text-muted)]">
                  {DESCRIPTIONS[quickPrompt.id]}
                </span>
              </span>
            </button>
          )
        })}
      </motion.div>
    </div>
  )
}
