import { useEffect, type RefObject } from 'react'
import Lenis from 'lenis'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { SCROLL_TOP_EVENT } from '@/utils/appScroll'

// Easing expo-out — mesma curva usada nas animações de entrada (EASE_PREMIUM),
// para o scroll suave "combinar" com o resto das transições do app.
function expoOut(t: number): number {
  return Math.min(1, 1.001 - Math.pow(2, -10 * t))
}

// O scroll do app acontece dentro do <main> (overflow-y-auto do AppLayout),
// não na window — por isso o Lenis precisa apontar para esse elemento como
// wrapper/content, em vez de usar o padrão (document/window).
export function useLenis(wrapperRef: RefObject<HTMLElement | null>, contentRef: RefObject<HTMLElement | null>) {
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (reducedMotion) return
    if (!wrapperRef.current || !contentRef.current) return

    const lenis = new Lenis({
      wrapper: wrapperRef.current,
      content: contentRef.current,
      duration: 1.2,
      easing: expoOut,
      smoothWheel: true,
      touchMultiplier: window.matchMedia('(max-width: 767px)').matches ? 1 : 2,
    })

    let frameId: number
    function raf(time: number) {
      lenis.raf(time)
      frameId = requestAnimationFrame(raf)
    }
    frameId = requestAnimationFrame(raf)

    function handleScrollTop(event: Event) {
      event.preventDefault()
      const smooth = (event as CustomEvent<{ smooth: boolean }>).detail?.smooth
      lenis.scrollTo(0, { immediate: !smooth, force: true })
    }
    window.addEventListener(SCROLL_TOP_EVENT, handleScrollTop)

    return () => {
      window.removeEventListener(SCROLL_TOP_EVENT, handleScrollTop)
      cancelAnimationFrame(frameId)
      lenis.destroy()
    }
  }, [contentRef, reducedMotion, wrapperRef])
}
