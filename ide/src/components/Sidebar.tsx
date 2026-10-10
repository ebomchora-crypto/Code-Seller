import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FileNode, useEditorStore } from '../store/editorStore';
import { ChevronRight, ChevronDown, FilePlus, Pencil, Trash2, ChevronsDownUp, Search, RefreshCw, Loader2 } from 'lucide-react';
import { FileIcon, FolderIcon } from '../lib/fileIcons';
import { ContextMenu, type MenuItem } from './ContextMenu';
import type { Marker } from '../lib/markers';

type Actions = { onCreate: (folder?: string) => void; onRename: (path?: string, folder?: boolean) => void; onDelete: (path?: string, folder?: boolean) => void };
type Menu = { x: number; y: number; node: FileNode } | null;

type RowProps = { node: FileNode; level: number; open: boolean; toggle: (id: string) => void; markers: Marker[]; onMenu: (event: React.MouseEvent, node: FileNode) => void; onOpenFile?: () => void; onMore?: (path: string) => void };
function TreeRow({ node, level, open, toggle, markers, onMenu, onOpenFile, onMore }: RowProps) {
  const active = useEditorStore(state => state.activeFileId);
  const openFile = useEditorStore(state => state.openFile);
  if (node.more) return <button className="flex items-center h-[22px] w-full text-left text-xs underline" style={{ paddingLeft: level * 8 + 36, color: 'var(--vs-link)' }} onClick={() => onMore?.(node.more!.path)}>{node.name}</button>;
  const folder = node.type === 'folder';
  const own = markers.length ? markers.filter(item => folder ? item.path.startsWith(`${node.id}/`) : item.path === node.id) : markers;
  const errors = own.filter(item => item.severity === 'error').length;
  const warnings = own.filter(item => item.severity === 'warning').length;
  const color = errors ? 'var(--vs-error)' : warnings ? 'var(--vs-warning)' : undefined;
  return <button className="list-row pr-3 text-[13px]" data-active={!folder && active === node.id} title={node.id} style={{ paddingLeft: level * 8 + 8 }}
    onClick={() => { if (folder) toggle(node.id); else { openFile(node); onOpenFile?.(); } }} onContextMenu={event => onMenu(event, node)}>
    {folder ? (open ? <ChevronDown size={16} className="shrink-0 text-vs-muted" /> : <ChevronRight size={16} className="shrink-0 text-vs-muted" />) : <span className="w-4 shrink-0" />}
    {folder ? <FolderIcon open={open} /> : <FileIcon name={node.name} />}
    <span className="truncate" style={{ color: color ?? (node.heavy ? 'var(--vs-fg-dim)' : undefined) }}>{node.name}</span>
    {(errors > 0 || warnings > 0) && <span className="ml-auto text-xs" style={{ color }}>{folder ? '●' : errors || warnings}</span>}
  </button>;
}

function TreeNode({ node, level, collapsed, toggle, filtering, markers, onMenu, onOpenFile }: { onOpenFile?: () => void; node: FileNode; level: number; collapsed: Set<string>; toggle: (id: string) => void; filtering: boolean; markers: Marker[]; onMenu: (event: React.MouseEvent, node: FileNode) => void }) {
  const folder = node.type === 'folder';
  const open = folder && (filtering || !collapsed.has(node.id));
  return <div>
    <TreeRow node={node} level={level} open={open} toggle={toggle} markers={markers} onMenu={onMenu} onOpenFile={onOpenFile} />
    {open && node.children?.map(child => <TreeNode key={child.id} node={child} level={level + 1} collapsed={collapsed} toggle={toggle} filtering={filtering} markers={markers} onMenu={onMenu} onOpenFile={onOpenFile} />)}
  </div>;
}

