import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plug } from 'lucide-react'
import { SettingsNote, SettingsSection } from '@/components/settings/SettingsSection'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { IntegrationCard } from '@/components/settings/IntegrationCard'
import { WebhookModal } from '@/components/settings/WebhookModal'
import type { Integration, IntegrationConfig, IntegrationType } from '@/types'

interface IntegrationsSectionProps {
  integrations: Integration[]
  onConnect: (type: IntegrationType, config: Record<string, unknown>) => Promise<boolean>
  onDisconnect: (type: IntegrationType) => Promise<void>
}

type IntegrationMeta = Omit<IntegrationConfig, 'status' | 'connected_at'>

const INTEGRATION_META: Partial<Record<IntegrationType, IntegrationMeta>> = {
  webhook: {
    type: 'webhook',
    label: 'Webhook',
    description: 'Mande contatos, negócios e tarefas para qualquer sistema, na hora em que acontecem.',
    icon: 'Webhook',
  },
  google_contacts: {
    type: 'google_contacts',
    label: 'Google Contacts',
    description: 'Traga seus contatos do Google para o CRM.',
    icon: 'Users',
    coming_soon: true,
    action_label: 'Importar agora',
  },
}

const GOOGLE_STEPS = [
  <>
    Abra <strong>contacts.google.com</strong> com a conta Google que tem os contatos.
  </>,
  <>
    Selecione os contatos (ou nenhum, para levar todos) e clique em <strong>Exportar</strong>.
  </>,
  <>
    Escolha <strong>CSV do Google</strong> e baixe o arquivo.
  </>,
  <>
    Aqui no CRM, clique em <strong>Importar CSV</strong> e envie o arquivo. Nome, e-mail, telefone, cidade e observações
    são reconhecidos sozinhos.
  </>,
]

export function IntegrationsSection({ integrations, onConnect, onDisconnect }: IntegrationsSectionProps) {
  const navigate = useNavigate()
  const [webhookOpen, setWebhookOpen] = useState(false)
  const [googleOpen, setGoogleOpen] = useState(false)
  const [disconnectingType, setDisconnectingType] = useState<IntegrationType | null>(null)

  const configs: IntegrationConfig[] = integrations.flatMap((integration) => {
    const meta = INTEGRATION_META[integration.type]
    return meta ? [{ ...meta, status: integration.status, connected_at: integration.connected_at }] : []
  })
  const webhook = integrations.find((integration) => integration.type === 'webhook')

  function openFor(type: IntegrationType) {
    if (type === 'webhook') setWebhookOpen(true)
    if (type === 'google_contacts') setGoogleOpen(true)
  }

  return (
    <>
      <SettingsSection id="integrações" icon={Plug} title="Integrações" description="Conecte o Code Sellers a outras ferramentas.">
        <SettingsNote>
          O Webhook já funciona: cada contato, negócio ou tarefa marcada é enviada na hora para o endereço que você escolher.
          A conexão direta com o Google Contacts está em construção — enquanto isso, dá para trazer os contatos em 1 minuto
          pelo arquivo CSV.
        </SettingsNote>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
        onClose={() => setWebhookOpen(false)}
        onSave={(config) => onConnect('webhook', config)}
      />

      <Modal open={googleOpen} onClose={() => setGoogleOpen(false)} title="Trazer contatos do Google" size="sm">
        <ol className="flex flex-col gap-3">
          {GOOGLE_STEPS.map((step, index) => (
            <li key={index} className="flex gap-3 text-[13px] leading-relaxed text-[var(--text-secondary)]">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-tint)] text-[12px] font-semibold text-[var(--accent-text)]">
                {index + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setGoogleOpen(false)}>
            Fechar
          </Button>
          <Button onClick={() => navigate('/crm?importar=1')}>Abrir importação</Button>
        </div>
      </Modal>

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
