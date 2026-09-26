import { Card } from '@/components/ui/Card'
import { PanelHeader } from '@/components/ui/PanelHeader'
import { SYSTEM_STATUS } from '@/data/systemStatus'
import type { SystemStatus } from '@/types'

const SERVICE_STYLE: Record<SystemStatus['status'], { dot: string; text: string; label: string }> = {
  operational: { dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', label: 'Operacional' },
  degraded: { dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', label: 'Lento' },
  outage: { dot: 'bg-red-500', text: 'text-red-600 dark:text-red-400', label: 'Instável' },
}

export function SystemStatusSection() {
  return (
    <Card>
      <PanelHeader title="Status dos sistemas" />
      <ul className="flex flex-col divide-y divide-[var(--border-subtle)]">
        {SYSTEM_STATUS.map((service) => {
          const style = SERVICE_STYLE[service.status]
          return (
            <li key={service.service} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
              <span className="text-[13.5px] text-[var(--text-primary)]">{service.service}</span>
              <span className={`flex items-center gap-1.5 text-[12.5px] font-medium ${style.text}`}>
                <span className={`size-1.5 rounded-full ${style.dot}`} />
                {style.label}
              </span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
