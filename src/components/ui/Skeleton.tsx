import type { CSSProperties } from 'react'

interface SkeletonProps {
  className?: string
  style?: CSSProperties
}

export function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <div
      className={`animate-shimmer rounded-md bg-neutral-200/70 bg-[linear-gradient(110deg,transparent_40%,rgba(255,255,255,0.6)_50%,transparent_60%)] bg-[length:200%_100%] ${className}`}
      style={style}
    />
  )
}
