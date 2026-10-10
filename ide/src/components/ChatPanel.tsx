import { useEffect, useRef, useState } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import '../lib/monaco';
import { Send, Square, Sparkles, X, Check } from 'lucide-react';
import { api } from '../lib/api';
import { streamChat, Message } from '../lib/chat';
import { applyProposal, parseProposal, Proposal } from '../lib/proposals';
import type { Autosave } from '../lib/autosave';
import { useEditorStore } from '../store/editorStore';
import AiSettings from './AiSettings';
import AccountLogin from './AccountLogin';
import { useMonacoTheme } from '../lib/monacoTheme';

export default function ChatPanel({ session, apply, modes }: { modes?: string[]; session: Autosave; apply: (files: Record<string, string>, label: string) => Promise<void> }) {
  const id = session.project.id;
  const [messages, setMessages] = useState<Message[]>(() => { try { const data = JSON.parse(localStorage.getItem(`cm-chat-${id}`) || '[]'); return Array.isArray(data) ? data.filter(item => item && ['user', 'assistant'].includes(item.role) && typeof item.content === 'string').slice(-80) : []; } catch { return []; } });
  const [prompt, setPrompt] = useState('');
  const [conversationLoaded, setConversationLoaded] = useState(false);
  const [mode, setMode] = useState('ask');
  const [busy, setBusy] = useState(false);
  const [partial, setPartial] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<{ ai: boolean; model: string | null; account?: { signedIn: boolean; email: string } } | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [base, setBase] = useState<Record<string, string> | null>(null);
  const [diff, setDiff] = useState(0);
  const abort = useRef<AbortController | null>(null);
  const conversationQueue = useRef(Promise.resolve());
  const activeFile = useEditorStore(state => state.activeFileId);
  const theme = useMonacoTheme();
  const refreshStatus = () => void api<NonNullable<typeof config>>('/status').then(setConfig).catch(e => setError(e.message));
  useEffect(() => { void api<NonNullable<typeof config>>('/status').then(setConfig).catch(error => setError(error.message)); return () => abort.current?.abort(); }, []);
  useEffect(() => { try { localStorage.setItem(`cm-chat-${id}`, JSON.stringify(messages.slice(-80))); } catch { setError('Não foi possível salvar a conversa no navegador. Exporte o código para preservar o projeto.'); } }, [id, messages]);
  async function send() {
    if (!prompt.trim() || busy || !conversationLoaded) return;
    setBusy(true); setError(null); setPartial(''); setProposal(null);
    const text = prompt; setPrompt('');
    const previous = messages; setMessages([...previous, { role: 'user', content: text }]);
    const controller = new AbortController(); abort.current = controller;
    try {
      await session.flush();
      const snapshot = session.files;
      const answer = await streamChat(id, { prompt: text, mode, activeFile, messages: previous }, controller.signal, setPartial);
      if (mode === 'agent' || mode === 'edit') {
        const next = parseProposal(answer);
        if (mode === 'edit' && next.changes.some(change => change.path !== activeFile)) throw new Error('O modo Edit propôs alterações fora do arquivo ativo. Use Agent para vários arquivos.');
        applyProposal(snapshot, next);
        setProposal(next); setBase(snapshot); setDiff(0);
        setMessages(items => [...items, { role: 'assistant', content: next.summary }]);
      } else setMessages(items => [...items, { role: 'assistant', content: answer }]);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') setError((error as Error).message);
      else setError('Geração interrompida. Nenhum arquivo foi alterado.');
    } finally { setBusy(false); setPartial(''); abort.current = null; }
  }
  useEffect(() => { let alive = true; void api<Message[]>(`/projects/${id}/conversation`).then(items => { if (alive) { if (items.length) setMessages(items); setConversationLoaded(true); } }).catch(e => { if (alive) { setError(e.message); setConversationLoaded(true); } }); return () => { alive = false; }; }, [id]);
  useEffect(() => { if (!conversationLoaded) return; conversationQueue.current = conversationQueue.current.then(() => api(`/projects/${id}/conversation`, 'POST', { messages: messages.slice(-80) })).then(() => {}).catch(e => setError(e.message)); }, [messages, id, conversationLoaded]);
  async function accept() {
    if (!proposal || !base) return;
    setBusy(true); setError(null);
    try {
      if (JSON.stringify(base) !== JSON.stringify(session.files)) throw new Error('O código mudou depois da proposta. Gere uma nova proposta para preservar suas edições.');
      await apply(applyProposal(session.files, proposal), 'Antes da IA'); setProposal(null);
    } catch (error) { setError((error as Error).message); } finally { setBusy(false); }
  }
  return <aside className="w-full overflow-hidden bg-vs-sidebar text-[13px] flex flex-col h-full">
    <div className="p-4 border-b border-vs-border"><h2 className="flex gap-2 items-center text-sm font-medium"><Sparkles size={16} className="text-vs-link" /> Assistente de código</h2><p className="text-xs text-vs-dim mt-2">{config?.model || 'Modelo não configurado'}</p><AccountLogin status={config} changed={refreshStatus} /><AiSettings changed={refreshStatus} /></div>
    {!config?.ai && <p className="m-4 text-xs text-vs-warning border border-vs-border p-3">Entre com a sua conta do Code Sellers para ligar o assistente. Se preferir, também dá para usar um modelo próprio em “Configurar modelo de IA”.</p>}
    <div className="flex-1 overflow-auto p-4 space-y-5">{messages.length === 0 && <div className="text-sm text-vs-dim py-6"><p className="text-vs-fg mb-2">Uma ideia. Um próximo passo.</p><p>Pergunte sobre o código ou peça uma alteração. Você revisa os arquivos antes de aplicar.</p></div>}{messages.map((message, index) => <div key={index} className={message.role === 'user' ? 'bg-vs-hover rounded-sm p-3' : ''}><p className="text-[10px] uppercase tracking-widest text-vs-dim mb-2">{message.role === 'user' ? 'Você' : 'Assistente'}</p><p className="text-xs leading-relaxed text-vs-fg whitespace-pre-wrap break-words">{message.content}</p></div>)}{partial && <p className="text-xs whitespace-pre-wrap text-vs-muted break-words">{partial}</p>}
    {proposal && base && <div className="border border-vs-border p-3"><p className="text-xs text-vs-link mb-3">{proposal.changes.length} arquivo(s) proposto(s)</p><select className="field w-full text-xs mb-2" aria-label="Arquivo da proposta" value={diff} onChange={e => setDiff(Number(e.target.value))}>{proposal.changes.map((change, index) => <option value={index} key={change.path}>{change.content === null ? 'Excluir' : base[change.path] === undefined ? 'Criar' : 'Editar'} {change.path}</option>)}</select><DiffEditor keepCurrentOriginalModel keepCurrentModifiedModel height="200px" theme={theme} original={base[proposal.changes[diff].path] || ''} modified={proposal.changes[diff].content || ''} options={{ readOnly: true, renderSideBySide: false, minimap: { enabled: false } }} /><div className="flex gap-2 mt-3"><button className="btn-primary text-xs flex-1" disabled={busy} onClick={() => void accept()}><Check size={13} /> Aplicar</button><button className="btn-secondary text-xs" disabled={busy} onClick={() => setProposal(null)}><X size={13} /> Rejeitar</button></div><p className="text-[10px] text-vs-dim mt-2">Um checkpoint será salvo antes de aplicar.</p></div>}
    {error && <p className="error-banner" role="alert">{error}</p>}</div>
    <div className="p-3 border-t border-vs-border"><select className="field text-xs mb-2 w-full" aria-label="Modo de IA" value={mode} onChange={e => setMode(e.target.value)} disabled={busy}>{(!modes || modes.includes('ask')) && <option value="ask">Ask · perguntar</option>}{(!modes || modes.includes('plan')) && <option value="plan">Plan · planejar</option>}{(!modes || modes.includes('agent')) && <option value="agent">Agent · vários arquivos</option>}{(!modes || modes.includes('edit')) && <option value="edit">Edit · arquivo ativo</option>}</select><textarea className="field w-full text-xs resize-none" rows={3} placeholder="O que vamos construir?" value={prompt} maxLength={12000} onChange={e => setPrompt(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void send(); } }} /><div className="flex items-center justify-between mt-2"><span className="text-[10px] text-vs-dim">Ctrl + Enter para enviar</span>{busy ? abort.current ? <button className="btn-secondary text-xs" onClick={() => abort.current?.abort()}><Square size={12} /> Parar</button> : <span className="text-xs text-vs-dim">Aplicando…</span> : <button className="btn-primary text-xs" disabled={!config?.ai || !prompt.trim() || (mode === 'edit' && !activeFile)} onClick={() => void send()}><Send size={13} /> Enviar</button>}</div></div>
  </aside>;
}
