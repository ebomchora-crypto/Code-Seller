import { getStageConfig } from '@/utils/deals'
import type { DealStage } from '@/types'

interface StageBadgeProps {
  stage: DealStage
  onClick?: () => void
}

export function StageBadge({ stage, onClick }: StageBadgeProps) {
  const config = getStageConfig(stage)
  const Component = onClick ? 'button' : 'span'

  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-wide transition-colors duration-150 ${onClick ? 'cursor-pointer hover:brightness-95' : ''}`}
      style={{ backgroundColor: `${config.color}1a`, color: config.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: config.color }} />
      {config.label}
    </Component>
  )
}
