import type { CSSProperties } from 'react'

interface SkeletonProps {
  className?: string
  style?: CSSProperties
}

export function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <div
      className={`animate-shimmer rounded-md bg-[var(--bg-muted)] bg-[linear-gradient(110deg,transparent_40%,rgba(255,255,255,0.35)_50%,transparent_60%)] dark:bg-[linear-gradient(110deg,transparent_40%,rgba(255,255,255,0.05)_50%,transparent_60%)] bg-[length:200%_100%] ${className}`}
      style={style}
    />
  )
}
