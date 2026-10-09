import { XCircle, AlertTriangle, Info } from 'lucide-react';
import { useEditorStore } from '../store/editorStore';
import { useMarkers } from '../lib/markers';
import { FileIcon } from '../lib/fileIcons';

export default function ProblemsPanel({ projectId }: { projectId: string }) {
  const markers = useMarkers(projectId);
  const groups = markers.reduce<Record<string, typeof markers>>((all, item) => { (all[item.path] ||= []).push(item); return all; }, {});
  function open(path: string, line: number) {
    useEditorStore.getState().openFile({ id: path, name: path.split('/').at(-1)!, type: 'file' }, projectId);
    window.dispatchEvent(new CustomEvent('cm-reveal-line', { detail: { line, path } }));
  }
  return <section className="h-full overflow-auto text-[13px]" style={{ background: 'var(--vs-panel)' }} aria-label="Problemas">
    {!markers.length && <p className="p-4 text-vs-dim">Nenhum problema detectado no editor. A validação completa do projeto depende das ferramentas instaladas no terminal.</p>}
    {Object.entries(groups).map(([path, items]) => <div key={path}>
      <div className="flex items-center gap-2 px-3 h-[22px] hover:bg-vs-hover"><FileIcon name={path.split('/').at(-1)!} size={15} /><span className="text-vs-strong">{path.split('/').at(-1)}</span><span className="text-vs-dim text-xs truncate">{path}</span><span className="badge ml-1">{items.length}</span></div>
      {items.map((item, index) => <button key={index} className="list-row pl-8 pr-3" onClick={() => open(path, item.line)}>
        {item.severity === 'error' ? <XCircle size={14} color="var(--vs-error)" className="shrink-0" /> : item.severity === 'warning' ? <AlertTriangle size={14} color="var(--vs-warning)" className="shrink-0" /> : <Info size={14} color="var(--vs-info)" className="shrink-0" />}
        <span className="truncate">{item.message}</span><span className="text-vs-dim text-xs shrink-0 ml-1">{item.source ? `${item.source} · ` : ''}[Ln {item.line}, Col {item.column}]</span></button>)}
    </div>)}
  </section>;
}
