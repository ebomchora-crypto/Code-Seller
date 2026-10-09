import { useEffect, useRef, useState } from 'react';
import { useDialogs } from '../lib/dialogs';

export function DialogHost() {
  const dialog = useDialogs(state => state.current);
  const [text, setText] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const ok = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!dialog) return;
    setText(dialog.kind === 'input' ? dialog.value : '');
    setTimeout(() => { if (dialog.kind === 'input') { input.current?.focus(); input.current?.select(); } else ok.current?.focus(); }, 0);
  }, [dialog]);
  if (!dialog) return null;
  function finish(accepted: boolean) {
    if (!dialog) return;
    useDialogs.setState({ current: null });
    if (dialog.kind === 'input') dialog.resolve(accepted ? text : null); else dialog.resolve(accepted);
  }
  return <div className="fixed inset-0 z-[100] flex justify-center items-start pt-[14vh]" style={{ background: '#00000066' }} onMouseDown={() => finish(false)}>
    <div role="dialog" aria-modal="true" aria-label={dialog.title} className="menu-pop w-[440px] max-w-[92vw] p-4 border" style={{ background: 'var(--vs-quick-bg)', borderColor: 'var(--vs-menu-border)', boxShadow: 'var(--vs-shadow)' }}
      onMouseDown={e => e.stopPropagation()} onKeyDown={e => { if (e.key === 'Escape') finish(false); if (e.key === 'Enter' && dialog.kind === 'input') finish(true); }}>
      <h2 className="text-[13px] font-semibold text-vs-strong mb-1">{dialog.title}</h2>
      {dialog.description && <p className="text-xs text-vs-muted mb-3">{dialog.description}</p>}
      {dialog.kind === 'input' && <input ref={input} className="field w-full mb-3" aria-label={dialog.title} value={text} onChange={e => setText(e.target.value)} />}
      <div className="flex justify-end gap-2 mt-3">
        <button className="btn-secondary" onClick={() => finish(false)}>Cancelar</button>
        <button ref={ok} className="btn-primary" style={dialog.kind === 'confirm' && dialog.danger ? { background: 'var(--vs-error-border)' } : undefined} onClick={() => finish(true)}>{dialog.confirmLabel}</button>
      </div>
    </div>
  </div>;
}
