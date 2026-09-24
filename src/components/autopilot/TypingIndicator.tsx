import { Sparkles } from 'lucide-react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { TextScramble } from '@/components/motion/TextScramble'

export function TypingIndicator() {
  const reducedMotion = useReducedMotion()
  return (
    <div className="flex animate-fade-in items-center gap-3 py-2">
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent-bright/30 bg-accent-bright/10 text-accent-bright">
        {!reducedMotion && (
          <>
            <span className="absolute inset-1 animate-radar-ping rounded-full border border-accent-bright/40" />
            <span className="absolute inset-2 animate-pulse rounded-full border border-accent-bright/50" />
          </>
        )}
        <Sparkles className="relative h-3.5 w-3.5" />
      </span>
      <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-white/[0.10] bg-white/[0.06] px-4 py-3 backdrop-blur-xl">
        <TextScramble text="AutoPilot está pensando..." className="text-xs text-[var(--text-muted)]" />
      </div>
    </div>
  )
}
