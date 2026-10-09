import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronRight, Check } from 'lucide-react';

export type MenuItem =
  | { label: string; action?: () => void; shortcut?: string; disabled?: boolean; checked?: boolean; submenu?: MenuItem[]; separator?: false }
  | { separator: true };
// Menu suspenso no estilo do VS Code (explorador, abas, barra de menus). Aceita submenus.
function Items({ items, close, x, y, nested = false }: { items: MenuItem[]; close: () => void; x: number; y: number; nested?: boolean }) {
  const [open, setOpen] = useState<{ index: number; x: number; y: number } | null>(null);
  const left = Math.max(4, Math.min(x, window.innerWidth - 260));
  const top = Math.max(4, Math.min(y, window.innerHeight - items.length * 26 - 16));
  return <div role="menu" className="menu-pop fixed z-[90] min-w-[220px] py-1 border text-[13px]" style={{ left, top, background: 'var(--vs-menu-bg)', borderColor: 'var(--vs-menu-border)', boxShadow: 'var(--vs-shadow)', borderRadius: 5, zIndex: nested ? 91 : 90 }} onContextMenu={e => e.preventDefault()}>
    {items.map((item, index) => item.separator
      ? <div key={index} className="my-1 h-px" style={{ background: 'var(--vs-menu-border)' }} />
      : <button key={item.label} role="menuitem" disabled={item.disabled} className="menu-item w-full flex items-center gap-2 px-3 h-[26px] text-left disabled:opacity-40"
        onMouseEnter={e => { if (item.submenu && !item.disabled) { const rect = e.currentTarget.getBoundingClientRect(); setOpen({ index, x: rect.right - 2, y: rect.top - 5 }); } else setOpen(null); }}
        onClick={() => { if (item.submenu) return; close(); item.action?.(); }}>
        <span className="w-4 shrink-0">{item.checked && <Check size={14} />}</span><span className="flex-1">{item.label}</span>
        {item.shortcut && <span className="text-vs-dim text-xs ml-6">{item.shortcut}</span>}{item.submenu && <ChevronRight size={14} />}</button>)}
    {open && items[open.index] && !items[open.index].separator && (items[open.index] as { submenu?: MenuItem[] }).submenu && <Items items={(items[open.index] as { submenu: MenuItem[] }).submenu} close={close} x={open.x} y={open.y} nested />}
  </div>;
}
export function ContextMenu({ x, y, items, close }: { x: number; y: number; items: MenuItem[]; close: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const down = (event: MouseEvent) => { if (!(event.target as HTMLElement).closest?.('[role="menu"]')) close(); };
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    window.addEventListener('mousedown', down); window.addEventListener('keydown', key); window.addEventListener('blur', close);
    return () => { window.removeEventListener('mousedown', down); window.removeEventListener('keydown', key); window.removeEventListener('blur', close); };
  }, [close]);
  return <div ref={ref}><Items items={items} close={close} x={x} y={y} /></div>;
}
export function MenuLabel({ children }: { children: ReactNode }) { return <span className="truncate">{children}</span>; }
