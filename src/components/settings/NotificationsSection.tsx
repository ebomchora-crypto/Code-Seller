import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { SettingsNote, SettingsSection } from '@/components/settings/SettingsSection'
import { Switch } from '@/components/ui/Switch'
import { Skeleton } from '@/components/ui/Skeleton'
import type { NotificationPreferences } from '@/types'

interface NotificationsSectionProps {
  preferences: NotificationPreferences | null
  loading: boolean
  onSave: (data: Partial<NotificationPreferences>) => Promise<void>
}

type ToggleKey = Exclude<keyof NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>

const TOGGLES: { key: ToggleKey; label: string; description: string }[] = [
  { key: 'task_reminders', label: 'Lembretes de tarefas', description: 'Receba avisos quando uma tarefa estiver próxima do vencimento' },
  { key: 'deal_updates', label: 'Atualizações de negócios', description: 'Seja notificado sobre mudanças no pipeline' },
  { key: 'contact_updates', label: 'Atualizações de contatos', description: 'Avisos sobre novos contatos adicionados' },
  { key: 'financial_alerts', label: 'Alertas financeiros', description: 'Contas a receber vencidas e pagamentos registrados' },
  { key: 'overdue_tasks', label: 'Tarefas vencidas', description: 'Aviso diário de tarefas não concluídas no prazo' },
  { key: 'stalled_deals', label: 'Negócios parados', description: 'Alerta sobre deals sem atividade há mais de 7 dias' },
  { key: 'weekly_summary', label: 'Resumo semanal', description: 'Receba um resumo do seu negócio toda segunda-feira' },
]

const DEBOUNCE_MS = 500

export function NotificationsSection({ preferences, loading, onSave }: NotificationsSectionProps) {
  const [localValues, setLocalValues] = useState<Partial<Record<ToggleKey, boolean>>>({})
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (preferences) setLocalValues({})
  }, [preferences])

  function valueFor(key: ToggleKey): boolean {
    if (key in localValues) return Boolean(localValues[key])
    return Boolean(preferences?.[key])
  }

  function handleToggle(key: ToggleKey, checked: boolean) {
    setLocalValues((current) => ({ ...current, [key]: checked }))

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void onSave({ [key]: checked })
    }, DEBOUNCE_MS)
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return (
    <SettingsSection id="notificações" icon={Bell} title="Notificações" description="Escolha o que merece um aviso seu.">
      <SettingsNote>
        Avisos por e-mail e no celular chegam em breve. Por enquanto, os lembretes de tarefas aparecem dentro do app.
      </SettingsNote>

      <div className="mt-4 divide-y divide-[var(--border-subtle)]">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="my-3 h-10 w-full" />)
          : TOGGLES.map((toggle) => (
              <label key={toggle.key} className="flex cursor-pointer items-center justify-between gap-4 py-4">
                <span>
                  <span className="block text-[14px] font-medium text-[var(--text-primary)]">{toggle.label}</span>
                  <span className="block text-[12.5px] text-[var(--text-muted)]">{toggle.description}</span>
                </span>
                <Switch
                  checked={valueFor(toggle.key)}
                  onChange={(checked) => handleToggle(toggle.key, checked)}
                  ariaLabel={toggle.label}
                />
              </label>
            ))}
      </div>
    </SettingsSection>
  )
}
