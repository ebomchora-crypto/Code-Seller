import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps } from 'recharts'
import type { RevenuePoint } from '@/types'

// value = null nos trechos que ainda não aconteceram (a linha para no agora).
export type RoomChartPoint = Omit<RevenuePoint, 'value'> & { value: number | null }

interface RoomChartProps {
  series: RoomChartPoint[]
  currentLabel: string
  previousLabel: string
  animate: boolean
}

function formatCompact(value: number): string {
  if (value >= 1000) return `${(value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function RoomTooltip({ active, payload, currentLabel, previousLabel }: TooltipContentProps & { currentLabel: string; previousLabel: string }) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0].payload as RoomChartPoint
  return (
    <div className="rounded-xl border border-[#a78bfa]/30 bg-[#140d24]/95 px-3.5 py-2.5 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.8)] backdrop-blur">
      <p className="text-[11px] uppercase tracking-[0.12em] text-white/50">{point.full_label}</p>
      <p className="mt-1 text-[14px] font-semibold text-white">
        {currentLabel}: {point.value === null ? '—' : formatBRL(point.value)}
      </p>
      <p className="text-[12.5px] text-white/50">
        {previousLabel}: {formatBRL(point.previous)}
      </p>
    </div>
  )
}

// Linha do período atual (roxa, com brilho) sobre o período anterior
// (tracejada), como no painel de "tendência de vendas".
export function RoomChart({ series, currentLabel, previousLabel, animate }: RoomChartProps) {
  const lastIndex = series.reduce((last, point, index) => (point.value === null ? last : index), -1)

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={series} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="room-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
          </linearGradient>
          <filter id="room-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.07)" />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={18}
          tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }}
          dy={8}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          width={52}
          tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }}
          tickFormatter={formatCompact}
        />
        <Tooltip
          content={(props) => <RoomTooltip {...props} currentLabel={currentLabel} previousLabel={previousLabel} />}
          cursor={{ stroke: 'rgba(196,181,253,0.35)', strokeDasharray: '4 4' }}
        />
        <Line
          type="monotone"
          dataKey="previous"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth={1.5}
          strokeDasharray="5 6"
          dot={false}
          activeDot={false}
          isAnimationActive={animate}
        />
        <Area
          type="linear"
          dataKey="value"
          stroke="#c4b5fd"
          strokeWidth={2.5}
          fill="url(#room-area)"
          filter="url(#room-glow)"
          isAnimationActive={animate}
          animationDuration={900}
          activeDot={{ r: 5, fill: '#c4b5fd', stroke: '#1a1030', strokeWidth: 3 }}
          dot={(props: { cx?: number; cy?: number; index?: number }) =>
            props.index === lastIndex && props.cx !== undefined && props.cy !== undefined ? (
              <g key="last">
                <circle cx={props.cx} cy={props.cy} r={10} fill="#a78bfa" opacity={0.25} />
                <circle cx={props.cx} cy={props.cy} r={4.5} fill="#ede9fe" />
              </g>
            ) : (
              <g key={`dot-${props.index}`} />
            )
          }
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
