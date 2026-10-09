import { useEffect, useRef, useState } from 'react';
import { FileIcon } from '../lib/fileIcons';
type Item = { label: string; action: () => void };
// Paleta rápida (Ctrl+P / Ctrl+Shift+P) no estilo do VS Code: caixa no topo, lista logo abaixo.
export default function CommandPalette({ items, close, title }: { items: Item[]; close: () => void; title: string }) {
  const [query, setQuery] = useState(''); const [selected, setSelected] = useState(0); const input = useRef<HTMLInputElement>(null); const list = useRef<HTMLDivElement>(null);
  const files = title.startsWith('Abrir');
  useEffect(() => { input.current?.focus(); }, []);
  useEffect(() => { list.current?.querySelector('[data-selected="true"]')?.scrollIntoView?.({ block: 'nearest' }); }, [selected]);
  const matches = items.filter(item => item.label.toLowerCase().includes(query.toLowerCase())).slice(0, 100);
  function choose(index: number) { if (matches[index]) { close(); matches[index].action(); } }
  return <div className="fixed inset-0 z-50 flex justify-center items-start" onMouseDown={close}>
    <div role="dialog" aria-modal="true" aria-label={title} className="menu-pop mt-0 w-[600px] max-w-[92vw] border border-t-0 p-1.5" style={{ background: 'var(--vs-quick-bg)', borderColor: 'var(--vs-menu-border)', boxShadow: 'var(--vs-shadow)' }} onMouseDown={e => e.stopPropagation()}>
      <input ref={input} className="field w-full" placeholder={title} aria-label={title} value={query} onChange={e => { setQuery(e.target.value); setSelected(0); }} onKeyDown={e => { if (e.key === 'Escape') close(); if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(value => Math.min(matches.length - 1, value + 1)); } if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(value => Math.max(0, value - 1)); } if (e.key === 'Enter') choose(selected); }} />
      <div ref={list} className="max-h-[320px] overflow-auto mt-1.5">{matches.map((item, index) => <button key={item.label} data-selected={index === selected} className="list-row px-2 !h-[22px]" style={index === selected ? { background: 'var(--vs-list-focus)', color: 'var(--vs-list-focus-fg)' } : undefined} onMouseMove={() => setSelected(index)} onClick={() => choose(index)}>
        {files && <FileIcon name={item.label.split('/').at(-1)!} size={15} />}<span className="truncate">{files ? item.label.split('/').at(-1) : item.label}</span>{files && item.label.includes('/') && <span className="truncate text-xs opacity-60 ml-1">{item.label.slice(1, item.label.lastIndexOf('/')) || ''}</span>}</button>)}
        {!matches.length && <p className="p-3 text-vs-dim">Nenhum resultado.</p>}</div>
    </div>
  </div>;
}
