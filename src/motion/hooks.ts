import { useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { useMotionValue, useSpring } from 'motion/react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useRevealOnScroll, useStaggerChildren } from '@/hooks/useScrollAnimation'

export { useReducedMotion, useRevealOnScroll, useStaggerChildren }

// Detecta ponteiro grosso (touch) — usado para desligar magnetic/tilt/cursor
// follower em dispositivos sem hover preciso, como o guia recomenda.
export function useFinePointer(): boolean {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(pointer: fine)').matches
}

interface MagneticOptions {
  strength?: number // 0-1, quanto o elemento "segue" o cursor
  range?: number // px de raio de ativação além do próprio elemento
}

// Botão magnético (Fase 6 / Magnetic Button): aproxima o elemento do
// ponteiro dentro de um raio pequeno. Uso restrito a CTAs principais.
export function useMagnetic({ strength = 0.35, range = 60 }: MagneticOptions = {}) {
  const ref = useRef<HTMLElement>(null)
  const reducedMotion = useReducedMotion()
  const finePointer = useFinePointer()
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const x = useSpring(rawX, { stiffness: 300, damping: 22, mass: 0.4 })
  const y = useSpring(rawY, { stiffness: 300, damping: 22, mass: 0.4 })
  const enabled = !reducedMotion && finePointer

  function onPointerMove(event: ReactPointerEvent<HTMLElement>) {
    if (!enabled || !ref.current) return
    const bounds = ref.current.getBoundingClientRect()
    const centerX = bounds.left + bounds.width / 2
    const centerY = bounds.top + bounds.height / 2
    const dx = event.clientX - centerX
    const dy = event.clientY - centerY
    const distance = Math.hypot(dx, dy)
    const activation = Math.max(bounds.width, bounds.height) / 2 + range
    if (distance > activation) {
      rawX.set(0)
      rawY.set(0)
      return
    }
    rawX.set(dx * strength)
    rawY.set(dy * strength)
  }

  function onPointerLeave() {
    rawX.set(0)
    rawY.set(0)
  }

  return { ref, x, y, onPointerMove, onPointerLeave, enabled }
}

interface TiltOptions {
  max?: number // graus máximos de inclinação
}

// 3D Tilt (Fase 6): inclina o card conforme a posição do ponteiro dentro
// dele. Uso restrito a cards de destaque (IA, planos, módulos especiais).
export function useTilt3D({ max = 8 }: TiltOptions = {}) {
  const ref = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  const finePointer = useFinePointer()
  const rawRotateX = useMotionValue(0)
  const rawRotateY = useMotionValue(0)
  const rotateX = useSpring(rawRotateX, { stiffness: 260, damping: 24 })
  const rotateY = useSpring(rawRotateY, { stiffness: 260, damping: 24 })
  const enabled = !reducedMotion && finePointer

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!enabled || !ref.current) return
    const bounds = ref.current.getBoundingClientRect()
    const px = (event.clientX - bounds.left) / bounds.width - 0.5
    const py = (event.clientY - bounds.top) / bounds.height - 0.5
    rawRotateY.set(px * max * 2)
    rawRotateX.set(-py * max * 2)
  }

  function onPointerLeave() {
    rawRotateX.set(0)
    rawRotateY.set(0)
  }

  return { ref, rotateX, rotateY, onPointerMove, onPointerLeave, enabled }
}

// Spotlight (glass radial highlight — Fase 14/15): posição do cursor
// relativa ao card, expressa como % para alimentar um radial-gradient CSS.
export function useSpotlight() {
  const ref = useRef<HTMLDivElement>(null)
  const rawX = useMotionValue(50)
  const rawY = useMotionValue(50)
  const x = useSpring(rawX, { stiffness: 200, damping: 30 })
  const y = useSpring(rawY, { stiffness: 200, damping: 30 })

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!ref.current) return
    const bounds = ref.current.getBoundingClientRect()
    rawX.set(((event.clientX - bounds.left) / bounds.width) * 100)
    rawY.set(((event.clientY - bounds.top) / bounds.height) * 100)
  }

  return { ref, x, y, onPointerMove }
}
