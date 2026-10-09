import { useMemo, useState } from 'react';
import { CaseSensitive, ChevronDown, ChevronRight } from 'lucide-react';
import { searchFiles, replaceFiles } from '../lib/search';
import { Autosave } from '../lib/autosave';
import { useEditorStore } from '../store/editorStore';
import { askConfirm } from '../lib/dialogs';
import { FileIcon } from '../lib/fileIcons';

export default function SearchPanel({ session, apply }: { session: Autosave; apply: (files: Record<string, string>, label: string) => Promise<void> }) {
  const [query, setQuery] = useState(''); const [replacement, setReplacement] = useState(''); const [sensitive, setSensitive] = useState(false); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const matches = useMemo(() => searchFiles(session.files, query, sensitive), [session.files, query, sensitive]);
  const groups = useMemo(() => matches.reduce<Record<string, typeof matches>>((all, item) => { (all[item.path] ||= []).push(item); return all; }, {}), [matches]);
  async function replaceAll() {
    if (!await askConfirm('Substituir em todos os arquivos?', { description: 'Uma versão será salva no histórico antes da substituição.', confirmLabel: 'Substituir tudo' })) return;
    setBusy(true); setError('');
    try { await apply(replaceFiles(session.files, query, replacement, sensitive), 'Antes da substituição global'); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  function open(path: string, line: number) {
    useEditorStore.getState().openFile({ id: path, name: path.split('/').at(-1)!, type: 'file' }, session.project.id);
    window.dispatchEvent(new CustomEvent('cm-reveal-line', { detail: { line, path } }));
  }
  return <aside className="h-full w-full flex flex-col overflow-hidden bg-vs-sidebar text-[13px]" aria-label="Busca">
    <div className="h-[35px] shrink-0 flex items-center pl-5"><span className="panel-title">Buscar</span></div>
    <div className="px-3 pb-2 space-y-1.5 shrink-0">
      <div className="relative"><input className="field w-full pr-8" aria-label="Buscar texto" placeholder="Buscar" value={query} onChange={e => setQuery(e.target.value)} />
        <button className="icon-btn absolute right-1 top-[2px]" aria-label="Diferenciar maiúsculas" aria-pressed={sensitive} title="Diferenciar maiúsculas e minúsculas" style={sensitive ? { background: 'var(--vs-toolbar-hover)', color: 'var(--vs-fg-strong)', outline: '1px solid var(--vs-focus)' } : undefined} onClick={() => setSensitive(value => !value)}><CaseSensitive size={16} /></button></div>
      <input className="field w-full" aria-label="Substituir por" placeholder="Substituir" value={replacement} onChange={e => setReplacement(e.target.value)} />
      <button className="btn-secondary w-full" disabled={!matches.length || busy} onClick={() => void replaceAll()}>Substituir tudo</button>
      {error && <p className="error-banner" role="alert">{error}</p>}
      <p className="text-xs text-vs-muted">{query ? `${matches.length} resultado(s) em ${Object.keys(groups).length} arquivo(s)${matches.length >= 1000 ? ' (máximo 1000)' : ''}` : 'Digite para buscar texto literal em todo o projeto.'}</p>
    </div>
    <div className="flex-1 overflow-auto tree-focus">{Object.entries(groups).map(([path, items]) => {
      const collapsed = closed.has(path);
      return <div key={path}>
        <button className="list-row pl-1 pr-2" onClick={() => setClosed(previous => { const next = new Set(previous); if (next.has(path)) next.delete(path); else next.add(path); return next; })}>
          {collapsed ? <ChevronRight size={16} className="shrink-0" /> : <ChevronDown size={16} className="shrink-0" />}<FileIcon name={path.split('/').at(-1)!} size={15} /><span className="truncate">{path.split('/').at(-1)}</span><span className="text-vs-dim text-xs truncate">{path}</span><span className="badge ml-auto">{items.length}</span></button>
        {!collapsed && items.map(item => <button key={`${item.path}:${item.line}`} className="list-row pl-8 pr-2" onClick={() => open(item.path, item.line)}><span className="truncate"><span className="text-vs-dim mr-2">{item.line}</span>{item.text.trim()}</span></button>)}
      </div>;
    })}</div>
  </aside>;
}
