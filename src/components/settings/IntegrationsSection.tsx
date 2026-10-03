import { useCallback, useEffect, useState } from 'react'
import { Plug } from 'lucide-react'
import { SettingsNote, SettingsSection } from '@/components/settings/SettingsSection'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { IntegrationCard } from '@/components/settings/IntegrationCard'
import { WebhookModal } from '@/components/settings/WebhookModal'
import { listWebhookDeliveries, type WebhookDelivery } from '@/services/supabase/webhook'
import type { Integration, IntegrationConfig, IntegrationType } from '@/types'

interface IntegrationsSectionProps {
  integrations: Integration[]
  onConnect: (type: IntegrationType, config: Record<string, unknown>) => Promise<boolean>
  onDisconnect: (type: IntegrationType) => Promise<void>
}

type IntegrationMeta = Omit<IntegrationConfig, 'status' | 'connected_at'>

function timeAgo(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000)
  if (minutes < 1) return 'agora há pouco'
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `há ${hours} h`
  return `em ${new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`
}

const INTEGRATION_META: Partial<Record<IntegrationType, IntegrationMeta>> = {
  webhook: {
    type: 'webhook',
    label: 'Webhook',
    description: 'Mande contatos, negócios e tarefas para qualquer sistema, na hora em que acontecem.',
    icon: 'Webhook',
  },
}

export function IntegrationsSection({ integrations, onConnect, onDisconnect }: IntegrationsSectionProps) {
  const [webhookOpen, setWebhookOpen] = useState(false)
  const [disconnectingType, setDisconnectingType] = useState<IntegrationType | null>(null)

  const webhook = integrations.find((integration) => integration.type === 'webhook')
  const webhookConnected = webhook?.status === 'connected'
  const [lastDelivery, setLastDelivery] = useState<WebhookDelivery | null>(null)

  // Situação real do webhook: o último envio chegou ou falhou?
  const refreshHealth = useCallback(async () => {
    try {
      setLastDelivery((await listWebhookDeliveries(1))[0] ?? null)
    } catch {
      setLastDelivery(null)
    }
  }, [])

  useEffect(() => {
    if (webhookConnected) void refreshHealth()
  }, [webhookConnected, refreshHealth])

  const webhookHealth = webhookConnected && lastDelivery
    ? lastDelivery.ok
      ? { ok: true, text: `Funcionando · último envio ${timeAgo(lastDelivery.created_at)}` }
      : { ok: false, text: `Último envio falhou (${timeAgo(lastDelivery.created_at)}): ${lastDelivery.error ?? 'sem resposta'}` }
    : null

  const configs: IntegrationConfig[] = integrations.flatMap((integration) => {
    const meta = INTEGRATION_META[integration.type]
    if (!meta) return []
    return [
      {
        ...meta,
        status: integration.status,
        connected_at: integration.connected_at,
        health: integration.type === 'webhook' ? webhookHealth : null,
      },
    ]
  })

  function openFor(type: IntegrationType) {
    if (type === 'webhook') setWebhookOpen(true)
  }

  return (
    <>
      <SettingsSection id="integrações" icon={Plug} title="Integrações" description="Conecte o Code Sellers a outras ferramentas.">
        <SettingsNote>
          O Webhook manda cada contato, negócio ou tarefa concluída na hora para o endereço que você escolher. O card mostra se o
          último envio chegou.
        </SettingsNote>

        <div className="mt-5 grid grid-cols-1 gap-3">
          {configs.map((config) => (
            <IntegrationCard
              key={config.type}
              config={config}
              onConnect={() => openFor(config.type)}
              onConfigure={config.type === 'webhook' ? () => setWebhookOpen(true) : undefined}
              onDisconnect={() => setDisconnectingType(config.type)}
            />
          ))}
        </div>
      </SettingsSection>

      <WebhookModal
        open={webhookOpen}
        integration={webhook}
        onClose={() => {
          setWebhookOpen(false)
          if (webhookConnected) void refreshHealth()
        }}
        onSave={(config) => onConnect('webhook', config)}
      />

      <ConfirmDialog
        open={disconnectingType !== null}
        title="Desconectar integração"
        message={
          disconnectingType === 'webhook'
            ? 'Os eventos param de ser enviados e a chave de assinatura é apagada.'
            : 'Tem certeza que deseja desconectar esta integração?'
        }
        confirmLabel="Desconectar"
        onConfirm={async () => {
          if (disconnectingType) await onDisconnect(disconnectingType)
          setDisconnectingType(null)
        }}
        onCancel={() => setDisconnectingType(null)}
      />
    </>
  )
}
