import { CopilotOrb } from '@/components/autopilot/CopilotOrb'

export function TypingIndicator({ onCancel }: { onCancel?: () => void }) {
  return (
    <div className="flex animate-fade-in items-center gap-3" role="status">
      <CopilotOrb size="sm" thinking />
      <span className="flex items-center gap-2 text-[13px] text-[var(--text-muted)]">
        Analisando conversa...
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
      {onCancel && <button type="button" onClick={onCancel} className="ml-auto text-xs text-[var(--text-muted)] underline">Cancelar</button>}
    </div>
  )
}
