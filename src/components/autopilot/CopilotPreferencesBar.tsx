import { ChevronDown } from 'lucide-react'
import type { CopilotLanguage, CopilotLength, CopilotPreferences, CopilotTone, SalesPlaybook } from '@/types'

interface CopilotPreferencesBarProps {
  value: CopilotPreferences
  onChange: (value: CopilotPreferences) => void
}

const CONTROL_CLASS =
  'h-9 w-full min-w-0 appearance-none rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] pl-2.5 pr-7 text-[12px] text-[var(--text-primary)] outline-none transition-colors hover:border-[var(--border-default)] focus:border-[var(--accent-ring)]'

function PreferenceSelect<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string
  label: string
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1 block text-[11px] font-medium text-[var(--text-muted)]">
        {label}
      </label>
      <div className="relative">
        <select id={id} value={value} onChange={(event) => onChange(event.target.value as T)} className={CONTROL_CLASS}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
      </div>
    </div>
  )
}

export function CopilotPreferencesBar({ value, onChange }: CopilotPreferencesBarProps) {
  return (
    <div className="grid grid-cols-2 gap-x-2.5 gap-y-2 sm:grid-cols-4">
      <PreferenceSelect<SalesPlaybook>
        id="copilot-playbook"
        label="Playbook"
        value={value.playbook}
        onChange={(playbook) => onChange({ ...value, playbook })}
        options={[
          { value: 'call_first', label: 'Call First' },
          { value: 'whatsapp', label: 'Venda pelo WhatsApp' },
          { value: 'prototype_first', label: 'Protótipo Primeiro' },
          { value: 'lead_recovery', label: 'Recuperação de Lead' },
          { value: 'follow_up', label: 'Follow-up' },
        ]}
      />
      <PreferenceSelect<CopilotTone>
        id="copilot-tone"
        label="Tom"
        value={value.tone}
        onChange={(tone) => onChange({ ...value, tone })}
        options={[
          { value: 'natural', label: 'Natural' },
          { value: 'professional', label: 'Profissional' },
          { value: 'casual', label: 'Casual' },
          { value: 'direct', label: 'Direto' },
          { value: 'consultative', label: 'Consultivo' },
          { value: 'formal', label: 'Formal' },
        ]}
      />
      <PreferenceSelect<CopilotLength>
        id="copilot-length"
        label="Tamanho"
        value={value.length}
        onChange={(length) => onChange({ ...value, length })}
        options={[
          { value: 'short', label: 'Curto' },
          { value: 'medium', label: 'Médio' },
          { value: 'detailed', label: 'Detalhado' },
        ]}
      />
      <PreferenceSelect<CopilotLanguage>
        id="copilot-language"
        label="Idioma"
        value={value.language}
        onChange={(language) => onChange({ ...value, language })}
        options={[
          { value: 'auto', label: 'Automático' },
          { value: 'pt_br', label: 'Português BR' },
          { value: 'pt_pt', label: 'Português PT' },
          { value: 'en', label: 'Inglês' },
          { value: 'es', label: 'Espanhol' },
        ]}
      />
    </div>
  )
}
