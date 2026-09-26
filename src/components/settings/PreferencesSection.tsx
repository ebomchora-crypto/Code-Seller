import { useEffect, useState } from 'react'
import { Check, SlidersHorizontal, Sun, Moon, Monitor } from 'lucide-react'
import { SettingsSection } from '@/components/settings/SettingsSection'
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
    <SettingsSection id="preferências" icon={SlidersHorizontal} title="Preferências" description="Tema, idioma e fuso horário.">
      <div>
        <p className="text-[13px] font-medium text-[var(--text-secondary)]">Tema</p>
        <p className="mt-0.5 text-[12px] text-[var(--text-muted)]">Muda na hora ao escolher.</p>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {THEME_OPTIONS.map((option) => {
            const Icon = option.icon
            const active = theme === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                aria-pressed={active}
                className={`group relative overflow-hidden rounded-[18px] border p-2 text-left transition-all duration-200 ${
                  active
                    ? 'border-[var(--accent-ring)] ring-4 ring-[var(--accent-tint)]'
                    : 'border-[var(--border-default)] hover:border-[var(--border-strong)]'
                }`}
              >
                <ThemePreview variant={option.value} />
                <span className="mt-2.5 flex items-center justify-between gap-2 px-1 pb-0.5">
                  <span className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--text-primary)]">
                    <Icon className="size-4 text-[var(--text-muted)]" />
                    {option.label}
                  </span>
                  {active && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-[var(--accent-solid)] text-white">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 border-t border-[var(--border-subtle)] pt-6 sm:grid-cols-2">
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

      <div className="mt-6 flex justify-end border-t border-[var(--border-subtle)] pt-6">
        <Button onClick={handleSave} loading={saving} className="h-11 rounded-full px-5">
          Salvar preferências
        </Button>
      </div>
    </SettingsSection>
  )
}

const PREVIEW_PALETTES = {
  light: { bg: '#efedf3', panel: '#fbfafd', line: '#e4e1ea', text: '#d5d1dd' },
  dark: { bg: '#08060d', panel: '#120f1a', line: '#221d2d', text: '#2d2739' },
}

function MiniApp({ palette }: { palette: (typeof PREVIEW_PALETTES)['light'] }) {
  return (
    <span className="flex h-full w-full gap-1 p-1.5" style={{ backgroundColor: palette.bg }}>
      <span className="flex w-1/4 flex-col gap-1 pt-1">
        <span className="h-1.5 w-full rounded-full bg-[#8b5cf6]" />
        <span className="h-1.5 w-3/4 rounded-full" style={{ backgroundColor: palette.text }} />
        <span className="h-1.5 w-3/4 rounded-full" style={{ backgroundColor: palette.text }} />
      </span>
      <span className="flex flex-1 flex-col gap-1 rounded-md p-1.5" style={{ backgroundColor: palette.panel }}>
        <span className="h-2 w-1/2 rounded-full" style={{ backgroundColor: palette.text }} />
        <span className="flex flex-1 gap-1">
          <span className="flex-1 rounded" style={{ backgroundColor: palette.line }} />
          <span className="flex-1 rounded" style={{ backgroundColor: palette.line }} />
        </span>
      </span>
    </span>
  )
}

// Miniatura do app em cada tema, para escolher vendo como fica.
function ThemePreview({ variant }: { variant: Theme }) {
  return (
    <span className="relative block aspect-[16/10] overflow-hidden rounded-xl">
      {variant === 'system' ? (
        <>
          <span className="absolute inset-0">
            <MiniApp palette={PREVIEW_PALETTES.light} />
          </span>
          <span className="absolute inset-0 [clip-path:polygon(100%_0,100%_100%,0_100%)]">
            <MiniApp palette={PREVIEW_PALETTES.dark} />
          </span>
        </>
      ) : (
        <MiniApp palette={PREVIEW_PALETTES[variant]} />
      )}
    </span>
  )
}
