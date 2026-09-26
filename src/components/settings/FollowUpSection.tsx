import { useEffect, useState } from 'react'
import { Repeat, X } from 'lucide-react'
import { toast } from 'sonner'
import { SettingsNote, SettingsSection } from '@/components/settings/SettingsSection'
import { Switch } from '@/components/ui/Switch'
import { useAuthContext } from '@/stores/AuthContext'
import { DEFAULT_FOLLOWUP_DAYS } from '@/utils/followup'

// Liga/desliga o follow-up automático e define em quantos dias cada retorno cai.
export function FollowUpSection() {
  const { profile, updateProfile } = useAuthContext()
  const enabled = profile?.followup_enabled !== false
  const savedDays = profile?.followup_days?.length ? profile.followup_days : DEFAULT_FOLLOWUP_DAYS
  const [days, setDays] = useState<number[]>(savedDays)
  const [newDay, setNewDay] = useState('')

  useEffect(() => {
    setDays(savedDays)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.followup_days?.join(',')])

  async function save(next: Partial<{ followup_enabled: boolean; followup_days: number[] }>) {
    const { error } = await updateProfile(next)
    if (error) toast.error('Não foi possível salvar.')
  }

  function removeDay(day: number) {
    const next = days.filter((item) => item !== day)
    if (next.length === 0) return
    setDays(next)
    void save({ followup_days: next })
  }

  function addDay() {
    const value = Number(newDay)
    if (!Number.isInteger(value) || value < 1 || value > 90 || days.includes(value) || days.length >= 6) return
    const next = [...days, value].sort((a, b) => a - b)
    setDays(next)
    setNewDay('')
    void save({ followup_days: next })
  }

  return (
    <SettingsSection
      id="follow-up"
      icon={Repeat}
      title="Follow-up automático"
      description="Tarefas de retorno criadas sozinhas para ninguém sumir depois da primeira mensagem."
    >
      <SettingsNote>
        Quando você importa uma empresa do Buyers Hunter ou cria um negócio com contato, o app agenda as tarefas de
        retorno com lembrete e a mensagem sugerida (dos seus modelos de follow-up). Se o negócio for ganho ou perdido,
        os retornos em aberto são cancelados.
      </SettingsNote>

      <div className="mt-4 divide-y divide-[var(--border-subtle)]">
        <div className="flex items-center justify-between gap-4 py-4">
          <div>
            <p className="text-[14px] font-medium text-[var(--text-primary)]">Criar follow-up automaticamente</p>
            <p className="text-[12.5px] text-[var(--text-muted)]">Você também pode iniciar ou parar em cada contato.</p>
          </div>
          <Switch checked={enabled} onChange={(checked) => void save({ followup_enabled: checked })} ariaLabel="Follow-up automático" />
        </div>

        <div className="py-4">
          <p className="text-[14px] font-medium text-[var(--text-primary)]">Dias de cada retorno</p>
          <p className="text-[12.5px] text-[var(--text-muted)]">Contados a partir do dia em que o contato entra. Sempre às 10h.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {days.map((day) => (
              <span
                key={day}
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--border-default)] pl-3 pr-1.5 text-[13px] text-[var(--text-primary)]"
              >
                Dia {day}
                {days.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDay(day)}
                    aria-label={`Remover dia ${day}`}
                    className="flex size-5 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </span>
            ))}
            {days.length < 6 && (
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  addDay()
                }}
                className="flex items-center gap-1.5"
              >
                <input
                  inputMode="numeric"
                  value={newDay}
                  onChange={(event) => setNewDay(event.target.value.replace(/\D/g, '').slice(0, 2))}
                  placeholder="+ dia"
                  aria-label="Adicionar dia"
                  className="h-8 w-20 rounded-full border border-dashed border-[var(--border-strong)] bg-transparent px-3 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--accent-ring)]"
                />
              </form>
            )}
          </div>
        </div>
      </div>
    </SettingsSection>
  )
}
