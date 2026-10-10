import type { ToolRecord } from './agent';
export interface Message { role: 'user' | 'assistant'; content: string; tools?: ToolRecord[] }
export async function streamChat(id: string, body: unknown, signal: AbortSignal, onChunk: (text: string) => void): Promise<string> {
  const response = await fetch(`/api/projects/${id}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal });
  if (!response.ok) { const data = await response.json(); throw new Error(data.error || 'Erro de IA.'); }
  if (!response.body) throw new Error('Resposta sem conteúdo.');
  const reader = response.body.getReader(); const decoder = new TextDecoder();
  let buffer = ''; let full = ''; let finished = false;
  const consume = (line: string) => {
    if (!line.startsWith('data:')) return;
    const text = line.slice(5).trim();
    if (text === '[DONE]') { finished = true; return; }
    if (!text) return;
    const data = JSON.parse(text);
    if (data.error) throw new Error(typeof data.error === 'string' ? data.error : data.error.message || 'Erro no provedor.');
    const content = data.choices?.[0]?.delta?.content;
    if (typeof content === 'string') { full += content; onChunk(full); }
    if (data.choices?.[0]?.finish_reason) finished = true;
  };
  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      const lines = buffer.split('\n'); buffer = lines.pop() || '';
      lines.forEach(consume);
      if (done) { if (buffer) consume(buffer); break; }
    }
  } finally { await reader.cancel(); }
  if (!finished || !full.trim()) throw new Error('A resposta da IA terminou incompleta. Nenhuma alteração foi aplicada.');
  return full;
}
