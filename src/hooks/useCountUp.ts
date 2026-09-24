import { useEffect, useRef, useState } from 'react'

export function useCountUp(target: number, durationMs = 600): number {
  const [value, setValue] = useState(0)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    const start = performance.now()
    const from = 0

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(1, elapsed / durationMs)
      const eased = 1 - (1 - progress) * (1 - progress)
      setValue(from + (target - from) * eased)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        setValue(target)
      }
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [target, durationMs])

  return value
}
