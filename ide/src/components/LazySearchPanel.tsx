import { useState } from 'react';
import { CaseSensitive, ChevronDown, ChevronRight, Loader2, FolderTree } from 'lucide-react';
import { fsSearch } from '../lib/lazyFs';
import { FileIcon } from '../lib/fileIcons';

type Match = { path: string; line: number; text: string };
// Busca no disco em toda a pasta aberta (ignora node_modules, binários e arquivos enormes).
export default function LazySearchPanel({ projectId, onOpen }: { projectId: string; onOpen: (path: string, line: number) => void }) {
  const [query, setQuery] = useState(''); const [sensitive, setSensitive] = useState(false); const [heavy, setHeavy] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [result, setResult] = useState<{ matches: Match[]; scanned: number; truncated: boolean } | null>(null);
  const [closed, setClosed] = useState<Set<string>>(new Set());
  async function run() {
    if (!query.trim()) return; setBusy(true); setError('');
    try { setResult(await fsSearch(projectId, query, sensitive, heavy)); setClosed(new Set()); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  const groups = (result?.matches ?? []).reduce<Record<string, Match[]>>((all, item) => { (all[item.path] ||= []).push(item); return all; }, {});
  return <aside className="h-full w-full flex flex-col overflow-hidden bg-vs-sidebar text-[13px]" aria-label="Busca">
    <div className="h-[35px] shrink-0 flex items-center pl-5"><span className="panel-title">Buscar</span></div>
    <div className="px-3 pb-2 space-y-1.5 shrink-0">
      <div className="relative"><input className="field w-full pr-8" aria-label="Buscar texto" placeholder="Buscar (Enter)" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') void run(); }} />
        <button className="icon-btn absolute right-1 top-[2px]" aria-label="Diferenciar maiúsculas" aria-pressed={sensitive} title="Diferenciar maiúsculas e minúsculas" style={sensitive ? { background: 'var(--vs-toolbar-hover)', color: 'var(--vs-fg-strong)', outline: '1px solid var(--vs-focus)' } : undefined} onClick={() => setSensitive(value => !value)}><CaseSensitive size={16} /></button></div>
      <label className="flex items-center gap-2 text-xs text-vs-muted"><input type="checkbox" checked={heavy} onChange={e => setHeavy(e.target.checked)} /><FolderTree size={13} />Incluir node_modules, dist, build…</label>
      {error && <p className="error-banner" role="alert">{error}</p>}
      <p className="text-xs text-vs-muted flex items-center gap-1.5">{busy ? <><Loader2 size={12} className="animate-spin" />Buscando na pasta…</> : result ? `${result.matches.length}${result.truncated ? '+' : ''} resultado(s) em ${Object.keys(groups).length} arquivo(s) · ${result.scanned} arquivos lidos${result.truncated ? ' · busca parcial: a pasta é muito grande. Refine o termo ou use Ctrl+P para achar por nome' : ''}` : 'Busca em todos os arquivos de texto da pasta.'}</p>
    </div>
    <div className="flex-1 overflow-auto tree-focus">{Object.entries(groups).map(([path, items]) => { const collapsed = closed.has(path); return <div key={path}>
      <button className="list-row pl-1 pr-2" onClick={() => setClosed(previous => { const next = new Set(previous); if (next.has(path)) next.delete(path); else next.add(path); return next; })}>
        {collapsed ? <ChevronRight size={16} className="shrink-0" /> : <ChevronDown size={16} className="shrink-0" />}<FileIcon name={path.split('/').at(-1)!} size={15} /><span className="truncate">{path.split('/').at(-1)}</span><span className="text-vs-dim text-xs truncate">{path}</span><span className="badge ml-auto">{items.length}</span></button>
      {!collapsed && items.map(item => <button key={`${item.path}:${item.line}`} className="list-row pl-8 pr-2" onClick={() => onOpen(item.path, item.line)}><span className="truncate"><span className="text-vs-dim mr-2">{item.line}</span>{item.text.trim()}</span></button>)}</div>; })}</div>
  </aside>;
}
