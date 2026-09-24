import { V0AiChat } from '@/components/ui/v0-ai-chat'

interface MessageInputProps {
  onSend: (content: string) => void
  sending: boolean
  hasContext: boolean
}

export function MessageInput({ onSend, sending, hasContext }: MessageInputProps) {
  return <V0AiChat onSend={onSend} sending={sending} hasContext={hasContext} variant="compact" />
}
