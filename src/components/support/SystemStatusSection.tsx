import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { OVERALL_STATUS, SYSTEM_STATUS } from '@/data/systemStatus'
import type { SystemStatus } from '@/types'

const STATUS_STYLES: Record<SystemStatus['status'], { bar: string; dot: string; text: string; label: string }> = {
  operational: {
    bar: 'bg-emerald-500/10 border-emerald-500/20',
    dot: 'bg-emerald-500',
    text: 'text-emerald-600',
    label: 'Todos os sistemas operacionais',
  },
  degraded: {
    bar: 'bg-amber-500/10 border-amber-500/20',
    dot: 'bg-amber-500',
    text: 'text-amber-600',
    label: 'Alguns sistemas com desempenho degradado',
  },
  outage: {
    bar: 'bg-red-500/10 border-red-500/20',
    dot: 'bg-red-500',
    text: 'text-red-600',
    label: 'Instabilidade em um ou mais sistemas',
  },
}

const SERVICE_BADGE: Record<SystemStatus['status'], string> = {
  operational: 'bg-emerald-500/10 text-emerald-600',
  degraded: 'bg-amber-500/10 text-amber-600',
  outage: 'bg-red-500/10 text-red-600',
}

const SERVICE_LABEL: Record<SystemStatus['status'], string> = {
  operational: 'Operacional',
  degraded: 'Degradado',
  outage: 'Instável',
}

export function SystemStatusSection() {
  const [expanded, setExpanded] = useState(false)
  const styles = STATUS_STYLES[OVERALL_STATUS]

  return (
    <div className={`mb-6 rounded-xl border ${styles.bar}`}>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-2 px-4 py-2.5"
      >
        <span className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${styles.dot} animate-pulse`} />
          <span className={`text-sm font-medium ${styles.text}`}>{styles.label}</span>
        </span>
        <span className={`flex items-center gap-1 text-xs font-medium ${styles.text}`}>
          Ver detalhes
          <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
        </span>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ${expanded ? 'max-h-96' : 'max-h-0'}`}>
        <div className="grid grid-cols-1 gap-2 px-4 pb-4 sm:grid-cols-2">
          {SYSTEM_STATUS.map((service) => (
            <div
              key={service.service}
              className="flex items-center justify-between rounded-lg bg-[var(--bg-card)] px-3 py-2 text-sm"
            >
              <span className="text-[var(--text-primary)]">{service.service}</span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${SERVICE_BADGE[service.status]}`}>
                {SERVICE_LABEL[service.status]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
