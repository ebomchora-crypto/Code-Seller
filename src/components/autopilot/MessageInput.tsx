import { CopilotComposer } from '@/components/autopilot/CopilotComposer'

interface MessageInputProps {
  onSend: (content: string) => void
  sending: boolean
  hasContext: boolean
}

export function MessageInput({ onSend, sending, hasContext }: MessageInputProps) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-4 pt-2 sm:px-8 sm:pb-6">
      <CopilotComposer onSend={onSend} sending={sending} hasContext={hasContext} />
    </div>
  )
}
