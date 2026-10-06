import { useRef, useState } from 'react'
import { CalendarPlus, Check, Copy, MessageCircle, RotateCw, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { SendMessageModal } from '@/components/messages/SendMessageModal'
import { CommercialTaskDialog } from './CommercialTaskDialog'
import { commercialResponseSections, type CommercialResponseSection } from './commercialResponseView'
import { createInteraction } from '@/services/supabase/interactions'
import type { AutoPilotMessage, Contact, LeadAnalysis } from '@/types'

interface LeadAnalysisCardProps {
  message: AutoPilotMessage
  contact?: Contact
  sending: boolean
  onPrompt: (instruction: string, response: string) => void
  onSaved?: () => void
  /** full: cartão completo (respostas antigas). message: só a mensagem pronta. footer: leitura do lead + botões do CRM. */
  variant?: 'full' | 'message' | 'footer'
}

const sectionTitle: Record<Exclude<CommercialResponseSection, 'message' | 'strategy'>, string> = {
  situation: 'Situação',
  reading: 'Leitura do lead',
  action: 'Próxima ação',
  reason: 'Por quê',
  next_step: 'Próximo passo',
}

function Reading({ analysis }: { analysis: LeadAnalysis }) {
  return <section>
    <h3 className="mb-2 text-[13px] font-semibold text-[var(--text-primary)]">{sectionTitle.reading}</h3>
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
      <div><dt className="text-xs text-[var(--text-muted)]">Interesse</dt><dd className="mt-0.5 font-semibold">{analysis.interest}</dd></div>
      <div><dt className="text-xs text-[var(--text-muted)]">Etapa</dt><dd className="mt-0.5">{analysis.stage}</dd></div>
      <div><dt className="text-xs text-[var(--text-muted)]">Objeção</dt><dd className="mt-0.5">{analysis.objection || 'Não identificada'}</dd></div>
      <div><dt className="text-xs text-[var(--text-muted)]">Risco</dt><dd className="mt-0.5">{analysis.risk || 'Não identificado'}</dd></div>
      <div className="sm:col-span-2"><dt className="text-xs text-[var(--text-muted)]">Evidência</dt><dd className="mt-0.5">{analysis.evidence}</dd></div>
    </dl>
  </section>
}

export function LeadAnalysisCard({ message, contact, sending, onPrompt, onSaved, variant = 'full' }: LeadAnalysisCardProps) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const lock = useRef(false)
  const candidate = message.analysis
  if (!candidate) return null
  const analysis: LeadAnalysis = candidate

  const sections = commercialResponseSections(analysis)
  const response = analysis.suggested_message || analysis.summary

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(analysis.suggested_message)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      toast.error('Não foi possível copiar.')
    }
  }

  async function saveSummary() {
    if (!contact || lock.current || saved) return
    lock.current = true
    setSaving(true)
    try {
      await createInteraction({ contact_id: contact.id, type: 'note', content: analysis.summary,
        occurred_at: new Date().toISOString(), metadata: { event: 'summary', analysis_message_id: message.id } })
      setSaved(true)
      toast.success('Resumo salvo no histórico do CRM.')
      onSaved?.()
    } catch (err) {
      if (err instanceof Error && /duplicate key/.test(err.message)) {
        setSaved(true)
        toast.info('Este resumo já está no CRM.')
      } else {
        toast.error(err instanceof Error ? err.message : 'Falha ao salvar resumo.')
      }
    } finally {
      lock.current = false
      setSaving(false)
    }
  }

  function renderSection(section: CommercialResponseSection) {
    if (section === 'reading') return <Reading key={section} analysis={analysis} />
    if (section === 'message') {
      const chip = 'inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50'
      return <section key={section} aria-label="Mensagem pronta" className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-[0_10px_30px_-20px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-4 py-2">
          <span className="inline-flex items-center gap-2 text-[12px] font-semibold text-[var(--text-muted)]"><MessageCircle className="size-3.5 text-emerald-500" />Mensagem para enviar</span>
          <button type="button" onClick={() => void copyMessage()} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[var(--accent-tint)] px-3 text-[12.5px] font-semibold text-[var(--accent-text)] transition hover:brightness-110">
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}{copied ? 'Copiada' : 'Copiar'}
          </button>
        </div>
        <p className="select-text whitespace-pre-wrap px-4 py-4 text-[15px] leading-7 text-[var(--text-primary)]">{analysis.suggested_message}</p>
        <div className="flex flex-wrap items-center gap-0.5 border-t border-[var(--border-subtle)] px-2 py-1.5">
          <button type="button" className={chip} disabled={sending} onClick={() => onPrompt('Escreva outra versão desta mensagem, com palavras diferentes, mantendo os fatos e o objetivo.', response)}><RotateCw className="size-3.5" />Outra versão</button>
          <button type="button" className={chip} disabled={sending} onClick={() => onPrompt('Deixe esta mensagem mais curta, sem perder o objetivo.', response)}>Mais curta</button>
          <button type="button" className={chip} disabled={sending} onClick={() => onPrompt('Reescreva esta mensagem mais natural, como alguém digitando no WhatsApp.', response)}>Mais natural</button>
          <button type="button" className={chip} disabled={sending} onClick={() => onPrompt('Deixe esta mensagem mais direta, sem ser agressiva.', response)}>Mais direta</button>
          {contact && <button type="button" className={`${chip} ml-auto text-emerald-500 hover:text-emerald-400`} onClick={() => setReplyOpen(true)}><MessageCircle className="size-3.5" />Usar no WhatsApp</button>}
        </div>
      </section>
    }
    if (section === 'strategy') return <p key={section} className="text-sm leading-6 text-[var(--text-secondary)]"><strong className="text-[var(--text-primary)]">Estratégia:</strong> {analysis.strategy}</p>

    const content = section === 'situation' ? analysis.summary
      : section === 'action' ? analysis.next_action
        : section === 'reason' ? analysis.reason : analysis.next_step
    return <section key={section}>
      <h3 className="mb-1 text-[13px] font-semibold text-[var(--text-primary)]">{sectionTitle[section]}</h3>
      <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">{content}</p>
    </section>
  }

  const crmButtons = contact && <div className="flex flex-wrap gap-2 border-t border-[var(--border-subtle)] pt-3">
    <Button size="sm" variant="secondary" disabled={saved || !analysis.summary} loading={saving} onClick={() => void saveSummary()}><Save className="size-4" />{saved ? 'Resumo salvo' : 'Salvar resumo no CRM'}</Button>
    <Button size="sm" variant="secondary" onClick={() => setScheduleOpen(true)}><CalendarPlus className="size-4" />Agendar próxima ação</Button>
  </div>
  const scheduleDialog = contact && scheduleOpen && <CommercialTaskDialog input={{ contactId: contact.id, contactName: contact.name, title: analysis.next_action,
    kind: 'follow_up', date: analysis.follow_up_at, description: analysis.evidence }} onClose={() => setScheduleOpen(false)} onSaved={() => onSaved?.()} />
  const replyModal = contact && replyOpen && <SendMessageModal open onClose={() => setReplyOpen(false)} target={{ contact }} initialMessage={analysis.suggested_message} onSent={() => onSaved?.()} />

  if (variant === 'message') {
    if (!analysis.suggested_message.trim()) return null
    return <div className="my-4 break-words">{renderSection('message')}{replyModal}</div>
  }

  if (variant === 'footer') {
    const showReading = analysis.mode !== 'quick_reply'
    if (!showReading && !contact) return null
    return <section aria-label="Leitura do lead" className="mt-4 space-y-3 break-words">
      {showReading && <details className="group rounded-lg border border-[var(--border-subtle)] px-4 py-3">
        <summary className="cursor-pointer select-none text-[13px] font-medium text-[var(--text-secondary)] marker:text-[var(--text-muted)]">Leitura do lead</summary>
        <div className="mt-3"><Reading analysis={analysis} /></div>
      </details>}
      {crmButtons}
      {scheduleDialog}
    </section>
  }

  return <section aria-label="Análise comercial" className="my-3 space-y-5 break-words">
    {sections.map(renderSection)}
    {crmButtons}
    {scheduleDialog}
    {replyModal}
  </section>
}
