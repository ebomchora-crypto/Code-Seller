export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export function splitText(text: string, size: number): string[] {
  if (!Number.isInteger(size) || size < 1) throw new Error('Invalid chunk size')
  const chunks: string[] = []
  let offset = 0
  while (offset < text.length) {
    let end = Math.min(offset + size, text.length)
    if (end < text.length) {
      const boundary = Math.max(text.lastIndexOf('\n', end), text.lastIndexOf(' ', end))
      if (boundary > offset + size / 2) end = boundary + 1
    }
    chunks.push(text.slice(offset, end))
    offset = end
  }
  return chunks
}

export function copilotParts(messages: ChatMessage[]): {
  instructions: ChatMessage
  context: ChatMessage
  history: ChatMessage[]
  current: ChatMessage
} {
  if (messages.length < 3 || messages[0].role !== 'system' || messages[1].role !== 'system' ||
    messages.at(-1)?.role !== 'user') throw new Error('Invalid Copilot conversation')
  return { instructions: messages[0], context: messages[1],
    history: messages.slice(2, -1), current: messages.at(-1)! }
}
