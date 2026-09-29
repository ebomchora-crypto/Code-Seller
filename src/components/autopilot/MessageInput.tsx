import { CopilotComposer } from '@/components/autopilot/CopilotComposer'
import { CopilotPreferencesBar } from '@/components/autopilot/CopilotPreferencesBar'
import type { CopilotPreferences } from '@/types'

interface MessageInputProps {
  onSend: (content: string) => void
  sending: boolean
  hasContext: boolean
  preferences: CopilotPreferences
  onPreferencesChange: (value: CopilotPreferences) => void
}

export function MessageInput({ onSend, sending, hasContext, preferences, onPreferencesChange }: MessageInputProps) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-2 px-4 pb-4 pt-2 sm:px-8 sm:pb-6">
      <CopilotPreferencesBar value={preferences} onChange={onPreferencesChange} />
      <CopilotComposer onSend={onSend} sending={sending} hasContext={hasContext} />
    </div>
  )
}
