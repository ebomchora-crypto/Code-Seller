import { useCallback, useEffect, useRef, useState } from 'react'
import { Bell, BellOff, BellRing, Send, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import { SettingsNote, SettingsSection } from '@/components/settings/SettingsSection'
import { Switch } from '@/components/ui/Switch'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { disablePush, enablePush, getPushStatus, sendTestPush, type PushStatus } from '@/services/supabase/push'
import type { NotificationPreferences } from '@/types'

interface NotificationsSectionProps {
  preferences: NotificationPreferences | null
  loading: boolean
  onSave: (data: Partial<NotificationPreferences>) => Promise<void>
}

type ToggleKey =
  | 'task_reminders'
  | 'daily_summary'
  | 'overdue_tasks'
  | 'stalled_deals'
  | 'financial_alerts'
  | 'weekly_summary'
  | 'deal_updates'
  | 'contact_updates'

// Padrão de cada aviso quando a preferência ainda não foi salva.
const DEFAULTS: Record<ToggleKey, boolean> = {
  task_reminders: true,
  daily_summary: true,
  overdue_tasks: true,
  stalled_deals: true,
  financial_alerts: true,
  weekly_summary: false,
  deal_updates: true,
  contact_updates: false,
}

const TOGGLES: { key: ToggleKey; label: string; description: string; soon?: boolean }[] = [
  { key: 'task_reminders', label: 'Lembretes de tarefas', description: 'Aviso no horário do lembrete que você definiu na tarefa' },
  { key: 'daily_summary', label: 'Resumo diário', description: 'Todo dia, no horário escolhido, o que precisa de você hoje' },
  { key: 'overdue_tasks', label: 'Tarefas do dia e atrasadas', description: 'Entram no resumo diário' },
  { key: 'stalled_deals', label: 'Negócios parados', description: 'Negócios sem atividade há 10 dias ou mais, no resumo diário' },
  { key: 'financial_alerts', label: 'Valores a receber', description: 'Cobranças dos próximos 7 dias, no resumo diário' },
  { key: 'weekly_summary', label: 'Resumo semanal', description: 'Toda segunda: vendas, contatos novos e tarefas concluídas na semana' },
  { key: 'deal_updates', label: 'Atualizações de negócios', description: 'Mudanças no pipeline', soon: true },
  { key: 'contact_updates', label: 'Atualizações de contatos', description: 'Novos contatos adicionados', soon: true },
]

const DEBOUNCE_MS = 500

const STATUS_TEXT: Record<PushStatus, string> = {
  unsupported: 'Este navegador não aceita notificações.',
  'ios-needs-install':
    'No iPhone, as notificações só funcionam com o app na Tela de Início: toque em Compartilhar → "Adicionar à Tela de Início", abra por lá e ative aqui.',
  'not-configured': 'As notificações ainda estão sendo ativadas no servidor.',
  denied: 'As notificações foram bloqueadas neste navegador. Libere nas configurações do site e tente de novo.',
  off: 'Desativadas neste aparelho.',
  on: 'Ativadas neste aparelho.',
}

function DeviceCard() {
  const [status, setStatus] = useState<PushStatus | null>(null)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(() => {
    getPushStatus()
      .then(setStatus)
      .catch(() => setStatus('unsupported'))
  }, [])

  useEffect(refresh, [refresh])

  async function handleEnable() {
    setBusy(true)
    try {
      const next = await enablePush()
      setStatus(next)
      if (next === 'on') toast.success('Notificações ativadas neste aparelho.')
    } catch {
      toast.error('Não foi possível ativar as notificações.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDisable() {
    setBusy(true)
    try {
      await disablePush()
      setStatus('off')
    } catch {
      toast.error('Não foi possível desativar.')
    } finally {
      setBusy(false)
    }
  }

  async function handleTest() {
    setBusy(true)
    try {
      const delivered = await sendTestPush()
      if (delivered > 0) toast.success('Teste enviado. Deve chegar em alguns segundos.')
      else toast.error('Nenhum aparelho recebeu o teste. Tente desativar e ativar de novo.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível enviar o teste.')
    } finally {
      setBusy(false)
    }
  }

  const on = status === 'on'
  const Icon = on ? BellRing : status === 'denied' ? BellOff : Smartphone

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[var(--border-default)] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
            on ? 'bg-emerald-500/10 text-emerald-500' : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'
          }`}
        >
          <Icon className="size-[18px]" />
        </span>
        <div>
          <p className="text-[14px] font-medium text-[var(--text-primary)]">Notificações neste aparelho</p>
          {status === null ? (
            <Skeleton className="mt-1.5 h-3.5 w-48" />
          ) : (
            <p className="mt-0.5 max-w-md text-[12.5px] text-[var(--text-muted)]">{STATUS_TEXT[status]}</p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        {on ? (
          <>
            <Button variant="secondary" size="sm" className="rounded-full" onClick={() => void handleTest()} disabled={busy}>
              <Send className="size-3.5" />
              Enviar teste
            </Button>
            <Button variant="ghost" size="sm" className="rounded-full" onClick={() => void handleDisable()} disabled={busy}>
              Desativar
            </Button>
          </>
        ) : (
          <Button size="sm" className="rounded-full" onClick={() => void handleEnable()} loading={busy} disabled={status !== 'off'}>
            Ativar notificações
          </Button>
        )}
      </div>
    </div>
  )
}

export function NotificationsSection({ preferences, loading, onSave }: NotificationsSectionProps) {
  const [localValues, setLocalValues] = useState<Partial<Record<ToggleKey | 'daily_summary_hour', boolean | number>>>({})
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (preferences) setLocalValues({})
  }, [preferences])

  function valueFor(key: ToggleKey): boolean {
    if (key in localValues) return Boolean(localValues[key])
    return preferences?.[key] ?? DEFAULTS[key]
  }

  const summaryHour = Number(localValues.daily_summary_hour ?? preferences?.daily_summary_hour ?? 8)

  function save(key: ToggleKey | 'daily_summary_hour', value: boolean | number) {
    setLocalValues((current) => ({ ...current, [key]: value }))
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void onSave({ [key]: value })
    }, DEBOUNCE_MS)
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return (
    <SettingsSection id="notificações" icon={Bell} title="Notificações" description="Escolha o que merece um aviso seu.">
      <DeviceCard />

      <div className="mt-4">
        <SettingsNote>
          Os avisos chegam como notificação em cada celular ou computador em que você ativar acima. Os lembretes de tarefas
          também continuam aparecendo dentro do app.
        </SettingsNote>
      </div>

      <div className="mt-4 divide-y divide-[var(--border-subtle)]">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="my-3 h-10 w-full" />)
          : TOGGLES.map((toggle) => (
              <div key={toggle.key} className="flex items-center justify-between gap-4 py-4">
                <div className={toggle.soon ? 'opacity-60' : undefined}>
                  <span className="flex items-center gap-2 text-[14px] font-medium text-[var(--text-primary)]">
                    {toggle.label}
                    {toggle.soon && (
                      <span className="rounded-full bg-[var(--bg-muted)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-muted)]">
                        Em breve
                      </span>
                    )}
                  </span>
                  <span className="block text-[12.5px] text-[var(--text-muted)]">{toggle.description}</span>
                </div>
                <div className="flex items-center gap-3">
                  {toggle.key === 'daily_summary' && valueFor('daily_summary') && (
                    <select
                      aria-label="Horário do resumo diário"
                      value={summaryHour}
                      onChange={(event) => save('daily_summary_hour', Number(event.target.value))}
                      className="h-8 rounded-lg border border-[var(--border-default)] bg-[var(--field-bg)] px-2 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--accent-ring)]"
                    >
                      {Array.from({ length: 24 }).map((_, hour) => (
                        <option key={hour} value={hour}>
                          {String(hour).padStart(2, '0')}h
                        </option>
                      ))}
                    </select>
                  )}
                  <Switch
                      checked={toggle.soon ? false : valueFor(toggle.key)}
                      onChange={(checked) => save(toggle.key, checked)}
                      ariaLabel={toggle.label}
                      disabled={toggle.soon}
                    />
                </div>
              </div>
            ))}
      </div>
    </SettingsSection>
  )
}
