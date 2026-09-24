import { useState } from 'react'
import type { ReactElement, SVGProps } from 'react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { INTERACTION_TYPE_LABELS, type Interaction, type InteractionType } from '@/types'

interface InteractionListProps {
  interactions: Interaction[]
  onDelete: (id: string) => Promise<void>
}

function baseIconProps(props: SVGProps<SVGSVGElement>): SVGProps<SVGSVGElement> {
  return {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className: 'h-4 w-4',
    ...props,
  }
}

const interactionIcons: Record<InteractionType, (props: SVGProps<SVGSVGElement>) => ReactElement> = {
  note: (props) => (
    <svg {...baseIconProps(props)}>
      <path d="M4 4h16v12H8l-4 4V4Z" />
    </svg>
  ),
  call: (props) => (
    <svg {...baseIconProps(props)}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L7.9 9.7a16 16 0 0 0 6.4 6.4l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2Z" />
    </svg>
  ),
  email: (props) => (
    <svg {...baseIconProps(props)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  ),
  whatsapp: (props) => (
    <svg {...baseIconProps(props)}>
      <path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.5L3 20l1.1-5.4A8.5 8.5 0 1 1 21 11.5Z" />
      <path d="M9 10.5c.3 1.8 2.2 3.7 4 4" />
    </svg>
  ),
  meeting: (props) => (
    <svg {...baseIconProps(props)}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  proposal: (props) => (
    <svg {...baseIconProps(props)}>
      <path d="M9 3v2m6-2v2M5 8h14M6 8v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8" />
      <path d="m9 13 2 2 4-4" />
    </svg>
  ),
  other: (props) => (
    <svg {...baseIconProps(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  ),
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function InteractionList({ interactions, onDelete }: InteractionListProps) {
  const [pendingDelete, setPendingDelete] = useState<Interaction | null>(null)
  const [deleting, setDeleting] = useState(false)

  if (interactions.length === 0) {
    return (
      <EmptyState
        title="Nenhuma interação registrada"
        description="Registre ligações, e-mails e reuniões para manter o histórico deste contato."
      />
    )
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    await onDelete(pendingDelete.id)
    setDeleting(false)
    setPendingDelete(null)
  }

  return (
    <>
      <ol className="relative border-l border-purple-200 pl-6">
        {interactions.map((interaction) => {
          const Icon = interactionIcons[interaction.type]
          return (
            <li key={interaction.id} className="group mb-6 last:mb-0">
              <span className="absolute -left-[13px] flex h-6 w-6 items-center justify-center rounded-full border border-purple-200 bg-white text-purple-600">
                <Icon />
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-purple-600">
                  {INTERACTION_TYPE_LABELS[interaction.type]}
                </span>
                <div className="flex items-center gap-3">
                  <time className="text-xs text-neutral-400">{formatDateTime(interaction.occurred_at)}</time>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(interaction)}
                    className="text-xs text-neutral-400 opacity-0 transition-opacity duration-150 hover:text-red-600 group-hover:opacity-100"
                  >
                    Remover
                  </button>
                </div>
              </div>
              <p className="mt-1 text-sm text-neutral-700">{interaction.content}</p>
            </li>
          )
        })}
      </ol>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Remover interação"
        message="Tem certeza que deseja remover este registro do histórico? Essa ação não pode ser desfeita."
        confirmLabel="Remover"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  )
}
