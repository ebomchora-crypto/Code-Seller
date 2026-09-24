import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { useTheme } from '@/hooks/useTheme'
import type { Language, Theme, UserProfile } from '@/types'

interface PreferencesSectionProps {
  profile: UserProfile | null
  onSave: (data: Partial<UserProfile>) => Promise<boolean>
  saving: boolean
}

const TIMEZONES = [
  { value: 'America/Rio_Branco', label: 'Acre (UTC-5)' },
  { value: 'America/Manaus', label: 'Amazonas (UTC-4)' },
  { value: 'America/Cuiaba', label: 'Cuiabá (UTC-4)' },
  { value: 'America/Sao_Paulo', label: 'Brasília / São Paulo (UTC-3)' },
  { value: 'America/Bahia', label: 'Salvador (UTC-3)' },
  { value: 'America/Fortaleza', label: 'Fortaleza (UTC-3)' },
  { value: 'America/Recife', label: 'Recife (UTC-3)' },
  { value: 'America/Belem', label: 'Belém (UTC-3)' },
  { value: 'America/Noronha', label: 'Fernando de Noronha (UTC-2)' },
  { value: 'UTC', label: 'UTC' },
]

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
]

export function PreferencesSection({ profile, onSave, saving }: PreferencesSectionProps) {
  const [language, setLanguage] = useState<Language>(profile?.language ?? 'pt-BR')
  const [timezone, setTimezone] = useState(profile?.timezone ?? 'America/Sao_Paulo')
  // useTheme já aplica a classe no <html> e persiste no banco a cada seleção —
  // reaproveitado aqui para que o toggle rápido do Header e este seletor de 3
  // opções nunca fiquem dessincronizados entre si.
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setLanguage(profile?.language ?? 'pt-BR')
    setTimezone(profile?.timezone ?? 'America/Sao_Paulo')
  }, [profile])

  async function handleSave() {
    await onSave({ language, timezone })
  }

  return (
    <section id="preferências" className="scroll-mt-6">
      <Card>
        <span className="label-caps">Sistema</span>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[var(--text-primary)]">Preferências</h2>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Idioma" value={language} onChange={(event) => setLanguage(event.target.value as Language)}>
            <option value="pt-BR">Português (BR)</option>
            <option value="en-US">English</option>
          </Select>

          <Select label="Fuso horário" value={timezone} onChange={(event) => setTimezone(event.target.value)}>
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-6">
          <label className="text-sm font-medium text-[var(--text-secondary)]">Tema</label>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">Aplicado imediatamente ao selecionar.</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon
              const active = theme === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors duration-150 ${
                    active
                      ? 'border-purple-500/40 bg-[var(--purple-soft)] text-purple-500'
                      : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:border-purple-500/20'
                  }`}
                >
                  <Icon className="h-5 w-5 transition-transform duration-150" />
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-[var(--border-subtle)] pt-6">
          <Button onClick={handleSave} loading={saving}>
            Salvar preferências
          </Button>
        </div>
      </Card>
    </section>
  )
}
