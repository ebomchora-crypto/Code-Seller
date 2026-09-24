import { AlertTriangle, BarChart2, CheckSquare, MessageSquare, Send, User, type LucideIcon } from 'lucide-react'
import { V0AiChat, type AiChatQuickAction } from '@/components/ui/v0-ai-chat'
import type { QuickPrompt } from '@/types'

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

export function QuickPrompts({ onSelect, sending, hasContext }: QuickPromptsProps) {
  const quickActions: AiChatQuickAction[] = QUICK_PROMPTS.map((quickPrompt) => ({
    id: quickPrompt.id,
    label: quickPrompt.label,
    prompt: quickPrompt.prompt,
    icon: ICONS[quickPrompt.icon] ?? MessageSquare,
  }))

  return (
    <V0AiChat
      variant="welcome"
      onSend={onSelect}
      sending={sending}
      hasContext={hasContext}
      quickActions={quickActions}
    />
  )
}
