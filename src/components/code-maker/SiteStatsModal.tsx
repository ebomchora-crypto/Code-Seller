import { useEffect, useState } from 'react'
import { Eye, Mail, MessageCircle, Phone, UserPlus } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { getSiteStats, type SiteStats } from '@/services/supabase/codeMaker'

const PERIODS = [
  { days: 7, label: '7 dias' },
  { days: 30, label: '30 dias' },
]

function Tile({ icon: Icon, label, value }: { icon: typeof Eye; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-muted)]/40 px-3.5 py-3">
      <p className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]">
        <Icon className="size-3.5" /> {label}
      </p>
      <p className="mt-1 font-display text-[24px] font-semibold leading-none tracking-tight text-[var(--text-primary)]">{value.toLocaleString('pt-BR')}</p>
    </div>
  )
}

function List({ title, rows }: { title: string; rows: { name: string; n: number }[] }) {
  const max = Math.max(1, ...rows.map((row) => row.n))
  return (
    <div>
      <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{title}</p>
      {rows.length === 0 ? (
        <p className="text-[13px] text-[var(--text-muted)]">Ainda sem dados.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {rows.map((row) => (
            <li key={row.name} className="relative overflow-hidden rounded-lg px-2.5 py-1.5 text-[13px] text-[var(--text-secondary)]">
              <span className="absolute inset-y-0 left-0 bg-[var(--accent-tint)]" style={{ width: `${(row.n / max) * 100}%` }} aria-hidden />
              <span className="relative flex justify-between gap-3">
                <span className="truncate">{row.name}</span>
                <span className="tabular-nums text-[var(--text-muted)]">{row.n}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Números do site publicado: visitas, cliques de contato e contatos recebidos no CRM.
export function SiteStatsModal({ siteId, siteName, open, onClose }: { siteId: string; siteName: string; open: boolean; onClose: () => void }) {
  const [days, setDays] = useState(7)
  const [stats, setStats] = useState<SiteStats | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setState('loading')
    getSiteStats(siteId, days)
      .then((data) => {
        if (cancelled) return
        setStats(data)
        setState(data ? 'ready' : 'error')
      })
      .catch(() => !cancelled && setState('error'))
    return () => {
      cancelled = true
    }
  }, [open, siteId, days])

  const peak = Math.max(1, ...(stats?.daily.map((day) => day.views) ?? [1]))
  const clicks = stats ? stats.totals.whatsapp + stats.totals.phone + stats.totals.email : 0

  return (
    <Modal open={open} onClose={onClose} title={`Estatísticas · ${siteName}`} size="md">
      <div className="flex flex-col gap-5">
        <div className="flex gap-1 self-start rounded-xl bg-[var(--bg-muted)] p-1" role="tablist">
          {PERIODS.map((period) => (
            <button
              key={period.days}
              type="button"
              role="tab"
              aria-selected={days === period.days}
              onClick={() => setDays(period.days)}
              className={`rounded-lg px-3 py-1 text-[12.5px] font-semibold transition ${days === period.days ? 'bg-[var(--panel-bg)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}
            >
              {period.label}
            </button>
          ))}
        </div>

        {state === 'loading' && <p className="py-8 text-center text-[13px] text-[var(--text-muted)]">Carregando…</p>}
        {state === 'error' && <p className="py-8 text-center text-[13px] text-[var(--text-muted)]">Não foi possível carregar os números agora.</p>}

        {state === 'ready' && stats && (
          <>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <Tile icon={Eye} label="Visitas" value={stats.totals.views} />
              <Tile icon={MessageCircle} label="WhatsApp" value={stats.totals.whatsapp} />
              <Tile icon={UserPlus} label="Contatos no CRM" value={stats.totals.leads} />
              <Tile icon={Phone} label="Telefone / e-mail" value={stats.totals.phone + stats.totals.email} />
            </div>
            {clicks + stats.totals.leads > 0 && stats.totals.views > 0 && (
              <p className="text-[13px] text-[var(--text-secondary)]">
                De cada 100 visitas, {Math.round(((clicks + stats.totals.leads) / stats.totals.views) * 100)} viraram um clique de contato ou um contato no CRM.
              </p>
            )}

            <div>
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Visitas por dia</p>
              <div className="flex h-24 items-end gap-1" role="img" aria-label="Gráfico de visitas por dia">
                {stats.daily.map((day) => (
                  <div key={day.day} className="group relative flex h-full min-w-0 flex-1 items-end" title={`${day.day.split('-').reverse().slice(0, 2).join('/')}: ${day.views}`}>
                    <div className="w-full rounded-t-md bg-[linear-gradient(180deg,#8b5cf6,#6d28d9)] opacity-90" style={{ height: `${Math.max(day.views ? 6 : 2, (day.views / peak) * 100)}%` }} />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <List title="De onde vêm" rows={stats.refs} />
              <List title="Páginas mais vistas" rows={stats.pages.map((page) => ({ name: page.name ? `/${page.name}` : 'Início', n: page.n }))} />
            </div>
            <p className="flex items-center gap-1.5 text-[11.5px] text-[var(--text-muted)]">
              <Mail className="size-3" /> As contagens começam a valer a partir de agora; os dias anteriores aparecem como zero.
            </p>
          </>
        )}
      </div>
    </Modal>
  )
}
