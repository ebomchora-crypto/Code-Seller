import { useRef, useState } from 'react'
import { CalendarPlus, Copy, MessageCircle, RotateCw, Save, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { SendMessageModal } from '@/components/messages/SendMessageModal'
import { CommercialTaskDialog } from './CommercialTaskDialog'
import { createInteraction } from '@/services/supabase/interactions'
import type { AutoPilotMessage, Contact } from '@/types'

export function LeadAnalysisCard({ message, contact, sending, onPrompt, onSaved }: {
  message: AutoPilotMessage; contact: Contact; sending: boolean;
  onPrompt: (instruction: string, response: string) => void; onSaved: () => void
}) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const lock = useRef(false)
  const analysis = message.analysis
  if (!analysis) return null
  async function saveSummary() {
    if (!analysis || lock.current || saved) return
    lock.current = true; setSaving(true)
    try {
      await createInteraction({ contact_id: contact.id, type: 'note', content: analysis.summary,
        occurred_at: new Date().toISOString(), metadata: { event: 'summary', analysis_message_id: message.id } })
      setSaved(true); toast.success('Resumo salvo no histórico do CRM.'); onSaved()
    } catch (err) {
      if (err instanceof Error && /duplicate key/.test(err.message)) { setSaved(true); toast.info('Este resumo já está no CRM.') }
      else toast.error(err instanceof Error ? err.message : 'Falha ao salvar resumo.')
    } finally { lock.current = false; setSaving(false) }
  }
  const response = analysis.suggested_message || analysis.summary
  return <section aria-label="Análise da negociação" className="my-3 space-y-3 break-words border-l-2 border-emerald-500/60 pl-4">
    <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
      <div><dt className="text-[var(--text-muted)]">Interesse aparente</dt><dd className="font-semibold">{analysis.interest}</dd></div>
      <div><dt className="text-[var(--text-muted)]">Etapa sugerida</dt><dd>{analysis.stage}</dd></div>
      <div className="sm:col-span-2"><dt className="text-[var(--text-muted)]">Evidência</dt><dd>{analysis.evidence}</dd></div>
      <div className="sm:col-span-2"><dt className="text-[var(--text-muted)]">Objeção</dt><dd>{analysis.objection || 'Não identificada'}</dd></div>
    </dl>
    <p className="whitespace-pre-wrap text-sm leading-6">{analysis.summary}</p>
    <div className="text-sm"><p className="font-semibold">Próxima ação recomendada</p><p>{analysis.next_action}</p></div>
    {analysis.suggested_message && <div className="border-y border-[var(--border-subtle)] py-3">
      <p className="mb-2 text-xs font-medium text-[var(--text-muted)]">Resposta sugerida</p>
      <p className="whitespace-pre-wrap text-sm leading-6">{analysis.suggested_message}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" title="Copiar resposta" aria-label="Copiar resposta" onClick={() => {
          void navigator.clipboard.writeText(analysis.suggested_message).then(() => toast.success('Resposta copiada.')).catch(() => toast.error('Não foi possível copiar.'))
        }}><Copy className="size-4" /></Button>
        <Button size="sm" onClick={() => setReplyOpen(true)}><MessageCircle className="size-4" />Enviar</Button>
        <Button size="sm" variant="secondary" disabled={sending} onClick={() => onPrompt('Gere outra resposta para este lead.', response)}><RotateCw className="size-4" />Gerar outra</Button>
        <Button size="sm" variant="secondary" disabled={sending} onClick={() => onPrompt('Responda diretamente sobre o preço. Use somente o valor e escopo registrados; se não houver, pergunte o que falta, sem inventar.', response)}><Wallet className="size-4" />Passar preço</Button>
      </div>
    </div>}
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="secondary" disabled={saved || !analysis.summary} loading={saving} onClick={() => void saveSummary()}><Save className="size-4" />{saved ? 'Resumo salvo' : 'Salvar resumo no CRM'}</Button>
      <Button size="sm" variant="secondary" onClick={() => setScheduleOpen(true)}><CalendarPlus className="size-4" />Agendar próxima ação</Button>
    </div>
    {scheduleOpen && <CommercialTaskDialog input={{ contactId: contact.id, contactName: contact.name, title: analysis.next_action,
      kind: 'follow_up', date: analysis.follow_up_at, description: analysis.evidence }} onClose={() => setScheduleOpen(false)} onSaved={onSaved} />}
    {replyOpen && <SendMessageModal open onClose={() => setReplyOpen(false)} target={{ contact }} initialMessage={analysis.suggested_message} onSent={onSaved} />}
  </section>
}
