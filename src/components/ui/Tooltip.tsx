import type { ReactNode } from 'react'

interface TooltipProps {
  content: string
  children: ReactNode
}

export function Tooltip({ content, children }: TooltipProps) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-max max-w-[200px] -translate-x-1/2 rounded-md bg-neutral-900 px-2.5 py-1.5 text-center text-xs text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100"
      >
        {content}
      </span>
    </span>
  )
}
