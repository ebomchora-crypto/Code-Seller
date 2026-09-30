import { useRef, useState } from 'react'
import { BriefcaseBusiness, CalendarPlus, CircleHelp, Copy, MessageCircle, MoveRight, RotateCw, Save, Scissors, Sparkles } from 'lucide-react'
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

export function LeadAnalysisCard({ message, contact, sending, onPrompt, onSaved }: LeadAnalysisCardProps) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const lock = useRef(false)
  const candidate = message.analysis
  if (!candidate) return null
  const analysis: LeadAnalysis = candidate

  const sections = commercialResponseSections(analysis)
  const response = analysis.suggested_message || analysis.summary

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(analysis.suggested_message)
      toast.success('Mensagem copiada.')
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
    if (section === 'message') return <section key={section} aria-label="Mensagem pronta" className="rounded-lg border border-[var(--accent-ring)] bg-[var(--accent-tint)] p-4 sm:p-5">
      <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">Mensagem pronta</h3>
      <p className="mt-3 select-text whitespace-pre-wrap text-[14.5px] leading-7 text-[var(--text-primary)]">{analysis.suggested_message}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        <Button size="sm" onClick={() => void copyMessage()}><Copy className="size-4" />Copiar mensagem</Button>
        <Button size="sm" variant="secondary" disabled={sending} onClick={() => onPrompt('Gere outra versão desta mensagem, preservando os fatos e o objetivo comercial.', response)}><RotateCw className="size-4" />Gerar outra</Button>
        <Button size="sm" variant="secondary" disabled={sending} onClick={() => onPrompt('Deixe esta mensagem mais curta, sem perder o objetivo comercial.', response)}><Scissors className="size-4" />Mais curta</Button>
        <Button size="sm" variant="secondary" disabled={sending} onClick={() => onPrompt('Reescreva esta mensagem de forma mais natural para WhatsApp.', response)}><Sparkles className="size-4" />Mais natural</Button>
        <Button size="sm" variant="secondary" disabled={sending} onClick={() => onPrompt('Reescreva esta mensagem com tom mais profissional, sem ficar rígida.', response)}><BriefcaseBusiness className="size-4" />Mais profissional</Button>
        <Button size="sm" variant="secondary" disabled={sending} onClick={() => onPrompt('Deixe esta mensagem mais direta e objetiva, sem ser agressiva.', response)}><MoveRight className="size-4" />Mais direta</Button>
        <Button size="sm" variant="secondary" disabled={sending} onClick={() => onPrompt('Explique em poucas linhas a estratégia comercial desta mensagem e o resultado esperado.', response)}><CircleHelp className="size-4" />Explicar estratégia</Button>
        {contact && <Button size="sm" variant="secondary" onClick={() => setReplyOpen(true)}><MessageCircle className="size-4" />Usar no WhatsApp</Button>}
      </div>
    </section>
    if (section === 'strategy') return <p key={section} className="text-sm leading-6 text-[var(--text-secondary)]"><strong className="text-[var(--text-primary)]">Estratégia:</strong> {analysis.strategy}</p>

    const content = section === 'situation' ? analysis.summary
      : section === 'action' ? analysis.next_action
        : section === 'reason' ? analysis.reason : analysis.next_step
    return <section key={section}>
      <h3 className="mb-1 text-[13px] font-semibold text-[var(--text-primary)]">{sectionTitle[section]}</h3>
      <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">{content}</p>
    </section>
  }

  return <section aria-label="Análise comercial" className="my-3 space-y-5 break-words">
    {sections.map(renderSection)}
    {contact && <div className="flex flex-wrap gap-2 border-t border-[var(--border-subtle)] pt-3">
      <Button size="sm" variant="secondary" disabled={saved || !analysis.summary} loading={saving} onClick={() => void saveSummary()}><Save className="size-4" />{saved ? 'Resumo salvo' : 'Salvar resumo no CRM'}</Button>
      <Button size="sm" variant="secondary" onClick={() => setScheduleOpen(true)}><CalendarPlus className="size-4" />Agendar próxima ação</Button>
    </div>}
    {contact && scheduleOpen && <CommercialTaskDialog input={{ contactId: contact.id, contactName: contact.name, title: analysis.next_action,
      kind: 'follow_up', date: analysis.follow_up_at, description: analysis.evidence }} onClose={() => setScheduleOpen(false)} onSaved={() => onSaved?.()} />}
    {contact && replyOpen && <SendMessageModal open onClose={() => setReplyOpen(false)} target={{ contact }} initialMessage={analysis.suggested_message} onSent={() => onSaved?.()} />}
  </section>
}
