import type { ReactNode, RefObject } from 'react'
import { useLenis } from '@/hooks/useLenis'

interface SmoothScrollProviderProps {
  wrapperRef: RefObject<HTMLElement | null>
  contentRef: RefObject<HTMLElement | null>
  children: ReactNode
}

// Ativa o scroll suave (Lenis) sobre o elemento de scroll do AppLayout.
// Desliga automaticamente com prefers-reduced-motion (ver useLenis).
export function SmoothScrollProvider({ wrapperRef, contentRef, children }: SmoothScrollProviderProps) {
  useLenis(wrapperRef, contentRef)
  return <>{children}</>
}
