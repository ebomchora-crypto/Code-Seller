import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { CalendarClock, Pause, Play, Repeat, Trash2, XCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { PanelHeader } from '@/components/ui/PanelHeader'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { deleteSubscription, getSubscriptions, setSubscriptionStatus } from '@/services/supabase/subscriptions'
import { formatMoney } from '@/utils/currency'
import { PAYMENT_METHOD_LABELS } from '@/utils/financial'
import { localDay } from '@/utils/saleDate'
import { SUBSCRIPTION_STATUS_LABELS, chargesLeft, contractTotal, durationLabel, lastChargeDate, nextChargeDate } from '@/utils/subscriptions'
import type { ClientSubscription, SubscriptionStatus } from '@/types'

interface SubscriptionCardProps {
  dealId?: string
  contactId?: string
  /** Muda quando o cadastro foi salvo: recarrega a mensalidade. */
  refreshKey?: string
  /** Abre o formulário de edição (a mensalidade se cadastra lá). */
  onEdit?: () => void
}

const formatDay = (day: string) => day.split('-').reverse().join('/')

const STATUS_STYLE: Record<SubscriptionStatus, string> = {
  active: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400',
  paused: 'bg-amber-500/12 text-amber-600 dark:text-amber-400',
  canceled: 'bg-[var(--bg-muted)] text-[var(--text-muted)]',
}

// Mensalidades do negócio ou do contato: valor, datas, prazo e o que fazer (pausar, cancelar…).
export function SubscriptionCard({ dealId, contactId, refreshKey, onEdit }: SubscriptionCardProps) {
  const [items, setItems] = useState<ClientSubscription[] | null>(null)
  const [confirm, setConfirm] = useState<{ item: ClientSubscription; kind: 'cancel' | 'delete' } | null>(null)
  const [busy, setBusy] = useState(false)
  const today = localDay(new Date())

  const load = useCallback(async () => {
    try {
      setItems(await getSubscriptions({ dealId, contactId }))
    } catch {
      setItems([])
    }
  }, [dealId, contactId])

  useEffect(() => {
    void load()
  }, [load, refreshKey])

  async function change(item: ClientSubscription, status: SubscriptionStatus) {
    setBusy(true)
    try {
      await setSubscriptionStatus(item.id, status)
      toast.success(status === 'active' ? 'Mensalidade retomada. As cobranças voltam ao Financeiro.' : status === 'paused' ? 'Mensalidade pausada. As próximas cobranças saem do "A receber".' : 'Mensalidade cancelada.')
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível alterar a mensalidade.')
    } finally {
      setBusy(false)
    }
  }

  async function remove(item: ClientSubscription) {
    setBusy(true)
    try {
      await deleteSubscription(item.id)
      toast.success('Mensalidade excluída.')
      setConfirm(null)
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível excluir a mensalidade.')
    } finally {
      setBusy(false)
    }
  }

  const visible = (items ?? []).filter((item) => item.status !== 'canceled' || contactId)

  return (
    <Card>
      <PanelHeader title="Mensalidade" subtitle={dealId ? 'Cobrada todo mês neste negócio' : 'Cobrada todo mês deste cliente'} />
      {items === null ? (
        <p className="text-[13.5px] text-[var(--text-muted)]">Carregando…</p>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-[13.5px] leading-relaxed text-[var(--text-muted)]">Sem mensalidade cadastrada. Se você cobra manutenção, hospedagem ou gestão todo mês, cadastre aqui: as cobranças aparecem sozinhas no Financeiro.</p>
          {onEdit && (
            <Button size="sm" variant="secondary" onClick={onEdit}>
              <Repeat className="size-3.5" /> Cadastrar mensalidade
            </Button>
          )}
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {visible.map((item) => {
            const next = item.status === 'active' ? nextChargeDate(item, today) : null
            const left = chargesLeft(item, today)
            const last = lastChargeDate(item)
            const total = contractTotal(item)
            return (
              <li key={item.id} className="flex flex-col gap-3 rounded-2xl border border-[var(--border-default)] p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-[var(--text-primary)]">{item.title}</p>
                    <p className="font-display text-[22px] font-semibold leading-tight tracking-tight text-[var(--text-primary)]">
                      {formatMoney(item.amount, item.currency)}
                      <span className="text-[13px] font-normal text-[var(--text-muted)]"> /mês</span>
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${STATUS_STYLE[item.status]}`}>{SUBSCRIPTION_STATUS_LABELS[item.status]}</span>
                </div>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[13px]">
                  <Row label="Primeira cobrança" value={formatDay(item.start_date)} />
                  <Row label="Próxima cobrança" value={next ? formatDay(next) : item.status === 'active' ? 'Contrato encerrado' : '—'} icon />
                  <Row label="Duração" value={durationLabel(item.months)} />
                  <Row label="Faltam" value={left === null ? 'Sem prazo' : left === 0 ? 'Nenhuma' : `${left} ${left === 1 ? 'cobrança' : 'cobranças'}`} />
                  {last && <Row label="Termina em" value={formatDay(last)} />}
                  {total !== null && <Row label="Total do contrato" value={formatMoney(total, item.currency)} />}
                  {item.payment_method && <Row label="Como cobra" value={PAYMENT_METHOD_LABELS[item.payment_method]} />}
                </dl>

                {item.notes && <p className="text-[12.5px] leading-relaxed text-[var(--text-muted)]">{item.notes}</p>}
                {contactId && item.deal && (
                  <Link to={`/deals/${item.deal.id}`} className="text-[12.5px] font-medium text-[var(--accent-text)] hover:underline">
                    Do negócio: {item.deal.title}
                  </Link>
                )}

                <div className="flex flex-wrap gap-2">
                  {item.status === 'active' && (
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => void change(item, 'paused')}>
                      <Pause className="size-3.5" /> Pausar
                    </Button>
                  )}
                  {item.status !== 'active' && (
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => void change(item, 'active')}>
                      <Play className="size-3.5" /> {item.status === 'paused' ? 'Retomar' : 'Reativar'}
                    </Button>
                  )}
                  {item.status !== 'canceled' && (
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => setConfirm({ item, kind: 'cancel' })}>
                      <XCircle className="size-3.5" /> Cancelar
                    </Button>
                  )}
                  {onEdit && (
                    <Button size="sm" variant="ghost" disabled={busy} onClick={onEdit}>
                      Editar
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => setConfirm({ item, kind: 'delete' })} aria-label="Excluir mensalidade">
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.kind === 'delete' ? 'Excluir mensalidade?' : 'Cancelar mensalidade?'}
        message={
          confirm?.kind === 'delete'
            ? 'Some do cadastro e as cobranças que ainda não foram pagas continuam no Financeiro, sem ligação com ela. Para parar de cobrar, prefira cancelar.'
            : 'As próximas cobranças saem do "A receber". O que já foi pago continua no Financeiro. Dá para reativar depois.'
        }
        confirmLabel={confirm?.kind === 'delete' ? 'Excluir' : 'Cancelar mensalidade'}
        loading={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (!confirm) return
          if (confirm.kind === 'delete') void remove(confirm.item)
          else void change(confirm.item, 'canceled').then(() => setConfirm(null))
        }}
      />
    </Card>
  )
}

function Row({ label, value, icon = false }: { label: string; value: string; icon?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11.5px] text-[var(--text-muted)]">{label}</dt>
      <dd className="mt-0.5 flex items-center gap-1 break-words text-[13.5px] font-medium text-[var(--text-primary)]">
        {icon && <CalendarClock className="size-3.5 text-[var(--accent-text)]" />}
        {value}
      </dd>
    </div>
  )
}
