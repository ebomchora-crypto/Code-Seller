import { useEffect, useRef, useState } from 'react';
import { Monitor, Tablet, Smartphone, RotateCcw, ExternalLink, Trash2 } from 'lucide-react';
import { api, ProjectDetail } from '../lib/api';
interface Build { html: string | null; channel: string; errors: string[]; warnings: string[] }
interface Log { level: string; text: string }
export default function Preview({ project, files }: { project: ProjectDetail; files: Record<string, string> }) {
  const [width, setWidth] = useState('100%');
  const [restart, setRestart] = useState(0);
  const [consoleVisible, setConsoleVisible] = useState(true);
  const [build, setBuild] = useState<Build | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    let alive = true;
    setBusy(true); setError(null);
    const timer = setTimeout(() => {
      api<Build>(`/projects/${project.id}/preview`, 'POST', { files }).then(result => {
        if (!alive) return;
        setBuild(result); setLogs([]); setBusy(false);
      }).catch(error => { if (alive) { setError(error.message); setBusy(false); } });
    }, 450);
    return () => { alive = false; clearTimeout(timer); };
  }, [project.id, files, restart]);
  useEffect(() => {
    const message = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || !build || event.data?.channel !== build.channel || typeof event.data.text !== 'string') return;
      const level = ['log', 'info', 'warn', 'error'].includes(event.data.level) ? event.data.level : 'log';
      setLogs(items => [...items.slice(-299), { level, text: event.data.text.slice(0, 4000) }]);
    };
    window.addEventListener('message', message);
    return () => window.removeEventListener('message', message);
  }, [build]);
  const errors = error ? [error] : build?.errors || [];
  return <section className="flex flex-col h-full bg-vs-sidebar">
    <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-vs-border"><span className="text-xs text-vs-muted">Preview local</span><div className="flex items-center"><button className="icon-btn" aria-label="Preview desktop" onClick={() => setWidth('100%')}><Monitor size={15} /></button><button className="icon-btn" aria-label="Preview tablet" onClick={() => setWidth('768px')}><Tablet size={15} /></button><button className="icon-btn" aria-label="Preview mobile" onClick={() => setWidth('375px')}><Smartphone size={15} /></button><button className="icon-btn" aria-label="Reiniciar preview" onClick={() => setRestart(value => value + 1)}><RotateCcw size={15} /></button><a className="icon-btn" aria-label="Abrir preview em outra aba" href={`/preview/${project.id}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} /></a><button className="text-xs text-vs-dim px-2" onClick={() => setConsoleVisible(!consoleVisible)}>Console</button></div></div>
    <div className="text-[10px] text-vs-dim px-3 py-2 border-b border-vs-border-soft">{busy ? 'Compilando localmente…' : errors.length ? 'Falha de compilação' : 'Compilado · React / HTML / CSS / JS'}</div>
    {errors.length ? <div className="flex-1 overflow-auto p-4 text-xs text-vs-error whitespace-pre-wrap" role="alert">{errors.join('\n\n')}</div> : <div className="flex-1 min-h-0 overflow-auto flex justify-center bg-vs-editor">{build?.html ? <iframe key={build.channel} ref={frame} title="Aplicação em execução" sandbox="allow-scripts" srcDoc={build.html} style={{ width, maxWidth: '100%', minWidth: 280, height: '100%', border: 0, background: 'white' }} /> : <p className="text-sm text-vs-dim m-auto">Preparando preview…</p>}</div>}
    {consoleVisible && <div className="h-40 shrink-0 flex flex-col border-t border-vs-border"><div className="flex justify-between items-center px-3 py-2 text-xs text-vs-dim"><span>Console · {logs.length} mensagens</span><button className="icon-btn" aria-label="Limpar console" onClick={() => setLogs([])}><Trash2 size={12} /></button></div><div className="overflow-auto flex-1 px-3 pb-3 font-mono text-[11px]">{build?.warnings.map((warning, index) => <p key={`warning-${index}`} className="text-vs-warning">{warning}</p>)}{logs.length ? logs.map((log, index) => <p key={index} className={`border-b border-vs-border-soft py-1 whitespace-pre-wrap break-words ${log.level === 'error' ? 'text-vs-error' : log.level === 'warn' ? 'text-vs-warning' : 'text-vs-muted'}`}>[{log.level}] {log.text}</p>) : <p className="text-vs-dim">Logs e erros de execução aparecem aqui.</p>}</div></div>}
  </section>;
}
