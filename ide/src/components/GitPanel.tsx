import { useEffect, useState } from 'react';
import { GitBranch, Plus, Minus, X } from 'lucide-react';
import { api } from '../lib/api';
import { FileIcon } from '../lib/fileIcons';
type Status = { initialized: boolean; branch: string; files: { path: string; index: string; worktree: string }[]; commits: { id: string; short: string; message: string }[] };
const letter = (file: Status['files'][number]) => (file.index !== ' ' && file.index !== '?' ? file.index : file.worktree === '?' ? 'U' : file.worktree);
const color = (value: string) => value === 'A' || value === 'U' ? 'var(--vs-git-added)' : value === 'D' ? 'var(--vs-git-deleted)' : 'var(--vs-git-modified)';
function DiffView({ text }: { text: string }) {
  return <pre className="text-xs font-code overflow-auto flex-1 p-3 m-0 leading-5">{text.split('\n').map((line, index) => <div key={index} style={{ background: line.startsWith('+') && !line.startsWith('+++') ? 'var(--vs-diff-add)' : line.startsWith('-') && !line.startsWith('---') ? 'var(--vs-diff-del)' : undefined, color: line.startsWith('@@') ? 'var(--vs-link)' : undefined, whiteSpace: 'pre-wrap' }}>{line || ' '}</div>)}</pre>;
}
export default function GitPanel({ projectId }: { projectId: string }) {
  const [status, setStatus] = useState<Status>(); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [diff, setDiff] = useState<{ path: string; text: string } | null>(null);
  const [authorName, setAuthorName] = useState(''); const [authorEmail, setAuthorEmail] = useState('');
  useEffect(() => { let alive = true; const refresh = () => api<Status>(`/projects/${projectId}/git`).then(data => { if (alive) setStatus(data); }).catch(e => { if (alive) setError(e.message); }); void refresh(); const timer = setInterval(refresh, 4000); return () => { alive = false; clearInterval(timer); }; }, [projectId]);
  async function action(input: unknown) { setBusy(true); setError(''); try { setStatus(await api<Status>(`/projects/${projectId}/git`, 'POST', input)); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }
  const staged = status?.files.filter(file => file.index !== ' ' && file.index !== '?') || [];
  const changes = status?.files.filter(file => file.index === ' ' || file.index === '?') || [];
  const row = (file: Status['files'][number], isStaged: boolean) => <div key={`${isStaged}-${file.path}`} className="group list-row pl-4 pr-2">
    <button className="flex items-center gap-1.5 flex-1 min-w-0 text-left" title={file.path} onClick={() => void api<{ diff: string }>(`/projects/${projectId}/git/diff?path=${encodeURIComponent(file.path)}&staged=${isStaged}`).then(data => setDiff({ path: file.path, text: data.diff })).catch(e => setError(e.message))}>
      <FileIcon name={file.path.split('/').at(-1)!} size={15} /><span className="truncate shrink-0 max-w-[65%]" style={{ color: color(letter(file)) }}>{file.path.split('/').at(-1)}</span><span className="text-vs-dim text-xs truncate min-w-0">{file.path.includes('/') ? file.path.slice(0, file.path.lastIndexOf('/')) : ''}</span></button>
    <span className="opacity-0 group-hover:opacity-100 flex">{isStaged ? <button className="icon-btn" title="Retirar das preparadas" aria-label={`Retirar ${file.path}`} disabled={busy} onClick={() => void action({ action: 'unstage', path: file.path })}><Minus size={14} /></button> : <button className="icon-btn" title="Preparar alterações" aria-label={`Preparar ${file.path}`} disabled={busy} onClick={() => void action({ action: 'stage', path: file.path })}><Plus size={14} /></button>}</span>
    <span className="w-4 text-center text-xs font-semibold" style={{ color: color(letter(file)) }}>{letter(file)}</span></div>;
  return <aside className="h-full w-full flex flex-col overflow-hidden bg-vs-sidebar text-[13px]" aria-label="Controle de código">
    <div className="h-[35px] shrink-0 flex items-center justify-between pl-5 pr-3"><span className="panel-title">Controle de código</span>{status?.initialized && <span className="flex items-center gap-1 text-xs text-vs-muted"><GitBranch size={13} />{status.branch}</span>}</div>
    <div className="flex-1 overflow-auto">
      {error && <p className="error-banner mx-3 mb-2">{error}</p>}
      <p className="px-5 pb-2 text-xs text-vs-dim">Operações de escrita exigem confiança no projeto, ativada no terminal.</p>
      {!status?.initialized ? <div className="px-5"><button className="btn-primary w-full" disabled={busy} onClick={() => void action({ action: 'init' })}>Inicializar Git</button></div> : <>
        <div className="px-3 space-y-1.5 mb-2">
          <textarea className="field w-full resize-none" rows={3} aria-label="Mensagem de commit" placeholder="Mensagem do commit" value={message} onChange={e => setMessage(e.target.value)} />
          <details><summary className="cursor-pointer text-xs text-vs-muted">Identidade para este commit (opcional)</summary><input className="field w-full mt-1.5" placeholder="Nome" value={authorName} onChange={e => setAuthorName(e.target.value)} /><input className="field w-full mt-1.5" placeholder="E-mail" value={authorEmail} onChange={e => setAuthorEmail(e.target.value)} /></details>
          <button className="btn-primary w-full" disabled={busy || !message.trim()} onClick={() => void action({ action: 'commit', message, authorName, authorEmail })}>Fazer commit</button>
        </div>
        {staged.length > 0 && <><div className="px-5 h-[22px] flex items-center justify-between text-[11px] uppercase font-bold">Alterações preparadas<span className="badge">{staged.length}</span></div>{staged.map(file => row(file, true))}</>}
        <div className="px-5 h-[22px] flex items-center justify-between text-[11px] uppercase font-bold">Alterações<span className="badge">{changes.length}</span></div>{changes.map(file => row(file, false))}
        {status.files.length === 0 && <p className="px-5 py-2" style={{ color: 'var(--vs-success)' }}>Nenhuma alteração pendente.</p>}
        <div className="px-5 h-[22px] mt-3 flex items-center text-[11px] uppercase font-bold">Commits locais</div>
        {status.commits.map(commit => <p key={commit.id} className="px-5 py-0.5 truncate text-vs-muted"><span className="text-vs-link font-code mr-2">{commit.short}</span>{commit.message}</p>)}
      </>}
    </div>
    {diff && <div className="fixed inset-0 z-[80] flex items-center justify-center p-8" style={{ background: '#00000080' }} onMouseDown={() => setDiff(null)}><div role="dialog" aria-modal="true" aria-label={`Diff de ${diff.path}`} className="menu-pop w-full max-w-4xl max-h-full flex flex-col border" style={{ background: 'var(--vs-editor)', borderColor: 'var(--vs-menu-border)', boxShadow: 'var(--vs-shadow)' }} onMouseDown={e => e.stopPropagation()}>
      <div className="h-[35px] shrink-0 flex items-center justify-between px-3 border-b" style={{ borderColor: 'var(--vs-border-soft)' }}><span className="text-vs-strong truncate">{diff.path}</span><button className="icon-btn" aria-label="Fechar diff" onClick={() => setDiff(null)}><X size={16} /></button></div>
      <DiffView text={diff.text || 'Sem diferenças para mostrar.'} /></div></div>}
  </aside>;
}
