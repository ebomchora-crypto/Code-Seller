import { supabase, SUPABASE_ANON_KEY, SUPABASE_URL } from './client';
import { splitStreamEnd, visibleStreamText } from '../../../../src/utils/codeMakerStream';
import { joinContinuation } from '../../../../supabase/functions/code-maker/site';

// Pede uma alteração à IA do Code Maker (a mesma do site) e acompanha o texto ao vivo. O servidor aplica,
// confere e salva; quem chama recarrega o projeto depois.
export async function editWithAssistant(siteId: string, instruction: string, onText: (text: string) => void, signal?: AbortSignal): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Sessão expirada. Entre novamente.');
  let partial = '';
  for (let round = 0; round <= 5; round++) {
    let response: Response;
    try {
      response = await fetch(`${SUPABASE_URL}/functions/v1/code-maker`, { method: 'POST', signal, headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'edit', site_id: siteId, instruction, ...(partial ? { partial } : {}) }) });
    } catch (error) { if ((error as Error).name === 'AbortError') throw error; throw new Error('Sem conexão com o servidor. Confira a internet e tente de novo.'); }
    const type = response.headers.get('Content-Type') ?? '';
    if (!response.ok || type.includes('application/json')) { const body = (await response.json().catch(() => ({}))) as { error?: string }; throw new Error(body.error ?? 'Algo deu errado. Tente de novo.'); }
    const reader = response.body?.getReader(); if (!reader) throw new Error('Resposta vazia do servidor.');
    const decoder = new TextDecoder(); let raw = '';
    try {
      while (true) { const { value, done } = await reader.read(); if (done) break; raw += decoder.decode(value, { stream: true }); const visible = visibleStreamText(raw); onText(partial ? joinContinuation(partial, visible) : visible); }
      raw += decoder.decode();
    } catch (error) { if ((error as Error).name === 'AbortError' || signal?.aborted) throw error; raw = visibleStreamText(raw); }
    const { text, end } = splitStreamEnd(raw);
    const full = partial ? joinContinuation(partial, text) : text;
    if (end?.kind === 'ok') return full;
    if (end?.kind === 'error') throw new Error(end.message);
    partial = full;
  }
  throw new Error('A IA demorou demais para terminar. Tente de novo.');
}
