import { AlertTriangle, BarChart2, MessageSquare, Pencil, RotateCcw, Send, Users, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { motion } from 'motion/react'
import { CopilotComposer } from '@/components/autopilot/CopilotComposer'
import { CopilotPreferencesBar } from '@/components/autopilot/CopilotPreferencesBar'
import { CopilotOrb } from '@/components/autopilot/CopilotOrb'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { EASE_PREMIUM } from '@/utils/animations'
import type { AutoPilotContext, CopilotPreferences, QuickPrompt } from '@/types'

interface QuickPromptsProps {
  onSelect: (prompt: string) => void
  sending: boolean
  hasContext: boolean
  preferences: CopilotPreferences
  onPreferencesChange: (value: CopilotPreferences) => void
}

const ICONS: Record<string, LucideIcon> = {
  BarChart2,
  AlertTriangle,
  MessageSquare,
  Send,
  Users,
  RotateCcw,
  Pencil,
}

export const QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: 'analyze_conversation',
    label: 'Analisar conversa',
    draft: 'Analise esta conversa detalhadamente. Considere o histórico inteiro e me diga a etapa, o interesse, a objeção, o risco, a próxima ação, a mensagem pronta e o follow-up sugerido.\n\nCole a conversa aqui:\n',
    icon: 'BarChart2',
    category: 'analysis',
  },
  {
    id: 'what_to_reply',
    label: 'O que respondo?',
    draft: 'O que eu respondo? Priorize a mensagem pronta e explique a estratégia em uma linha.\n\nÚltimas mensagens da conversa:\n',
    icon: 'MessageSquare',
    category: 'message',
  },
  {
    id: 'follow_up',
    label: 'Criar follow-up',
    draft: 'Crie um follow-up adequado para este caso.\n\nÚltima interação:\nDias sem resposta:\nEtapa da venda:\nContexto:\n',
    icon: 'Send',
    category: 'follow_up',
  },
  {
    id: 'handle_objection',
    label: 'Quebrar objeção',
    draft: 'Quebre esta objeção com uma resposta humana, sem pressionar. Explique a leitura e o próximo passo.\n\nObjeção do lead:\n',
    icon: 'AlertTriangle',
    category: 'message',
  },
  {
    id: 'prepare_meeting',
    label: 'Preparar reunião',
    draft: 'Prepare esta reunião comercial. Organize o contexto, as perguntas de diagnóstico, as objeções e o próximo passo.\n\nContexto conhecido:\n',
    icon: 'Users',
    category: 'analysis',
  },
  {
    id: 'recover_lead',
    label: 'Recuperar lead',
    draft: 'Me ajude a recuperar este lead sem inventar urgência. Gere uma mensagem curta e diga quando encerrar se não houver resposta.\n\nÚltimo contato e contexto:\n',
    icon: 'RotateCcw',
    category: 'follow_up',
  },
  {
    id: 'create_message',
    label: 'Criar mensagem',
    draft: 'Crie uma mensagem comercial humana para WhatsApp.\n\nObjetivo da mensagem:\nContexto do lead:\nInformações que precisam aparecer:\n',
    icon: 'Pencil',
    category: 'message',
  },
]

// Uma linha explicando o que cada sugestão entrega.
const DESCRIPTIONS: Record<string, string> = {
  analyze_conversation: 'Leitura completa do histórico e próxima ação',
  what_to_reply: 'Mensagem pronta primeiro, sem textão',
  follow_up: 'Retomada certa para o tempo e a etapa',
  handle_objection: 'Entenda o bloqueio e responda sem pressão',
  prepare_meeting: 'Perguntas, contexto e objetivo da conversa',
  recover_lead: 'Reabra a conversa sem inventar urgência',
  create_message: 'Texto humano para o objetivo que você definir',
}

interface WelcomeProps extends QuickPromptsProps {
  context: AutoPilotContext | null
}

// Tela inicial do CS Copilot: orbe, saudação ciente dos dados, compositor
// grande e sugestões em cards.
export function QuickPrompts({ onSelect, sending, hasContext, context, preferences, onPreferencesChange }: WelcomeProps) {
  const reducedMotion = useReducedMotion()
  const [draft, setDraft] = useState<{ content: string }>()
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
        <CopilotComposer onSend={onSelect} sending={sending} hasContext={hasContext} size="large" draft={draft} />
        <div className="mt-1"><CopilotPreferencesBar value={preferences} onChange={onPreferencesChange} /></div>
      </motion.div>

      <motion.div {...reveal(0.28)} className="mt-6 grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_PROMPTS.map((quickPrompt) => {
          const Icon = ICONS[quickPrompt.icon] ?? MessageSquare
          return (
            <button
              key={quickPrompt.id}
              type="button"
              onClick={() => setDraft({ content: quickPrompt.draft })}
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