const ROW = 22;
type Flat = { key: string; node?: FileNode; level: number; text?: 'loading' | 'empty' };
/** Árvore de pastas abertas do computador: só as linhas visíveis existem no DOM, então uma pasta com 1 milhão de itens continua leve. */
function LazyTree({ nodes, expanded, toggle, markers, onMenu, onOpenFile, onMore }: { nodes: FileNode[]; expanded: Set<string>; toggle: (id: string) => void; markers: Marker[]; onMenu: (event: React.MouseEvent, node: FileNode) => void; onOpenFile?: () => void; onMore?: (path: string) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ top: 0, height: 600 });
  useLayoutEffect(() => {
    const element = box.current; if (!element) return;
    const measure = () => setView(previous => previous.top === element.scrollTop && previous.height === element.clientHeight ? previous : { top: element.scrollTop, height: element.clientHeight });
    measure(); const observer = new ResizeObserver(measure); observer.observe(element); return () => observer.disconnect();
  }, []);
  const rows = useMemo(() => {
    const out: Flat[] = [];
    const walk = (list: FileNode[], level: number) => list.forEach(node => {
      out.push({ key: node.id, node, level });
      if (node.type === 'folder' && expanded.has(node.id)) {
        if (node.children === undefined) out.push({ key: `${node.id}:l`, level: level + 1, text: 'loading' });
        else if (node.children.length === 0) out.push({ key: `${node.id}:e`, level: level + 1, text: 'empty' });
        else walk(node.children, level + 1);
      }
    });
    walk(nodes, 0); return out;
  }, [nodes, expanded]);
  const first = Math.max(0, Math.floor(view.top / ROW) - 12); const last = Math.min(rows.length, Math.ceil((view.top + view.height) / ROW) + 12);
  return <div ref={box} className="overflow-auto flex-1 tree-focus py-0.5" onScroll={event => { const top = event.currentTarget.scrollTop; setView(previous => Math.abs(previous.top - top) < ROW / 2 ? previous : { ...previous, top }); }}>
    <div style={{ height: rows.length * ROW, position: 'relative' }}>
      <div style={{ position: 'absolute', top: first * ROW, left: 0, right: 0 }}>
        {rows.slice(first, last).map(row => row.node
          ? <TreeRow key={row.key} node={row.node} level={row.level} open={expanded.has(row.node.id)} toggle={toggle} markers={markers} onMenu={onMenu} onOpenFile={onOpenFile} onMore={onMore} />
          : <p key={row.key} className="flex items-center gap-1.5 text-xs text-vs-dim h-[22px]" style={{ paddingLeft: row.level * 8 + 36 }}>{row.text === 'loading' ? <><Loader2 size={12} className="animate-spin" />Carregando…</> : 'Pasta vazia'}</p>)}
      </div>
    </div>
  </div>;
}

