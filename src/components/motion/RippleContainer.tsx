import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useReducedMotion } from '@/motion/hooks'

interface Ripple {
  id: number
  x: number
  y: number
  size: number
}

let rippleId = 0

// Ripple (Fase 6): círculo que se espalha a partir do ponto clicado. Uso
// restrito a botões/quick actions/atalhos — envolva o elemento clicável com
// este componente (`position: relative` + `overflow: hidden` já aplicados).
export function RippleContainer({
  children,
  className = '',
  color = 'rgba(255,255,255,0.35)',
}: {
  children: React.ReactNode
  className?: string
  color?: string
}) {
  const [ripples, setRipples] = useState<Ripple[]>([])
  const containerRef = useRef<HTMLSpanElement>(null)
  const reducedMotion = useReducedMotion()

  function onPointerDown(event: ReactPointerEvent<HTMLSpanElement>) {
    if (reducedMotion || !containerRef.current) return
    const bounds = containerRef.current.getBoundingClientRect()
    const size = Math.max(bounds.width, bounds.height) * 1.6
    const id = ++rippleId
    setRipples((current) => [
      ...current,
      { id, x: event.clientX - bounds.left - size / 2, y: event.clientY - bounds.top - size / 2, size },
    ])
    window.setTimeout(() => {
      setRipples((current) => current.filter((ripple) => ripple.id !== id))
    }, 500)
  }

  return (
    <span
      ref={containerRef}
      onPointerDown={onPointerDown}
      className={`relative inline-flex overflow-hidden ${className}`}
    >
      {children}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="pointer-events-none absolute rounded-full"
            style={{ left: ripple.x, top: ripple.y, width: ripple.size, height: ripple.size, backgroundColor: color }}
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
    </span>
  )
}
