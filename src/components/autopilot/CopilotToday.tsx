import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, Check, Clock, RefreshCw, Search, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { getCommercialOverview, scheduleCommercialTask } from '@/services/supabase/copilotCRM'
import { completeTask } from '@/services/supabase/tasks'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { CommercialTaskDialog, type CommercialTaskInput } from './CommercialTaskDialog'
import type { AttentionItem, AttentionKind } from '@/utils/copilotCRM'
import type { Contact } from '@/types'

const labels: Record<AttentionKind, string> = {
  follow_up: 'Follow-ups', reply: 'Esperando sua resposta', meeting: 'Reuniões hoje',
  prototype: 'Protótipos aguardando retorno', waiting: 'Aguardando resposta', inactive: 'Sem contato há mais de 3 dias', next_action: 'Outras ações',
}
export function CopilotToday() {
  const [items, setItems] = useState<AttentionItem[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<AttentionKind | 'all'>('all')
  const [search, setSearch] = useState('')
  const [schedule, setSchedule] = useState<CommercialTaskInput | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const lock = useRef(false)
  const version = useRef(0)
  const load = useCallback(async () => {
    const request = ++version.current
    setLoading(true); setError(null)
    try {
      const result = await getCommercialOverview()
      if (version.current === request) { setItems(result.items); setContacts(result.contacts) }
    } catch (err) { if (version.current === request) setError(err instanceof Error ? err.message : 'Não foi possível carregar as pendências.') }
    finally { if (version.current === request) setLoading(false) }
  }, [])
  useEffect(() => {
    void load()
    const refresh = () => { if (document.visibilityState === 'visible') void load() }
    document.addEventListener('visibilitychange', refresh)
    return () => { version.current++; document.removeEventListener('visibilitychange', refresh) }
  }, [load])
  async function done(item: AttentionItem) {
    if (lock.current) return
    lock.current = true; setBusy(item.id)
    try {
      if (item.task) await completeTask(item.task.id)
      else await scheduleCommercialTask({ contactId: item.contact.id, title: item.title, description: item.reason,
        kind: 'next_action', dueDate: null, sourceKey: item.id, done: true })
      toast.success('Ação marcada como realizada.'); await load()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Falha ao concluir ação.') }
    finally { lock.current = false; setBusy(null) }
  }
  const visible = items.filter((item) => (filter === 'all' || item.kind === filter) && (item.contact.name + ' ' + item.title).toLocaleLowerCase().includes(search.toLocaleLowerCase()))
  const matches = search.trim() ? contacts.filter((contact) => contact.name.toLocaleLowerCase().includes(search.toLocaleLowerCase())).slice(0, 10) : []
  return <div data-lenis-prevent className="h-full overflow-y-auto">
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-xl font-semibold text-[var(--text-primary)]">CS Copilot · Hoje</h1><p className="mt-1 text-sm text-[var(--text-muted)]">{new Date().toLocaleDateString('pt-BR', {weekday:'long', day:'numeric', month:'long'})}</p></div>
        <Button size="sm" variant="secondary" onClick={() => void load()} disabled={loading} title="Atualizar pendências" aria-label="Atualizar pendências"><RefreshCw className="size-4" /></Button>
      </div>
      <h2 className="mt-7 text-base font-semibold">Precisa da sua atenção</h2>
      <div className="mt-3 grid grid-cols-2 border-y border-[var(--border-subtle)] sm:grid-cols-3 lg:grid-cols-4">
        {(Object.keys(labels) as AttentionKind[]).map((kind) => <button type="button" key={kind} aria-pressed={filter === kind} onClick={() => setFilter(filter === kind ? 'all' : kind)}
          className={'min-h-24 border-b border-[var(--border-subtle)] p-3 text-left transition hover:bg-[var(--bg-muted)] ' + (filter === kind ? 'bg-[var(--accent-tint)]' : '')}>
          <span className={'block text-2xl font-semibold tabular-nums ' + (kind === 'reply' ? 'text-amber-500' : kind === 'meeting' ? 'text-sky-500' : 'text-emerald-500')}>{loading ? '…' : items.filter((item) => item.kind === kind).length}</span>
          <span className="mt-1 block text-xs leading-5 text-[var(--text-secondary)]">{labels[kind]}</span>
        </button>)}
      </div>
      <div className="relative my-5"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-[var(--text-muted)]" /><input aria-label="Buscar lead" placeholder="Buscar lead" value={search} onChange={(event) => setSearch(event.target.value)} className="h-10 w-full rounded-lg border border-[var(--border-default)] bg-[var(--field-bg)] pl-9 pr-3 text-sm" /></div>
      {matches.length > 0 && <div className="mb-5 flex flex-wrap gap-2">{matches.map((contact) => <Link key={contact.id} to={'/copilot?contact=' + contact.id} className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm"><Sparkles className="size-4 text-emerald-500" />{contact.name}<ArrowRight className="size-3" /></Link>)}</div>}
      {error && <div role="alert" className="py-6 text-sm text-red-500">{error}<Button variant="secondary" className="ml-3" onClick={() => void load()}>Tentar novamente</Button></div>}
      {loading && <div className="flex justify-center py-10"><Spinner /></div>}
      {!loading && !error && visible.length === 0 && <div className="py-10 text-center text-sm text-[var(--text-muted)]"><Check className="mx-auto mb-3 size-6 text-emerald-500" />Nenhuma pendência neste filtro.</div>}
      {!loading && !error && <ul className="divide-y divide-[var(--border-subtle)]">{visible.map((item) => <li key={item.id} className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
        <Link className="min-w-0 flex-1" to={'/copilot?contact=' + item.contact.id}>
          <p className="break-words text-sm font-semibold">{item.contact.name}</p>
          <p className="mt-1 text-sm">{item.title}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{item.reason} · {new Date(item.occurred_at).toLocaleString('pt-BR')}</p>
        </Link>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link to={'/copilot?contact=' + item.contact.id + '&intent=' + (item.kind === 'meeting' ? 'meeting' : item.kind === 'reply' ? 'analyze' : 'follow_up')}
            className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[var(--border-default)] px-3 text-xs font-medium text-[var(--text-primary)]">
            {item.kind === 'meeting' ? <CalendarDays className="size-4 text-sky-500" /> : <Sparkles className="size-4 text-emerald-500" />}
            {item.kind === 'meeting' ? 'Preparar reunião' : item.kind === 'reply' ? 'Responder' : 'Gerar follow-up'}
          </Link>
          <Button size="sm" variant="ghost" disabled={busy !== null} aria-label={'Marcar como realizado: ' + item.contact.name + ' ' + item.title} title="Marcar como realizado" onClick={() => void done(item)}><Check className="size-4" /></Button>
          <Button size="sm" variant="ghost" aria-label={'Adiar: ' + item.contact.name + ' ' + item.title} title="Adiar" onClick={() => setSchedule({
            contactId: item.contact.id, contactName: item.contact.name, title: item.title, description: item.reason,
            kind: item.kind === 'meeting' ? 'meeting' : 'follow_up', sourceKey: item.task ? undefined : item.id, task: item.task,
          })}><Clock className="size-4" /></Button>
        </div>
      </li>)}</ul>}
    </div>
    {schedule && <CommercialTaskDialog input={schedule} onClose={() => setSchedule(null)} onSaved={load} />}
  </div>
}
