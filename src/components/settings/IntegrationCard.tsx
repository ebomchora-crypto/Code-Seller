import { Users, Webhook, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { IntegrationConfig, IntegrationType } from '@/types'

interface IntegrationCardProps {
  config: IntegrationConfig
  onConnect: () => void
  onDisconnect: () => void
  // Conectado: abre as configurações (ex.: webhook). Sem isto, só "Desconectar".
  onConfigure?: () => void
}

const ICONS: Partial<Record<IntegrationType, LucideIcon>> = {
  google_contacts: Users,
  webhook: Webhook,
}

const STATUS_LABELS: Record<IntegrationConfig['status'], string> = {
  connected: 'Conectado',
  disconnected: 'Desconectado',
  error: 'Erro',
}

const STATUS_CLASSES: Record<IntegrationConfig['status'] | 'soon', string> = {
  connected: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  disconnected: 'bg-[var(--bg-muted)] text-[var(--text-muted)]',
  error: 'bg-red-500/10 text-red-600 dark:text-red-400',
  soon: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
}

const TONES: Partial<Record<IntegrationType, string>> = {
  google_contacts: '#f472b6',
  webhook: '#a78bfa',
}

export function IntegrationCard({ config, onConnect, onDisconnect, onConfigure }: IntegrationCardProps) {
  const Icon = ICONS[config.type] ?? Webhook
  const tone = TONES[config.type] ?? '#a78bfa'
  const soon = Boolean(config.coming_soon)
  const connected = !soon && config.status === 'connected'

  return (
    <div className="flex flex-col gap-4 rounded-[20px] border border-[var(--border-default)] p-5 transition hover:border-[var(--border-strong)]">
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl" style={{ backgroundColor: `${tone}1f`, color: tone }}>
          <Icon className="size-5" />
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium ${
            STATUS_CLASSES[soon ? 'soon' : config.status]
          }`}
        >
          <span className="size-1.5 rounded-full bg-current" />
          {soon ? 'Em breve' : STATUS_LABELS[config.status]}
        </span>
      </div>

      <div className="flex-1">
        <h3 className="text-[14.5px] font-semibold text-[var(--text-primary)]">{config.label}</h3>
        <p className="mt-1 text-[13px] text-[var(--text-muted)]">{config.description}</p>
        {connected && config.connected_at && (
          <p className="mt-1 text-[11.5px] text-[var(--text-muted)]">
            Conectado em {new Date(config.connected_at).toLocaleDateString('pt-BR')}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-[var(--border-subtle)] pt-4">
        {connected ? (
          <>
            {onConfigure && (
              <Button variant="secondary" size="sm" className="h-9 rounded-full px-4" onClick={onConfigure}>
                Configurar
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-9 rounded-full px-4" onClick={onDisconnect}>
              Desconectar
            </Button>
          </>
        ) : (
          <Button variant="secondary" size="sm" className="h-9 rounded-full px-4" onClick={onConnect}>
            {config.action_label ?? 'Conectar'}
          </Button>
        )}
      </div>
    </div>
  )
}
