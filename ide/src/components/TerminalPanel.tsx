import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { Plus, X, TerminalSquare, RotateCw, Square, Download, ShieldOff } from 'lucide-react';
import { api } from '../lib/api';
import { askConfirm } from '../lib/dialogs';
import type { TerminalRequest } from '../lib/terminalBridge';
import { themeColor, usePreferences } from '../lib/preferences';
type Workspace = { path: string; trusted: boolean; scripts: Record<string, string>; shell: string };
function xtermTheme() {
  return { background: themeColor('--vs-panel', '#1e1e1e'), foreground: themeColor('--vs-fg', '#cccccc'), cursor: themeColor('--vs-fg', '#cccccc'), selectionBackground: themeColor('--vs-selection', '#264f78') };
}
function TerminalSession({ projectId, active }: { projectId: string; active: boolean }) {
  const element = useRef<HTMLDivElement>(null); const connection = useRef<WebSocket>();
  const terminal = useRef<Terminal>();
  const theme = usePreferences(state => state.theme + state.editorBg + state.accent);
  const [workspace, setWorkspace] = useState<Workspace>(); const [error, setError] = useState(''); const [generation, setGeneration] = useState(0); const [connected, setConnected] = useState(false);
  useEffect(() => { let alive = true; api<Workspace>(`/projects/${projectId}/workspace`).then(data => { if (alive) setWorkspace(data); }).catch(e => { if (alive) setError(e.message); }); return () => { alive = false; }; }, [projectId, generation]);
  useEffect(() => { if (terminal.current) terminal.current.options.theme = xtermTheme(); }, [theme]);
  useEffect(() => {
    if (!workspace?.trusted || !element.current) return;
    const term = new Terminal({ cursorBlink: true, fontSize: 13, fontFamily: "'Cascadia Code', 'Cascadia Mono', Consolas, monospace", theme: xtermTheme(), scrollback: 5000 });
    terminal.current = term;
    const fit = new FitAddon(); term.loadAddon(fit); term.open(element.current);
    const socket = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/terminal/${projectId}`); connection.current = socket;
    const send = (data: unknown) => { if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(data)); };
    const resize = () => { try { fit.fit(); send({ type: 'resize', cols: Math.max(20, Math.min(400, term.cols)), rows: Math.max(5, Math.min(150, term.rows)) }); } catch {} };
    const observer = new ResizeObserver(resize); observer.observe(element.current);
    const input = term.onData(data => send({ type: 'input', data }));
    socket.onopen = () => { setConnected(true); setError(''); resize(); term.focus(); };
    socket.onmessage = event => { const item = JSON.parse(event.data); if (item.type === 'data') term.write(item.data); if (item.type === 'error') setError(item.message); if (item.type === 'exit') term.writeln(`\r\nProcesso encerrado (${item.code}).`); };
    socket.onerror = () => setError('Falha ao conectar ao terminal local.'); socket.onclose = () => setConnected(false);
    return () => { socket.onclose = null; socket.close(); connection.current = undefined; terminal.current = undefined; observer.disconnect(); input.dispose(); term.dispose(); };
  }, [workspace?.trusted, projectId, generation]);
  async function trust(trusted: boolean) { try { await api(`/projects/${projectId}/trust`, 'POST', { trusted }); setWorkspace(previous => previous && { ...previous, trusted }); } catch (e) { setError((e as Error).message); } }
  function command(value: string) { if (connection.current?.readyState === WebSocket.OPEN) connection.current.send(JSON.stringify({ type: 'input', data: value + '\r' })); }
  useEffect(() => {
    if (!active) return;
    const handler = (event: Event) => {
      const { command: text, label } = (event as CustomEvent<TerminalRequest>).detail;
      if (connection.current?.readyState !== WebSocket.OPEN) { setError('O terminal não está conectado. Confie no projeto e tente novamente.'); return; }
      void askConfirm(`${label}?`, { description: text, confirmLabel: 'Executar' }).then(ok => { if (ok) command(text); });
    };
    window.addEventListener('cm-terminal-run', handler); return () => window.removeEventListener('cm-terminal-run', handler);
  }, [active]);
  async function install() { if (await askConfirm('Executar npm install?', { description: 'Dependências podem executar scripts com suas permissões no computador.', confirmLabel: 'Executar' })) command('npm install'); }
  async function runScript(name: string) { if (name && await askConfirm(`Executar npm run ${name}?`, { confirmLabel: 'Executar' })) command(`npm run '${name.split("'").join("''")}'`); }
  return <section className="h-full min-h-0 flex flex-col" style={{ background: 'var(--vs-panel)' }}>
    <div className="flex flex-wrap gap-1 items-center px-2 py-1 text-xs">
      <button className="icon-btn" title="Reconectar terminal" aria-label="Reconectar" onClick={() => setGeneration(value => value + 1)}><RotateCw size={14} /></button>
      <button className="icon-btn" title="Interromper (Ctrl+C)" aria-label="Interromper" disabled={!connected} onClick={() => connection.current?.send(JSON.stringify({ type: 'stop' }))}><Square size={13} /></button>
      {workspace?.trusted && <>
        <button className="icon-btn" title="Instalar dependências (npm install)" aria-label="Instalar dependências" disabled={!connected} onClick={() => void install()}><Download size={14} /></button>
        <select className="field text-xs max-w-44" aria-label="Executar script" value="" disabled={!connected} onChange={e => void runScript(e.target.value)}><option value="">Executar script…</option>{Object.keys(workspace.scripts || {}).map(name => <option key={name}>{name}</option>)}</select>
        <button className="icon-btn" title="Revogar confiança neste projeto" aria-label="Revogar confiança" onClick={() => void trust(false)}><ShieldOff size={14} /></button></>}
      <button className="ml-auto truncate max-w-72 text-vs-dim hover:text-vs-fg" title="Copiar caminho do projeto" onClick={() => void navigator.clipboard.writeText(workspace?.path || '').catch(e => setError(e.message))}>{workspace?.path}</button>
    </div>
    {error && <p className="error-banner mx-2 mb-1 text-xs">{error}</p>}
    {workspace && !workspace.trusted ? <div className="p-5 text-[13px] text-vs-muted max-w-xl"><p>O terminal executa comandos reais com suas permissões no computador. Confie apenas em projetos cujo código você conhece.</p><button className="btn-primary mt-3" onClick={() => void trust(true)}>Confiar neste projeto e abrir terminal</button></div> : <div ref={element} className="flex-1 min-h-0 px-3 pb-1" />}
  </section>;
}
export default function TerminalPanel({ projectId }: { projectId: string }) {
  const [tabs, setTabs] = useState([1]); const [active, setActive] = useState(1); const next = useRef(2);
  return <section className="h-full min-h-0 flex" style={{ background: 'var(--vs-panel)' }}>
    <div className="flex-1 min-w-0 min-h-0 relative">{tabs.map(id => <div key={id} className="absolute inset-0" style={{ display: active === id ? 'block' : 'none' }}><TerminalSession projectId={projectId} active={active === id} /></div>)}{!tabs.length && <p className="p-4 text-vs-dim text-xs">Abra um terminal para executar comandos.</p>}</div>
    <div className="w-40 shrink-0 border-l flex flex-col text-[13px]" style={{ borderColor: 'var(--vs-border-soft)' }} aria-label="Terminais">
      <div className="flex items-center justify-between h-[28px] pl-2 pr-1 border-b" style={{ borderColor: 'var(--vs-border-soft)' }}><span className="panel-title">Terminais</span><button className="icon-btn" title="Novo terminal" aria-label="Novo terminal" disabled={tabs.length >= 2} onClick={() => { const id = next.current++; setTabs(previous => [...previous, id]); setActive(id); }}><Plus size={14} /></button></div>
      {tabs.map(id => <div key={id} className="group list-row pl-2 pr-1" data-active={id === active}>
        <button className="flex items-center gap-1.5 flex-1 min-w-0 text-left" onClick={() => setActive(id)}><TerminalSquare size={14} className="shrink-0" /><span className="truncate">Terminal {id}</span></button>
        <button className="icon-btn opacity-0 group-hover:opacity-100" title="Encerrar terminal" aria-label={`Encerrar terminal ${id}`} onClick={() => { const remaining = tabs.filter(item => item !== id); setTabs(remaining); if (active === id) setActive(remaining[0] || 0); }}><X size={13} /></button></div>)}
    </div>
  </section>;
}
