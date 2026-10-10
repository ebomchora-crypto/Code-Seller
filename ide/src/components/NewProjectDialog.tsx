import { useEffect, useState, type FormEvent } from 'react';
import { FolderOpen } from 'lucide-react';
import { api } from '../lib/api';
import { cloud } from '../lib/mode';
import { useNavigate } from 'react-router-dom';
import { useUi } from '../lib/ui';
import { useProjectStore } from '../store/projectStore';
import type { Template } from '../lib/api';

export const templateOptions: { value: Template; label: string }[] = [
  { value: 'generic', label: 'Pasta vazia — qualquer linguagem ou estrutura' },
  { value: 'react', label: 'React + TypeScript (com preview)' },
  { value: 'static', label: 'HTML, CSS e JavaScript (com preview)' },
  { value: 'next', label: 'Next.js (App Router, TypeScript)' },
  { value: 'node', label: 'Node.js (servidor simples)' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
];
export function NewProjectDialog() {
  const open = useUi(state => state.newProject);
  const close = () => useUi.getState().set({ newProject: false });
  const createProject = useProjectStore(state => state.createProject);
  const navigate = useNavigate();
  const [name, setName] = useState(''); const [description, setDescription] = useState(''); const [template, setTemplate] = useState<Template>('generic');
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState<string | null>(null);
  const [location, setLocation] = useState(''); const [canPick, setCanPick] = useState(false);
  useEffect(() => { if (!open || cloud) return; void api<{ path: string; canPick: boolean }>('/default-location').then(value => { setLocation(previous => previous || value.path); setCanPick(value.canPick); }).catch(() => undefined); }, [open]);
  async function choose() { try { const result = await api<{ path?: string }>('/pick-directory', 'POST', {}); if (result.path) setLocation(result.path); } catch (error) { setMessage((error as Error).message); } }
  if (!open) return null;
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage(null);
    try { const project = await createProject(name, description, template, undefined, cloud ? undefined : location.trim() || undefined); setName(''); setDescription(''); close(); navigate(`/project/${project.id}`); }
    catch (error) { setMessage((error as Error).message); } finally { setBusy(false); }
  }
  return <div className="fixed inset-0 flex items-start justify-center pt-[12vh] p-4 z-[95]" style={{ background: '#00000080' }} onMouseDown={() => { if (!busy) close(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="create-title" className="menu-pop border p-5 w-full max-w-md" style={{ background: 'var(--vs-quick-bg)', borderColor: 'var(--vs-menu-border)', boxShadow: 'var(--vs-shadow)' }} onMouseDown={e => e.stopPropagation()} onKeyDown={e => { if (e.key === 'Escape' && !busy) close(); }}>
      <h3 id="create-title" className="text-[15px] font-semibold text-vs-strong mb-1">Novo projeto</h3><p className="text-xs text-vs-muted mb-4">Comece com uma pasta vazia ou escolha um modelo.</p>
      <form onSubmit={e => void submit(e)} className="space-y-3">
        <input autoFocus required maxLength={100} className="field w-full" placeholder="Nome do projeto" value={name} onChange={e => setName(e.target.value)} />
        <textarea className="field w-full resize-none" rows={2} placeholder="Descrição (opcional)" value={description} maxLength={500} onChange={e => setDescription(e.target.value)} />
        <label className="block text-xs text-vs-muted">Modelo<select className="field w-full mt-1.5" value={template} onChange={e => setTemplate(e.target.value as Template)}>{templateOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        {!cloud && <div className="text-xs text-vs-muted"><span>Salvar em</span>
          <div className="flex gap-2 mt-1.5"><input className="field flex-1 min-w-0" aria-label="Pasta onde o projeto será salvo" value={location} onChange={e => setLocation(e.target.value)} placeholder="C:\Users\você\Documents" />{canPick && <button type="button" className="btn-secondary" disabled={busy} onClick={() => void choose()}><FolderOpen size={14} />Escolher…</button>}</div>
          <p className="mt-1.5 text-vs-dim">O projeto vira uma pasta de verdade neste local: {location ? `${location.replace(/[\\/]+$/, '')}${location.includes('/') ? '/' : '\\'}${name.trim() || 'nome-do-projeto'}` : 'escolha o local.'}</p></div>}
        {message && <p role="alert" className="error-banner">{message}</p>}
        <div className="flex justify-end gap-2 pt-1"><button type="button" className="btn-secondary" disabled={busy} onClick={close}>Cancelar</button><button type="submit" className="btn-primary" disabled={busy || !name.trim()}>{busy ? 'Criando…' : 'Criar projeto'}</button></div>
      </form>
    </section></div>;
}
