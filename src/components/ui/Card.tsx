import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hover?: boolean
  accent?: boolean
}

export function Card({ children, className = '', hover = false, accent = false, ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border p-6 shadow-[var(--shadow-card)] transition-all duration-200 ${
        accent
          ? 'border-[var(--purple-border)] bg-[var(--purple-soft)]'
          : 'border-[var(--border-subtle)] bg-[var(--bg-card)]'
      } ${hover ? 'hover:border-[var(--border-default)] hover:shadow-[var(--shadow-modal)] dark:hover:shadow-[0_0_30px_rgba(179,92,255,0.08)]' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
