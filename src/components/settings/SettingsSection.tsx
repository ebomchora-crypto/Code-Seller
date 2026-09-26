import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface SettingsSectionProps {
  id: string
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}

// Bloco padrão das Configurações: ícone, título, descrição e conteúdo.
export function SettingsSection({ id, icon: Icon, title, description, action, children }: SettingsSectionProps) {
  return (
    <section id={id} className="scroll-mt-6">
      <Card>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-tint)] text-[var(--accent-text)]">
              <Icon className="size-[18px]" />
            </span>
            <div>
              <h2 className="font-display text-[18px] font-semibold tracking-tight text-[var(--text-primary)]">{title}</h2>
              {description && <p className="mt-0.5 text-[13.5px] text-[var(--text-muted)]">{description}</p>}
            </div>
          </div>
          {action}
        </div>
        {children}
      </Card>
    </section>
  )
}

// Aviso discreto dentro de uma seção (ex: recurso ainda em construção).
export function SettingsNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-[var(--accent-ring)] bg-[var(--accent-tint)] px-4 py-3 text-[13px] leading-relaxed text-[var(--text-secondary)]">
      {children}
    </p>
  )
}
