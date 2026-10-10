// Agente de código da IDE: o servidor local conversa com a IA e mexe nos arquivos da pasta; aqui chegam os eventos ao vivo.
export type AgentMode = 'agent' | 'ask' | 'plan';
export interface ToolRecord { name: string; path?: string; ok: boolean; label: string; added?: number; removed?: number }
export type AgentEvent =
  | { type: 'text'; delta: string }
  | { type: 'tool'; id: string; name: string; path?: string; command?: string }
  | { type: 'tool_result'; id: string; ok: boolean; label: string; path?: string; added?: number; removed?: number; detail?: string }
  | { type: 'approval'; id: string; command: string; trusted: boolean }
  | { type: 'done'; text: string; changed: string[]; tools: ToolRecord[] }
  | { type: 'error'; message: string };

export async function streamAgent(projectId: string, body: unknown, signal: AbortSignal, onEvent: (event: AgentEvent) => void): Promise<void> {
  const response = await fetch(`/api/projects/${projectId}/agent`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal });
  if (!response.ok) { const data = await response.json().catch(() => null); throw new Error(data?.error || 'Erro de IA.'); }
  if (!response.body) throw new Error('Resposta sem conteúdo.');
  const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ''; let ended = false;
  const consume = (block: string) => {
    const line = block.split('\n').find(item => item.startsWith('data:')); if (!line) return;
    const data = JSON.parse(line.slice(5).trim());
    if (data.error) { ended = true; onEvent({ type: 'error', message: typeof data.error === 'string' ? data.error : 'Erro de IA.' }); return; }
    if (data.type === 'done' || data.type === 'error') ended = true;
    onEvent(data as AgentEvent);
  };
  try {
    for (;;) {
      const { value, done } = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      const blocks = buffer.split('\n\n'); buffer = blocks.pop() || '';
      blocks.forEach(consume);
      if (done) { if (buffer.trim()) consume(buffer); break; }
    }
  } finally { await reader.cancel().catch(() => {}); }
  if (!ended && !signal.aborted) onEvent({ type: 'error', message: 'A conexão com a IA caiu no meio da tarefa. O que já foi feito continua salvo nos arquivos.' });
}

export async function answerApproval(projectId: string, id: string, allow: boolean): Promise<void> {
  await fetch(`/api/projects/${projectId}/agent/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, allow }) });
}
