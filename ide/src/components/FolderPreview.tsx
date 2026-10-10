import { useEffect, useState } from 'react';
import { ExternalLink, RotateCw } from 'lucide-react';
import { api } from '../lib/api';

export type PreviewTarget = { kind: 'static' } | { kind: 'url'; url: string };

/** Site do projeto aberto: HTML simples é servido pela própria IDE; apps com servidor (React, Next, Node) abrem o endereço que o terminal mostrar. */
export default function FolderPreview({ projectId, target, reloadKey, onUrl, running }: { projectId: string; target: PreviewTarget; reloadKey: number; onUrl: (url: string) => void; running: boolean }) {
  const [staticUrl, setStaticUrl] = useState<string | null>(null); const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState(target.kind === 'url' ? target.url : ''); const [bump, setBump] = useState(0);
  useEffect(() => { if (target.kind === 'url') setManual(target.url); }, [target]);
  useEffect(() => {
    if (target.kind !== 'static') return; let alive = true; setError(null);
    void api<{ url: string }>(`/projects/${projectId}/fs/serve`, 'POST', {}).then(result => { if (alive) setStaticUrl(result.url); }).catch(e => { if (alive) setError((e as Error).message); });
    return () => { alive = false; };
  }, [projectId, target.kind]);
  const url = target.kind === 'static' ? staticUrl : target.url;
  const openOutside = () => { if (url) void api('/open-external', 'POST', { url }).catch(e => setError((e as Error).message)); };
  return <section className="flex flex-col h-full" style={{ background: 'var(--vs-sidebar)' }} aria-label="Visualização do projeto">
    <div className="flex items-center gap-1.5 px-2 py-1.5 border-b" style={{ borderColor: 'var(--vs-border)' }}>
      <button className="icon-btn" aria-label="Recarregar" title="Recarregar" onClick={() => setBump(value => value + 1)}><RotateCw size={14} /></button>
      {target.kind === 'url'
        ? <form className="flex-1 min-w-0" onSubmit={event => { event.preventDefault(); onUrl(manual.trim()); }}><input className="field w-full" aria-label="Endereço do site" value={manual} onChange={e => setManual(e.target.value)} placeholder="http://localhost:5173" /></form>
        : <span className="flex-1 min-w-0 truncate text-xs" style={{ color: 'var(--vs-fg-muted)' }}>{url ?? 'Iniciando…'}</span>}
      <button className="icon-btn" aria-label="Abrir no navegador" title="Abrir no navegador" onClick={openOutside} disabled={!url}><ExternalLink size={14} /></button>
    </div>
    {error ? <p role="alert" className="error-banner m-3">{error}</p>
      : url ? <iframe key={`${url}:${reloadKey}:${bump}`} title="Site do projeto" src={url} className="flex-1 w-full border-0" style={{ background: '#fff' }} sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin" />
      : <p className="p-4 text-xs" style={{ color: 'var(--vs-fg-dim)' }}>Carregando…</p>}
    {target.kind === 'url' && <p className="px-3 py-2 text-xs border-t" style={{ borderColor: 'var(--vs-border)', color: 'var(--vs-fg-dim)' }}>{running ? 'O servidor está iniciando no terminal. Quando ele mostrar o endereço (ex.: http://localhost:5173), confira acima e aperte Enter.' : 'Aperte Executar para iniciar o servidor do projeto.'}</p>}
  </section>;
}
