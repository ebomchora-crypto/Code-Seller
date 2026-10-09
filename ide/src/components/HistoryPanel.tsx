import { useState } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import '../lib/monaco';
import { X, RotateCcw, BookmarkPlus } from 'lucide-react';
import type { Autosave } from '../lib/autosave';
import { askConfirm } from '../lib/dialogs';
import { useMonacoTheme } from '../lib/monacoTheme';
export default function HistoryPanel({ session, close, checkpoint, restore, busy }: { session: Autosave; close: () => void; checkpoint: () => void; restore: (id: string) => void; busy: boolean }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [path, setPath] = useState('');
  const theme = useMonacoTheme();
  const version = session.project.history.find(item => item.id === selected);
  const paths = version ? [...new Set([...Object.keys(version.files), ...Object.keys(session.files)])] : [];
  const currentPath = paths.includes(path) ? path : paths[0];
  async function confirmRestore() { if (version && await askConfirm('Restaurar esta versão?', { description: 'O código atual será guardado em outro checkpoint.', confirmLabel: 'Restaurar' })) restore(version.id); }
  return <div className="fixed inset-0 z-30 flex items-center justify-center p-5" style={{ background: '#00000080' }} onMouseDown={close}>
    <section role="dialog" aria-modal="true" aria-label="Histórico de versões" className="menu-pop w-full max-w-5xl h-[80vh] border flex flex-col" style={{ background: 'var(--vs-editor)', borderColor: 'var(--vs-menu-border)', boxShadow: 'var(--vs-shadow)' }} onMouseDown={e => e.stopPropagation()}>
      <header className="h-[35px] shrink-0 px-3 border-b flex justify-between items-center" style={{ borderColor: 'var(--vs-border-soft)' }}><h2 className="panel-title !text-vs-strong">Histórico de versões</h2>
        <div className="flex items-center gap-2"><button className="btn-secondary text-xs !min-h-[22px] !py-0" disabled={busy} onClick={checkpoint}><BookmarkPlus size={14} /> Criar checkpoint</button><button className="icon-btn" aria-label="Fechar histórico" onClick={close}><X size={16} /></button></div></header>
      <div className="flex flex-1 min-h-0">
        <div className="w-60 shrink-0 border-r overflow-auto bg-vs-sidebar" style={{ borderColor: 'var(--vs-border-soft)' }}>
          {session.project.history.length ? session.project.history.map(item => <button key={item.id} className="list-row !h-auto flex-col !items-start py-1.5 px-4" data-active={selected === item.id} onClick={() => setSelected(item.id)}><span className="truncate w-full">{item.label}</span><span className="text-[11px] text-vs-dim">{new Date(item.created_at).toLocaleString('pt-BR')}</span></button>) : <p className="text-xs text-vs-dim p-4">Crie um checkpoint para guardar uma versão do seu código.</p>}
        </div>
        <div className="flex flex-col flex-1 min-w-0">{version ? <>
          <div className="p-2 flex gap-2 items-center"><select className="field flex-1" value={currentPath} aria-label="Arquivo para comparar" onChange={e => setPath(e.target.value)}>{paths.map(path => <option key={path}>{path}</option>)}</select><button className="btn-secondary text-xs" disabled={busy} onClick={() => void confirmRestore()}><RotateCcw size={13} /> Restaurar</button></div>
          <p className="px-3 pb-2 text-xs text-vs-dim">Versão salva à esquerda · código atual à direita</p>
          <div className="flex-1 min-h-0"><DiffEditor height="100%" theme={theme} original={version.files[currentPath] || ''} modified={session.files[currentPath] || ''} options={{ readOnly: true, automaticLayout: true, minimap: { enabled: false } }} /></div></> : <p className="text-vs-dim text-sm m-auto">Selecione uma versão para comparar.</p>}</div>
      </div>
      <p className="px-3 py-1.5 text-xs text-vs-dim border-t" style={{ borderColor: 'var(--vs-border-soft)' }}>São preservados os 30 checkpoints mais recentes por projeto.</p>
    </section></div>;
}
