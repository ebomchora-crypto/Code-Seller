import { useState } from 'react';
import { X, Columns2, Search, ChevronRight } from 'lucide-react';
import { useEditorStore } from '../store/editorStore';
import { FileIcon } from '../lib/fileIcons';
import { ContextMenu } from './ContextMenu';
import type { Marker } from '../lib/markers';

// Abas no estilo do VS Code: aba ativa com a cor do editor e linha de destaque no topo,
// botão de fechar visível ao passar o mouse, clique do meio fecha.
export function EditorTabs({ markers, onSplit, onQuickOpen }: { markers: Marker[]; onSplit: () => void; onQuickOpen: () => void }) {
  const { openFiles, activeFileId, setActiveFile, closeFile } = useEditorStore();
  const [menu, setMenu] = useState<{ x: number; y: number; id: string } | null>(null);
  return <div className="flex shrink-0 h-[35px]" style={{ background: 'var(--vs-tab-bar)' }}>
    <div className="flex flex-1 min-w-0 overflow-x-auto no-scrollbar" role="tablist" aria-label="Arquivos abertos">
      {openFiles.map(file => {
        const active = activeFileId === file.id;
        const own = markers.filter(item => item.path === file.id);
        const color = own.some(item => item.severity === 'error') ? 'var(--vs-error)' : own.length ? 'var(--vs-warning)' : undefined;
        return <div key={file.id} role="tab" aria-selected={active} className="group relative flex items-center shrink-0 border-r select-none" style={{ background: active ? 'var(--vs-tab-active)' : 'var(--vs-tab-inactive)', color: active ? 'var(--vs-tab-active-fg)' : 'var(--vs-tab-inactive-fg)', borderColor: 'var(--vs-border-soft)' }}
          onMouseDown={e => { if (e.button === 1) { e.preventDefault(); closeFile(file.id); } }} onContextMenu={e => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, id: file.id }); }}>
          {active && <span className="absolute left-0 right-0 top-0 h-px" style={{ background: 'var(--vs-tab-accent)' }} />}
          <button className="flex items-center gap-1.5 pl-3 pr-1 h-[35px] text-[13px] max-w-52" title={file.id} onClick={() => setActiveFile(file.id)}>
            <FileIcon name={file.name} size={16} /><span className="truncate" style={{ color }}>{file.name}</span>
          </button>
          <button className="icon-btn mr-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100" style={active ? { opacity: 1 } : undefined} aria-label={`Fechar ${file.name}`} onClick={() => closeFile(file.id)}><X size={14} /></button>
        </div>;
      })}
    </div>
    <div className="flex items-center px-1 shrink-0">
      <button className="icon-btn" title="Dividir editor" aria-label="Dividir editor" onClick={onSplit}><Columns2 size={16} /></button>
      <button className="icon-btn" title="Abrir arquivo · Ctrl+P" aria-label="Abrir arquivo" onClick={onQuickOpen}><Search size={15} /></button>
    </div>
    {menu && <ContextMenu x={menu.x} y={menu.y} close={() => setMenu(null)} items={[
      { label: 'Fechar', action: () => closeFile(menu.id) },
      { label: 'Fechar outros', action: () => openFiles.filter(file => file.id !== menu.id).forEach(file => closeFile(file.id)) },
      { label: 'Fechar todos', action: () => openFiles.forEach(file => closeFile(file.id)) },
      { separator: true },
      { label: 'Copiar caminho', action: () => void navigator.clipboard?.writeText(menu.id.slice(1)).catch(() => undefined) },
    ]} />}
  </div>;
}

export function Breadcrumbs({ path }: { path: string | null }) {
  if (!path) return null;
  const parts = path.slice(1).split('/');
  return <div className="h-[22px] shrink-0 flex items-center gap-0.5 px-4 text-xs overflow-hidden whitespace-nowrap" style={{ background: 'var(--vs-editor)', color: 'var(--vs-fg-muted)' }} aria-label="Caminho do arquivo">
    {parts.map((part, index) => <span key={index} className="flex items-center gap-0.5 min-w-0">{index > 0 && <ChevronRight size={12} className="shrink-0" />}{index === parts.length - 1 && <FileIcon name={part} size={14} />}<span className="truncate" style={index === parts.length - 1 ? { color: 'var(--vs-fg)' } : undefined}>{part}</span></span>)}
  </div>;
}
