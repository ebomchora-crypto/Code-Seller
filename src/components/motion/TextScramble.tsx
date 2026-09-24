import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '@/motion/hooks'

const SCRAMBLE_CHARS = '!<>-_\\/[]{}—=+*^?#'

interface TextScrambleProps {
  text: string
  className?: string
  /** Duração total do "embaralhamento até formar a frase" (Fase 5). */
  duration?: number
}

// Text Scramble (Fase 5/7): usar em loading de IA, busca de leads e estados
// futuristas — nunca em texto operacional comum (labels, tabelas).
export function TextScramble({ text, className, duration = 500 }: TextScrambleProps) {
  const reducedMotion = useReducedMotion()
  const [display, setDisplay] = useState(reducedMotion ? text : '')
  const frameRef = useRef<number>(0)

  useEffect(() => {
    if (reducedMotion) {
      setDisplay(text)
      return
    }

    const startTime = performance.now()
    let raf = 0

    function tick(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / duration)
      const revealCount = Math.floor(progress * text.length)

      let next = ''
      for (let i = 0; i < text.length; i++) {
        if (i < revealCount || text[i] === ' ') {
          next += text[i]
        } else {
          next += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
        }
      }
      setDisplay(next)

      if (progress < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        setDisplay(text)
      }
    }

    raf = requestAnimationFrame(tick)
    frameRef.current = raf
    return () => cancelAnimationFrame(frameRef.current)
  }, [text, duration, reducedMotion])

  return (
    <span className={className} aria-label={text}>
      {display}
    </span>
  )
}
