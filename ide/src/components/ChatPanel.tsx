import { useEffect, useRef, useState } from 'react';
import { Bot, Check, FileText, FolderOpen, Globe, Pencil, Search, ShieldCheck, Sparkles, Terminal, Trash2, X, ArrowRight, Wrench } from 'lucide-react';
import { api } from '../lib/api';
import type { Message } from '../lib/chat';
import { answerApproval, streamAgent, type AgentEvent, type AgentMode, type ToolRecord } from '../lib/agent';
import type { Autosave } from '../lib/autosave';
import { useEditorStore } from '../store/editorStore';
import AiSettings from './AiSettings';
import AccountLogin from './AccountLogin';
import AiPromptBox from './AiPromptBox';

type LiveTool = { id: string; name: string; path?: string; command?: string; status: 'running' | 'ok' | 'error'; label?: string; added?: number; removed?: number; detail?: string };
type Approval = { id: string; command: string; trusted: boolean };

const ICONS: Record<string, typeof Wrench> = { listar: FolderOpen, ler: FileText, buscar: Search, procurar_arquivo: Search, web: Globe, escrever: FileText, editar: Pencil, apagar: Trash2, mover: ArrowRight, executar: Terminal };
const WRITES = new Set(['escrever', 'editar', 'apagar', 'mover']);
const ACTION_WORD: Record<string, string> = { escrever: 'escreveu', editar: 'editou', apagar: 'apagou', mover: 'moveu', executar: 'executou' };
const summarize = (tools: ToolRecord[] = []) => tools.filter(tool => tool.ok && (WRITES.has(tool.name) || tool.name === 'executar')).map(tool => `${ACTION_WORD[tool.name]} ${tool.path || tool.label.replace(/^Executou /, '')}`).slice(0, 40);

