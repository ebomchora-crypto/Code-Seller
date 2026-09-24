import type { FinancialCategory } from '@/types'

interface CategoryBadgeProps {
  category?: FinancialCategory | null
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  if (!category) {
    return <span className="text-xs text-neutral-400">Sem categoria</span>
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${category.color}1a`, color: category.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: category.color }} />
      {category.name}
    </span>
  )
}
