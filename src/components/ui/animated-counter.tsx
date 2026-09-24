import { useEffect, useState } from 'react'
import { animate } from 'motion/react'
import { useRevealOnScroll } from '@/hooks/useScrollAnimation'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface AnimatedCounterProps {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
  /** Formatação customizada (ex: moeda BRL) — sobrepõe prefix/suffix/decimals
   * quando informada. */
  format?: (value: number) => string
}

// Wrapper de apresentação sobre o `useCountUp` já existente (usado em
// MetricCard/FinancialMetrics) — não reimplementa a contagem com
// `motion.animate()` para não duplicar a mesma lógica em dois lugares.
// A contagem só começa quando o elemento entra na viewport (once: true).
export function AnimatedCounter({ value, duration = 1.2, prefix = '', suffix = '', decimals = 0, format }: AnimatedCounterProps) {
  const { ref, isInView } = useRevealOnScroll<HTMLSpanElement>()
  const reducedMotion = useReducedMotion()
  const [animated, setAnimated] = useState(reducedMotion ? value : 0)

  useEffect(() => {
    if (!isInView || reducedMotion) return

    const seconds = duration > 10 ? duration / 1000 : duration
    const controls = animate(0, value, {
      duration: seconds,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: setAnimated,
    })
    return () => controls.stop()
  }, [duration, isInView, reducedMotion, value])

  const displayValue = reducedMotion ? value : animated

  return (
    <span ref={ref}>
      {format
        ? format(displayValue)
        : `${prefix}${displayValue.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`}
    </span>
  )
}