/** Texto da IA: blocos de código e `código` em linha, o resto como veio. */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(```[\s\S]*?(?:```|$))/g);
  return <>{parts.map((part, index) => {
    if (part.startsWith('```')) { const body = part.replace(/^```[^\n]*\n?/, '').replace(/```$/, ''); return <pre key={index} className="my-2 overflow-auto rounded-md bg-vs-editor border border-vs-border p-2 text-[11px] leading-snug font-mono whitespace-pre">{body}</pre>; }
    return <span key={index}>{part.split(/(`[^`\n]+`|\*\*[^*\n]+\*\*)/g).map((piece, i) => piece.startsWith('`') && piece.endsWith('`') && piece.length > 2 ? <code key={i} className="rounded bg-vs-hover px-1 font-mono text-[11px]">{piece.slice(1, -1)}</code> : piece.startsWith('**') && piece.endsWith('**') && piece.length > 4 ? <strong key={i}>{piece.slice(2, -2)}</strong> : piece)}</span>;
  })}</>;
}

function ToolRow({ tool, onOpen }: { tool: { name: string; path?: string; status: 'running' | 'ok' | 'error'; label?: string; command?: string; added?: number; removed?: number; detail?: string }; onOpen?: (path: string) => void }) {
  const Icon = ICONS[tool.name] ?? Wrench; const [more, setMore] = useState(false);
  const text = tool.label || (tool.command ? `Executando ${tool.command.slice(0, 60)}` : `${tool.name} ${tool.path ?? ''}`);
  return <div className="text-[11px]">
    <div className={`flex items-center gap-2 rounded-md border px-2 py-1 ${tool.status === 'error' ? 'border-red-500/40 text-red-300' : 'border-vs-border text-vs-muted'}`}>
      {tool.status === 'running' ? <span className="cm-dots shrink-0"><span /><span /><span /></span> : <Icon size={12} className={tool.status === 'ok' ? 'text-emerald-400 shrink-0' : 'shrink-0'} />}
      {tool.path && onOpen && WRITES.has(tool.name) && tool.status === 'ok' ? <button className="truncate text-left hover:underline" onClick={() => onOpen(tool.path!)}>{text}</button> : <span className="truncate">{text}</span>}
      {(tool.added || tool.removed) ? <span className="ml-auto shrink-0 font-mono"><span className="text-emerald-400">+{tool.added ?? 0}</span> <span className="text-red-400">−{tool.removed ?? 0}</span></span> : null}
      {tool.detail && <button className="ml-auto shrink-0 text-vs-link" onClick={() => setMore(value => !value)}>{more ? 'ocultar' : 'ver'}</button>}
    </div>
    {more && tool.detail && <pre className="mt-1 max-h-48 overflow-auto rounded-md bg-vs-editor border border-vs-border p-2 font-mono text-[10.5px] whitespace-pre-wrap">{tool.detail}</pre>}
  </div>;
}

export default function ChatPanel({ session, onChanged, onOpen }: { session: Autosave; onChanged?: (paths: string[]) => void | Promise<void>; onOpen?: (path: string) => void }) {
  const id = session.project.id;
  const [messages, setMessages] = useState<Message[]>(() => { try { const data = JSON.parse(localStorage.getItem(`cm-chat-${id}`) || '[]'); return Array.isArray(data) ? data.filter(item => item && ['user', 'assistant'].includes(item.role) && typeof item.content === 'string').slice(-80) : []; } catch { return []; } });
  const [prompt, setPrompt] = useState('');
  const [conversationLoaded, setConversationLoaded] = useState(false);
  const [mode, setMode] = useState<AgentMode>('agent');
  const [auto, setAuto] = useState(() => { try { return localStorage.getItem('cm-agent-auto') === '1'; } catch { return false; } });
  const [busy, setBusy] = useState(false);
  const [liveText, setLiveText] = useState('');
  const [liveTools, setLiveTools] = useState<LiveTool[]>([]);
  const [approval, setApproval] = useState<Approval | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<{ ai: boolean; model: string | null; account?: { signedIn: boolean; email: string } } | null>(null);
  const abort = useRef<AbortController | null>(null);
  const conversationQueue = useRef(Promise.resolve());
  const scroller = useRef<HTMLDivElement>(null);
  const activeFile = useEditorStore(state => state.activeFileId);
  const refreshStatus = () => void api<NonNullable<typeof config>>('/status').then(setConfig).catch(e => setError(e.message));
  useEffect(() => { void api<NonNullable<typeof config>>('/status').then(setConfig).catch(error => setError(error.message)); return () => abort.current?.abort(); }, []);
  useEffect(() => { try { localStorage.setItem(`cm-chat-${id}`, JSON.stringify(messages.slice(-80))); } catch { setError('Não foi possível salvar a conversa no navegador.'); } }, [id, messages]);
  useEffect(() => { try { localStorage.setItem('cm-agent-auto', auto ? '1' : '0'); } catch { /* sem armazenamento */ } }, [auto]);
  useEffect(() => { let alive = true; void api<Message[]>(`/projects/${id}/conversation`).then(items => { if (alive) { if (items.length) setMessages(items); setConversationLoaded(true); } }).catch(e => { if (alive) { setError(e.message); setConversationLoaded(true); } }); return () => { alive = false; }; }, [id]);
  useEffect(() => { if (!conversationLoaded) return; conversationQueue.current = conversationQueue.current.then(() => api(`/projects/${id}/conversation`, 'POST', { messages: messages.slice(-80) })).then(() => {}).catch(e => setError(e.message)); }, [messages, id, conversationLoaded]);
  useEffect(() => { const el = scroller.current; if (el) el.scrollTop = el.scrollHeight; }, [messages, liveText, liveTools, approval]);

  async function send() {
    const text = prompt.trim(); if (!text || busy || !conversationLoaded) return;
    setBusy(true); setError(null); setLiveText(''); setLiveTools([]); setApproval(null); setPrompt('');
    const previous = messages; setMessages([...previous, { role: 'user', content: text }]);
    const history = previous.map(item => ({ role: item.role, content: item.role === 'assistant' && item.tools?.length ? `${item.content}\n[Ações já feitas: ${summarize(item.tools).join('; ')}]` : item.content }));
    const controller = new AbortController(); abort.current = controller;
    let acc = ''; let tools: LiveTool[] = []; const outcome: { done?: { text: string; tools: ToolRecord[] }; failure?: string } = {}; const changed = new Set<string>();
    const push = () => { setLiveTools([...tools]); };
    const onEvent = (event: AgentEvent) => {
      if (event.type === 'text') { acc += event.delta; setLiveText(acc); }
      else if (event.type === 'tool') { tools = [...tools, { id: event.id, name: event.name, path: event.path, command: event.command, status: 'running' }]; push(); }
      else if (event.type === 'approval') setApproval({ id: event.id, command: event.command, trusted: event.trusted });
      else if (event.type === 'tool_result') {
        tools = tools.map(tool => tool.id === event.id ? { ...tool, status: event.ok ? 'ok' : 'error', label: event.label, added: event.added, removed: event.removed, detail: event.detail, path: event.path ?? tool.path } : tool); push(); setApproval(current => current?.id === event.id ? null : current);
        if (event.ok && event.path && WRITES.has(tools.find(tool => tool.id === event.id)?.name ?? '')) { changed.add(event.path); void onChanged?.([event.path]); }
      }
      else if (event.type === 'done') outcome.done = { text: event.text, tools: event.tools };
      else if (event.type === 'error') outcome.failure = event.message;
    };
    try {
      await session.flush();
      await streamAgent(id, { prompt: text, mode, activeFile, messages: history, autoApprove: auto }, controller.signal, onEvent);
    } catch (error) { outcome.failure = (error as Error).name === 'AbortError' ? 'Interrompido. O que já foi feito continua salvo nos arquivos.' : (error as Error).message; }
    const record: ToolRecord[] = outcome.done?.tools ?? tools.filter(tool => tool.status !== 'running').map(tool => ({ name: tool.name, path: tool.path, ok: tool.status === 'ok', label: tool.label ?? tool.name, added: tool.added, removed: tool.removed }));
    const final = outcome.done?.text || acc.trim(); const failure = outcome.failure;
    if (final || record.length) setMessages(items => [...items, { role: 'assistant', content: final || (failure ? 'Parei antes de terminar.' : 'Pronto.'), ...(record.length ? { tools: record } : {}) }]);
    if (failure) setError(failure);
    if (changed.size) void onChanged?.([...changed]);
    setBusy(false); setLiveText(''); setLiveTools([]); setApproval(null); abort.current = null;
  }
  const answer = (allow: boolean, always = false) => { if (!approval) return; if (always) setAuto(true); void answerApproval(id, approval.id, allow); setApproval(null); };
  const stop = () => abort.current?.abort();
  const empty = messages.length === 0 && !busy;
  return <aside className="w-full overflow-hidden bg-vs-sidebar text-[13px] flex flex-col h-full">
    <div className="p-4 border-b border-vs-border"><h2 className="flex gap-2 items-center text-sm font-medium"><Sparkles size={16} className="text-vs-link" /> Assistente de código</h2><p className="text-xs text-vs-dim mt-2">{config?.model || 'Modelo não configurado'}</p><AccountLogin status={config} changed={refreshStatus} /><AiSettings changed={refreshStatus} /></div>
    {!config?.ai && <p className="m-4 text-xs text-vs-warning border border-vs-border p-3">Entre com a sua conta do Code Sellers para ligar o assistente. Se preferir, também dá para usar um modelo próprio em “Configurar modelo de IA”.</p>}
    <div ref={scroller} className="flex-1 overflow-auto p-4 space-y-5">
      {empty && <div className="text-sm text-vs-dim py-6"><p className="text-vs-fg mb-2 flex items-center gap-2"><Bot size={16} className="text-vs-link" /> Peça, e eu faço na sua pasta.</p><p>Eu leio, crio, edito e apago arquivos, rodo comandos e testes — como o Claude Code. Descreva o que quer e acompanhe cada passo aqui.</p></div>}
      {messages.map((message, index) => <div key={index} className={message.role === 'user' ? 'bg-vs-hover rounded-lg p-3' : ''}>
        <p className="text-[10px] uppercase tracking-widest text-vs-dim mb-2">{message.role === 'user' ? 'Você' : 'Assistente'}</p>
        {message.tools && message.tools.length > 0 && <div className="space-y-1 mb-2">{message.tools.filter(tool => WRITES.has(tool.name) || tool.name === 'executar').map((tool, i) => <ToolRow key={i} tool={{ name: tool.name, path: tool.path, status: tool.ok ? 'ok' : 'error', label: tool.label, added: tool.added, removed: tool.removed }} onOpen={onOpen} />)}</div>}
        <div className="text-xs leading-relaxed text-vs-fg whitespace-pre-wrap break-words"><Rich text={message.content} /></div>
      </div>)}
      {busy && <div>
        <p className="text-[10px] uppercase tracking-widest text-vs-dim mb-2">Assistente</p>
        {liveText && <div className="text-xs leading-relaxed text-vs-fg whitespace-pre-wrap break-words mb-2"><Rich text={liveText} /></div>}
        <div className="space-y-1">{liveTools.map(tool => <ToolRow key={tool.id} tool={tool} onOpen={onOpen} />)}</div>
        {!approval && <p className="mt-2 text-[11px] text-vs-dim flex items-center gap-2"><span className="cm-dots"><span /><span /><span /></span> {liveTools.some(tool => tool.status === 'running') ? 'Trabalhando…' : 'Pensando…'}</p>}
      </div>}
      {approval && <div className="rounded-xl border border-violet-500/50 bg-violet-500/10 p-3">
        <p className="flex items-center gap-2 text-xs font-medium mb-2"><ShieldCheck size={14} className="text-violet-300" /> A IA quer executar um comando</p>
        <pre className="max-h-40 overflow-auto rounded-md bg-vs-editor border border-vs-border p-2 font-mono text-[11px] whitespace-pre-wrap break-all">{approval.command}</pre>
        <div className="flex flex-wrap gap-2 mt-3"><button className="btn-primary text-xs" onClick={() => answer(true)}><Check size={13} /> Permitir</button><button className="btn-secondary text-xs" onClick={() => answer(false)}><X size={13} /> Negar</button>{approval.trusted && <button className="btn-secondary text-xs" onClick={() => answer(true, true)}>Permitir sempre</button>}</div>
        {!approval.trusted && <p className="text-[10px] text-vs-dim mt-2">Marque a pasta como confiável (terminal) para poder usar “Permitir sempre”.</p>}
      </div>}
      {error && <p className="error-banner" role="alert">{error}</p>}
    </div>
    <div className="p-3">
      <AiPromptBox value={prompt} onChange={setPrompt} onSend={() => void send()} onStop={stop} busy={busy} disabled={!config?.ai} canSend={!!config?.ai && !!prompt.trim() && conversationLoaded}
        placeholder={mode === 'agent' ? 'O que vamos construir? Eu faço nos arquivos…' : mode === 'plan' ? 'Descreva o que quer planejar…' : 'Pergunte sobre o seu código…'}
        mode={mode} onMode={setMode} auto={auto} onAuto={setAuto} footnote="Enter envia · Shift+Enter quebra a linha" />
    </div>
  </aside>;
}
