import { motion } from 'motion/react'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { PanelHeader, PanelLink } from '@/components/ui/PanelHeader'
import { getStageConfig } from '@/utils/deals'
import type { PipelineDataPoint } from '@/types'
import { useRevealOnScroll } from '@/hooks/useScrollAnimation'
import { EASE_PREMIUM, fadeInUp } from '@/utils/animations'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface PipelineChartProps {
  data: PipelineDataPoint[]
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

function formatFullBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

// Funil em barras horizontais: cada etapa com quantos negócios tem e quanto
// valem; a barra é proporcional à etapa com mais negócios.
export function PipelineChart({ data, loading, error, onRetry }: PipelineChartProps) {
  const totalCount = data.reduce((sum, point) => sum + point.count, 0)
  const totalValue = data.reduce((sum, point) => sum + point.value, 0)
  const maxCount = Math.max(...data.map((point) => point.count), 1)
  const { ref, isInView } = useRevealOnScroll<HTMLDivElement>()
  const reducedMotion = useReducedMotion()

  return (
    <motion.div ref={ref} initial="hidden" animate={isInView ? 'visible' : 'hidden'} variants={fadeInUp} className="h-full">
      <Card className="flex h-full flex-col">
        <PanelHeader
          title="Pipeline por etapa"
          subtitle={
            totalCount > 0
              ? `${totalCount} ${totalCount === 1 ? 'negócio' : 'negócios'} · ${formatFullBRL(totalValue)} em aberto`
              : 'Negócios abertos por etapa'
          }
          action={<PanelLink to="/deals">Pipeline</PanelLink>}
        />

        {loading ? (
          <div className="flex flex-col gap-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index}>
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="mt-2.5 h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : totalCount === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState title="Nenhum negócio em andamento" />
          </div>
        ) : (
          <ul className="flex flex-1 flex-col justify-between gap-4">
            {data.map((point, index) => {
              const color = getStageConfig(point.stage).color
              const width = point.count === 0 ? 0 : Math.max((point.count / maxCount) * 100, 6)
              return (
                <li key={point.stage}>
                  <div className="flex items-baseline justify-between gap-3 text-[13px]">
                    <span className="flex items-center gap-2 font-medium text-[var(--text-primary)]">
                      <span className="size-2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }} />
                      {point.label}
                      <span className="rounded-md bg-[var(--bg-muted)] px-1.5 py-px text-[11.5px] font-semibold text-[var(--text-secondary)]">
                        {point.count}
                      </span>
                    </span>
                    <span className="text-[12.5px] tabular-nums text-[var(--text-muted)]">{formatFullBRL(point.value)}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--bg-muted)]">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${color}99, ${color})` }}
                      initial={reducedMotion ? false : { width: 0 }}
                      animate={{ width: isInView || reducedMotion ? `${width}%` : 0 }}
                      transition={{ duration: 0.9, ease: EASE_PREMIUM, delay: 0.1 + index * 0.07 }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </motion.div>
  )
}