export function Sidebar({ onCreate, onRename, onDelete, disabled, markers = [], projectName = 'Projeto', onOpenFile, lazy, onExpand, onRefresh, onMore }: Actions & { onMore?: (path: string) => void; lazy?: boolean; onExpand?: (path: string) => void; onRefresh?: () => void; onOpenFile?: () => void; disabled: boolean; markers?: Marker[]; projectName?: string }) {
  const files = useEditorStore(state => state.files);
  const active = useEditorStore(state => state.activeFileId);
  const [search, setSearch] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [menu, setMenu] = useState<Menu>(null);
  const [rootOpen, setRootOpen] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const term = search.trim().toLowerCase();
  function filter(nodes: FileNode[]): FileNode[] { return nodes.flatMap(node => { if (node.type === 'file') return node.id.toLowerCase().includes(term) ? [node] : []; const children = filter(node.children || []); return children.length ? [{ ...node, children }] : []; }); }
  function toggle(id: string) {
    if (lazy) { setExpanded(previous => { const next = new Set(previous); if (next.has(id)) next.delete(id); else { next.add(id); onExpand?.(id); } return next; }); return; }
    setCollapsed(previous => { const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next; }); }
  function collapseAll() {
    const ids: string[] = []; const walk = (nodes: FileNode[]) => nodes.forEach(node => { if (node.type === 'folder') { ids.push(node.id); walk(node.children || []); } }); walk(files);
    if (lazy) { setExpanded(new Set()); return; }
    setCollapsed(new Set(ids));
  }
  function openMenu(event: React.MouseEvent, node: FileNode) { event.preventDefault(); setMenu({ x: event.clientX, y: event.clientY, node }); }
  const folderTarget = (node: FileNode) => node.type === 'folder' ? node.id : node.id.split('/').slice(0, -1).join('/');
  const items = (node: FileNode): MenuItem[] => [
    { label: 'Novo arquivo…', action: () => onCreate(folderTarget(node)) },
    { separator: true },
    { label: 'Renomear…', shortcut: 'F2', action: () => onRename(node.id, node.type === 'folder') },
    { label: 'Excluir', shortcut: 'Del', action: () => onDelete(node.id, node.type === 'folder') },
    { separator: true },
    { label: 'Copiar caminho', action: () => void navigator.clipboard?.writeText(node.id.slice(1)).catch(() => undefined) },
  ];
  const visible = term ? filter(files) : files;
  return <aside className="h-full w-full bg-vs-sidebar flex flex-col overflow-hidden" aria-label="Explorador de arquivos" onKeyDown={event => {
    if (disabled || (event.target as HTMLElement).tagName === 'INPUT') return;
    if (event.key === 'F2' && active) { event.preventDefault(); onRename(active, false); }
    if (event.key === 'Delete' && active) { event.preventDefault(); onDelete(active, false); }
  }}>
    <div className="h-[35px] shrink-0 flex items-center justify-between pl-5 pr-2"><span className="panel-title">Explorador</span>
      <div className="flex"><button className="icon-btn" aria-label="Filtrar lista de arquivos" title="Filtrar arquivos" onClick={() => { setShowFilter(value => !value); if (showFilter) setSearch(''); }}><Search size={15} /></button></div></div>
    {showFilter && <input autoFocus className="field mx-3 mb-2 text-xs" placeholder="Buscar arquivos…" aria-label="Buscar arquivos" value={search} onChange={e => setSearch(e.target.value)} />}
    <div className="group/root flex items-center h-[22px] pr-1 select-none" style={{ background: 'var(--vs-list-hover)' }}>
      <button className="flex items-center gap-1 flex-1 min-w-0 pl-1 font-bold text-[11px] uppercase text-vs-strong" onClick={() => setRootOpen(value => !value)}>{rootOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}<span className="truncate">{projectName}</span></button>
      <div className="flex opacity-0 group-hover/root:opacity-100 focus-within:opacity-100">
        <button className="icon-btn" aria-label="Criar arquivo" title="Novo arquivo" onClick={() => onCreate()} disabled={disabled}><FilePlus size={15} /></button>
        <button className="icon-btn" aria-label="Renomear arquivo ativo" title="Renomear arquivo ativo (F2)" onClick={() => onRename()} disabled={disabled || !active}><Pencil size={14} /></button>
        <button className="icon-btn" aria-label="Excluir arquivo ativo" title="Excluir arquivo ativo (Del)" onClick={() => onDelete()} disabled={disabled || !active}><Trash2 size={14} /></button>
        {lazy && <button className="icon-btn" aria-label="Atualizar lista de arquivos" title="Atualizar" onClick={onRefresh}><RefreshCw size={14} /></button>}<button className="icon-btn" aria-label="Recolher pastas" title="Recolher pastas" onClick={collapseAll}><ChevronsDownUp size={15} /></button>
      </div>
    </div>
    {lazy && !term
      ? (rootOpen ? <LazyTree nodes={files} expanded={expanded} toggle={toggle} markers={markers} onMenu={openMenu} onOpenFile={onOpenFile} onMore={onMore} /> : <div className="flex-1" />)
      : <div className="overflow-auto flex-1 tree-focus py-0.5">{rootOpen && visible.map(file => <TreeNode key={file.id} node={file} level={0} collapsed={collapsed} toggle={toggle} filtering={!!term} markers={markers} onMenu={openMenu} onOpenFile={onOpenFile} />)}
      {rootOpen && !visible.length && <p className="px-5 py-3 text-xs text-vs-dim">{term ? 'Nenhum arquivo encontrado.' : 'Nenhum arquivo no projeto.'}</p>}</div>}
    {menu && <ContextMenu x={menu.x} y={menu.y} items={items(menu.node)} close={() => setMenu(null)} />}
  </aside>;
}
