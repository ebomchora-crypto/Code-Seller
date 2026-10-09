import { useEffect, useState } from 'react';
import { Play, Download, TerminalSquare } from 'lucide-react';
import { api } from '../lib/api';
import { commandForFile } from '../lib/runFile';
import { useEditorStore } from '../store/editorStore';

type Workspace = { scripts: Record<string, string> };
export default function RunPanel({ projectId, files, run }: { projectId: string; files: Record<string, string>; run: (command: string, label: string) => void }) {
  const [scripts, setScripts] = useState<Record<string, string>>({});
  const active = useEditorStore(state => state.activeFileId);
  useEffect(() => { let alive = true; void api<Workspace>(`/projects/${projectId}/workspace`).then(data => { if (alive) setScripts(data.scripts && typeof data.scripts === 'object' ? data.scripts : {}); }).catch(() => undefined); return () => { alive = false; }; }, [projectId, files['/package.json']]);
  const fileCommand = active ? commandForFile(active) : null;
  const hasPackage = files['/package.json'] !== undefined;
  return <aside className="h-full w-full overflow-auto bg-vs-sidebar text-[13px]" aria-label="Executar">
    <div className="h-[35px] flex items-center pl-5"><span className="panel-title">Executar</span></div>
    <div className="px-3 space-y-2 pb-3">
      <button className="btn-primary w-full" disabled={!fileCommand} title={fileCommand || 'Abra um arquivo executável (js, ts, py, java, go, php, sh…)'} onClick={() => fileCommand && run(fileCommand, `Executar ${active?.slice(1)}`)}><Play size={14} /> Executar arquivo atual</button>
      {active && !fileCommand && <p className="text-xs text-vs-dim">Este tipo de arquivo não tem comando de execução automático.</p>}
      {fileCommand && <p className="text-xs text-vs-dim font-code break-all">{fileCommand}</p>}
    </div>
    {hasPackage && <>
      <div className="px-5 h-[22px] flex items-center text-[11px] uppercase font-bold">Scripts do package.json</div>
      <button className="list-row pl-5 pr-2" onClick={() => run('npm install', 'Instalar dependências')}><Download size={14} className="shrink-0" /><span className="truncate">Instalar dependências</span><span className="text-vs-dim text-xs ml-auto">npm install</span></button>
      {Object.entries(scripts).map(([name, command]) => <div key={name} className="group list-row pl-5 pr-2" title={command}>
        <button className="flex items-center gap-2 flex-1 min-w-0 text-left" onClick={() => run(`npm run ${name}`, `Executar npm run ${name}`)}><Play size={14} className="shrink-0" style={{ color: 'var(--vs-success)' }} /><span className="truncate">{name}</span></button><span className="text-vs-dim text-xs truncate max-w-[45%]">{command}</span></div>)}
      {!Object.keys(scripts).length && <p className="px-5 py-1 text-xs text-vs-dim">Nenhum script definido.</p>}</>}
    <div className="px-3 pt-4"><button className="btn-secondary w-full" onClick={() => window.dispatchEvent(new CustomEvent('cm-open-terminal'))}><TerminalSquare size={14} /> Abrir terminal</button></div>
  </aside>;
}
