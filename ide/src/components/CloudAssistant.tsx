import { useRef, useState } from 'react';
import { Send, Square, Sparkles } from 'lucide-react';
import { api, ProjectDetail } from '../lib/api';
import { editWithAssistant } from '../lib/cloud/assistant';
import { useEditorStore } from '../store/editorStore';
import type { Autosave } from '../lib/autosave';

type Message = { role: 'user' | 'assistant'; content: string };
const clean = (text: string) => text.replace(/<\/?arquivos>/g, '').replace(/<\/?[a-z]+>/gi, '').trim();
// Assistente da IDE no site: usa a mesma IA do Code Maker, que altera os arquivos do site e salva com histórico.
export default function CloudAssistant({ session }: { session: Autosave }) {
  const id = session.project.id;
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState(''); const [busy, setBusy] = useState(false); const [partial, setPartial] = useState(''); const [error, setError] = useState('');
  const abort = useRef<AbortController | null>(null);
  async function send() {
    const text = prompt.trim(); if (!text || busy) return;
    setPrompt(''); setBusy(true); setError(''); setPartial(''); setMessages(items => [...items, { role: 'user', content: text }]);
    const controller = new AbortController(); abort.current = controller;
    try {
      await session.flush();
      const answer = await editWithAssistant(id, text, value => setPartial(clean(value)), controller.signal);
      const project = await api<ProjectDetail>(`/projects/${id}`);
      session.replace(project); useEditorStore.getState().syncFiles(project.files, id);
      setMessages(items => [...items, { role: 'assistant', content: clean(answer) || 'Pronto.' }]);
    } catch (e) { setError((e as Error).name === 'AbortError' ? 'Interrompido.' : (e as Error).message); }
    finally { setBusy(false); setPartial(''); abort.current = null; }
  }
  return <aside className="w-full overflow-hidden bg-vs-sidebar text-[13px] flex flex-col h-full" aria-label="Assistente de IA">
    <div className="p-4 border-b border-vs-border"><h2 className="flex gap-2 items-center text-sm font-medium"><Sparkles size={16} className="text-vs-link" /> Assistente do Code Maker</h2><p className="text-xs text-vs-dim mt-2">Peça uma mudança no site. A IA altera os arquivos e salva uma versão no histórico.</p></div>
    <div className="flex-1 overflow-auto p-4 space-y-4">
      {!messages.length && !partial && <p className="text-vs-dim text-sm">Ex.: “troque a cor principal para verde” ou “crie uma página de contato”.</p>}
      {messages.map((message, index) => <div key={index} className={message.role === 'user' ? 'bg-vs-hover rounded-sm p-3' : ''}><p className="text-[10px] uppercase tracking-widest text-vs-dim mb-1.5">{message.role === 'user' ? 'Você' : 'Assistente'}</p><p className="text-xs leading-relaxed text-vs-fg whitespace-pre-wrap break-words">{message.content}</p></div>)}
      {partial && <p className="text-xs whitespace-pre-wrap text-vs-muted break-words">{partial}</p>}
      {error && <p className="error-banner" role="alert">{error}</p>}
    </div>
    <div className="p-3 border-t border-vs-border">
      <textarea className="field w-full text-xs resize-none" rows={3} placeholder="O que vamos mudar no site?" value={prompt} maxLength={4000} onChange={e => setPrompt(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void send(); } }} />
      <div className="flex items-center justify-between mt-2"><span className="text-[10px] text-vs-dim">Ctrl + Enter para enviar</span>
        {busy ? <button className="btn-secondary text-xs" onClick={() => abort.current?.abort()}><Square size={12} /> Parar</button> : <button className="btn-primary text-xs" disabled={!prompt.trim()} onClick={() => void send()}><Send size={13} /> Enviar</button>}</div>
    </div>
  </aside>;
}
