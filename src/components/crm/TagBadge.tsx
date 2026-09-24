import type { Tag } from '@/types'

interface TagBadgeProps {
  tag: Tag
  onRemove?: () => void
}

export function TagBadge({ tag, onRemove }: TagBadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ backgroundColor: `${tag.color}1a`, color: tag.color }}
    >
      {tag.name}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remover tag ${tag.name}`}
          className="ml-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full transition-colors hover:bg-accent-ink/10"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-2.5 w-2.5">
            <path strokeLinecap="round" d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  )
}
