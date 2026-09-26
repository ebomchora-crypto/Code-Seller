import { CopilotOrb } from '@/components/autopilot/CopilotOrb'

export function TypingIndicator() {
  return (
    <div className="flex animate-fade-in items-center gap-3" role="status">
      <CopilotOrb size="sm" thinking />
      <span className="flex items-center gap-2 text-[13px] text-[var(--text-muted)]">
        CS Copilot está pensando
        <span className="flex gap-1" aria-hidden>
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className="size-1.5 animate-dot-bounce rounded-full bg-[var(--accent-solid)]"
              style={{ animationDelay: `${dot * 0.15}s` }}
            />
          ))}
        </span>
      </span>
    </div>
  )
}
