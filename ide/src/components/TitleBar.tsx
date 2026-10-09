import { useState } from 'react';
import { ArrowLeft, ArrowRight, Code2, PanelLeft, PanelBottom, PanelRight, Eye, Search, MoreHorizontal } from 'lucide-react';
import { ContextMenu, type MenuItem } from './ContextMenu';

export type MenuGroups = Record<string, MenuItem[]>;
type Props = {
  projectName: string; menus: MenuGroups; onBack: () => void; onForward: () => void; canBack: boolean; canForward: boolean; onQuickOpen: () => void;
  sidebar: boolean; bottom: boolean; preview: boolean; chat: boolean; previewDisabled: boolean; hasProject: boolean; publish?: { label: string; done: boolean; busy: boolean; onClick: () => void };
  onSidebar: () => void; onBottom: () => void; onPreview: () => void; onChat: () => void;
};
// Barra de título no estilo do VS Code: ícone, menus, navegação, central de comandos e botões de layout.
export function TitleBar({ projectName, menus, onBack, onForward, canBack, canForward, onQuickOpen, sidebar, bottom, preview, chat, previewDisabled, hasProject, publish, onSidebar, onBottom, onPreview, onChat }: Props) {
  const [open, setOpen] = useState<{ name: string; x: number; y: number } | null>(null);
  const names = Object.keys(menus); const visible = names.slice(0, 6); const hidden = names.slice(6);
  const toggle = (label: string, on: boolean, Icon: typeof PanelLeft, action: () => void, disabled = false) =>
    <button key={label} className="icon-btn !w-7 !h-7" title={label} aria-label={label} aria-pressed={on} disabled={disabled} onClick={action} style={on ? { color: 'var(--vs-fg-strong)' } : undefined}><Icon size={16} /></button>;
  const show = (name: string, rect: DOMRect) => setOpen({ name, x: rect.left, y: rect.bottom });
  const overflow: MenuItem[] = hidden.map(name => ({ label: name, submenu: menus[name] }));
  return <header className="h-[30px] shrink-0 grid grid-cols-[1fr_minmax(0,520px)_1fr] items-center select-none" style={{ background: 'var(--vs-titlebar)', color: 'var(--vs-titlebar-fg)', borderBottom: '1px solid var(--vs-border-soft)' }}>
    <div className="flex items-center min-w-0 pl-2">
      <Code2 size={16} className="mx-1.5 shrink-0" style={{ color: 'var(--vs-link)' }} />
      <nav className="hidden md:flex" aria-label="Menu">{visible.map(name => <button key={name} className="px-2 h-[22px] my-1 rounded text-[13px] hover:bg-[var(--vs-toolbar-hover)]" style={open?.name === name ? { background: 'var(--vs-toolbar-hover)' } : undefined}
        onClick={e => open?.name === name ? setOpen(null) : show(name, e.currentTarget.getBoundingClientRect())}
        onMouseEnter={e => { if (open && open.name !== name) show(name, e.currentTarget.getBoundingClientRect()); }}>{name}</button>)}
        {hidden.length > 0 && <button className="px-2 h-[22px] my-1 rounded hover:bg-[var(--vs-toolbar-hover)]" aria-label="Mais menus" onClick={e => { const rect = e.currentTarget.getBoundingClientRect(); setOpen({ name: '…', x: rect.left, y: rect.bottom }); }}><MoreHorizontal size={16} /></button>}</nav>
    </div>
    <div className="flex items-center gap-1 min-w-0">
      <button className="icon-btn !w-7 !h-7" aria-label="Voltar" title="Voltar (Alt+←)" disabled={!canBack} onClick={onBack}><ArrowLeft size={16} /></button>
      <button className="icon-btn !w-7 !h-7" aria-label="Avançar" title="Avançar (Alt+→)" disabled={!canForward} onClick={onForward}><ArrowRight size={16} /></button>
      <button className="flex-1 flex items-center justify-center gap-2 h-[22px] rounded text-xs border min-w-0 px-3" style={{ background: 'var(--vs-input-bg)', borderColor: 'var(--vs-border)', color: 'var(--vs-fg-muted)' }} onClick={onQuickOpen} title="Abrir arquivo · Ctrl+P" aria-label="Central de comandos">
        <Search size={12} className="shrink-0" /><span className="truncate">{hasProject ? projectName : 'Code Sellers IDE'}</span></button>
    </div>
    <div className="flex items-center justify-end gap-0.5 pr-2">
      {publish && <button className="btn-primary !min-h-[22px] !py-0 !px-3 text-xs mr-2" style={publish.done ? { background: 'var(--vs-btn2-bg)' } : undefined} disabled={publish.busy} onClick={publish.onClick} title="Salvar e publicar o site (Ctrl+S)">{publish.label}</button>}
      {toggle('Alternar explorador', sidebar, PanelLeft, onSidebar)}
      {toggle('Alternar painel inferior', bottom, PanelBottom, onBottom, !hasProject)}
      {toggle('Alternar preview', preview, Eye, onPreview, previewDisabled)}
      {toggle('Alternar assistente', chat, PanelRight, onChat, !hasProject)}
    </div>
    {open && <ContextMenu x={open.x} y={open.y} items={open.name === '…' ? overflow : menus[open.name]} close={() => setOpen(null)} />}
  </header>;
}
