import { Calendar, MessageCircle, Users, Webhook, Zap, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { IntegrationConfig, IntegrationType } from '@/types'

interface IntegrationCardProps {
  config: IntegrationConfig
  onConnect: () => void
  onDisconnect: () => void
}

const ICONS: Record<IntegrationType, LucideIcon> = {
  whatsapp: MessageCircle,
  google_calendar: Calendar,
  google_contacts: Users,
  zapier: Zap,
  webhook: Webhook,
}

const STATUS_LABELS: Record<IntegrationConfig['status'], string> = {
  connected: 'Conectado',
  disconnected: 'Desconectado',
  error: 'Erro',
}

const STATUS_CLASSES: Record<IntegrationConfig['status'], string> = {
  connected: 'bg-emerald-50 text-emerald-700',
  disconnected: 'bg-neutral-100 text-neutral-500',
  error: 'bg-red-50 text-red-700',
}

export function IntegrationCard({ config, onConnect, onDisconnect }: IntegrationCardProps) {
  const Icon = ICONS[config.type]

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
          <Icon className="h-5 w-5" />
        </span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASSES[config.status]}`}>
          {STATUS_LABELS[config.status]}
        </span>
      </div>

      <div>
        <h3 className="text-sm font-medium text-neutral-900">{config.label}</h3>
        <p className="mt-1 text-xs text-neutral-500">{config.description}</p>
        {config.connected_at && (
          <p className="mt-1 text-[11px] text-neutral-400">
            Conectado em {new Date(config.connected_at).toLocaleDateString('pt-BR')}
          </p>
        )}
      </div>

      <div className="mt-1 flex items-center justify-between">
        {config.status === 'connected' ? (
          <Button variant="ghost" size="sm" onClick={onDisconnect}>
            Desconectar
          </Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={onConnect}>
            Conectar
          </Button>
        )}
        <a
          href={config.docs_url}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-medium text-purple-600 hover:text-purple-700"
        >
          Ver documentação →
        </a>
      </div>
    </div>
  )
}
