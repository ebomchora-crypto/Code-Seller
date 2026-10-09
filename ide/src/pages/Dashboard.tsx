import { useEffect, useRef, useState, FormEvent } from 'react';
import { useProjectStore } from '../store/projectStore';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, FolderOpen, Trash2, Code2, Copy, Pencil, RotateCcw, HardDrive, FileArchive, FolderInput, Terminal } from 'lucide-react';
import { importZip } from '../lib/archive';
import { api, ProjectDetail } from '../lib/api';
import { askConfirm, askInput } from '../lib/dialogs';

const templateLabel = (template: string) => template === 'generic' ? 'Workspace' : template === 'react' ? 'React + TS' : 'HTML / CSS / JS';

export default function Dashboard() {
  const { projects, loading, error, deleted, fetchProjects, createProject, action, rename } = useProjectStore();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState<'react' | 'static' | 'generic'>('generic');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  useEffect(() => { void fetchProjects(false); }, [fetchProjects]);
  async function run(work: () => Promise<void>) {
    setMessage(null); setBusy(true);
    try { await work(); } catch (error) { setMessage((error as Error).message); } finally { setBusy(false); }
  }
  function create(event: FormEvent) {
    event.preventDefault();
    void run(async () => { const project = await createProject(name, description, template); setModal(false); navigate(`/project/${project.id}`); });
  }
  function openFolder() {
    void run(async () => {
      let project: ProjectDetail | { canceled: true };
      try { project = await api<ProjectDetail | { canceled: true }>('/pick-folder', 'POST', {}); }
      catch { const path = await askInput('Abrir pasta', '', { description: 'Informe o caminho completo da pasta. As edições serão salvas nos arquivos originais.', confirmLabel: 'Abrir' }); if (!path) return; project = await api<ProjectDetail>('/open-folder', 'POST', { path }); }
      if ('id' in project) navigate(`/project/${project.id}`);
    });
  }
  async function openByPath() {
    const path = await askInput('Abrir por caminho', '', { description: 'Caminho completo da pasta que deseja abrir. As edições serão salvas nos arquivos originais.', confirmLabel: 'Abrir' });
    if (path) void run(async () => { const project = await api<ProjectDetail>('/open-folder', 'POST', { path }); navigate(`/project/${project.id}`); });
  }
  async function importCopy() {
    const path = await askInput('Importar cópia da pasta', '', { description: 'Caminho completo da pasta. Será criada uma cópia dos arquivos de texto; dependências, Git e .env não são importados.', confirmLabel: 'Importar' });
    if (path) void run(async () => { const project = await api<ProjectDetail>('/import-folder', 'POST', { path }); navigate(`/project/${project.id}`); });
  }
  async function renameProject(project: (typeof projects)[number]) {
    const value = await askInput('Renomear projeto', project.name, { confirmLabel: 'Renomear' });
    if (value && value.trim()) void run(() => rename(project, value));
  }
  async function trashProject(id: string) {
    if (await askConfirm('Mover projeto para a lixeira?', { description: 'Você poderá restaurá-lo depois.', confirmLabel: 'Mover para a lixeira', danger: true })) void run(() => action(id, 'delete'));
  }
  const visible = projects.filter(project => project.name.toLowerCase().includes(search.toLowerCase()));
  const start = (Icon: typeof Plus, label: string, onClick: () => void, primary = false) => <button className={`flex items-center gap-2.5 py-1.5 text-left ${primary ? 'link !text-[15px]' : 'link'}`} disabled={busy} onClick={onClick}><Icon size={16} className="shrink-0" />{label}</button>;
  return <div className="min-h-screen" style={{ background: 'var(--vs-editor)', color: 'var(--vs-fg)' }}>
    <header className="h-[30px] flex items-center justify-between px-3 text-xs" style={{ background: 'var(--vs-titlebar)', color: 'var(--vs-titlebar-fg)', borderBottom: '1px solid var(--vs-border-soft)' }}>
      <span className="flex items-center gap-2"><Code2 size={15} style={{ color: 'var(--vs-link)' }} />Code Sellers IDE</span>
      <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: 'var(--vs-success)' }} />Ambiente local</span>
    </header>
    <main className="max-w-5xl mx-auto px-8 py-14">
      <h1 className="text-[32px] font-light tracking-tight text-vs-strong">Code Sellers <span className="text-vs-dim">IDE</span></h1>
      <p className="text-[18px] font-light text-vs-muted mt-1 mb-10">Seu espaço para construir. Seus arquivos ficam no seu computador.</p>
      <div className="grid md:grid-cols-[minmax(240px,1fr)_2fr] gap-x-16 gap-y-10">
        <section aria-label="Iniciar">
          <h2 className="text-[18px] font-normal text-vs-strong mb-3">Iniciar</h2>
          <div className="flex flex-col">
            {start(Plus, 'Novo projeto…', () => { setName(''); setDescription(''); setMessage(null); setModal(true); }, true)}
            {start(FolderOpen, 'Abrir pasta…', openFolder)}
            {start(Terminal, 'Abrir por caminho…', () => void openByPath())}
            {start(FolderInput, 'Importar cópia da pasta…', () => void importCopy())}
            {start(FileArchive, 'Importar ZIP…', () => fileInput.current?.click())}
          </div>
          <p className="text-xs text-vs-dim mt-8 flex items-center gap-2"><HardDrive size={14} /> Dados salvos em .code-makers/projects · sem conta e sem nuvem</p>
        </section>
        <section aria-label="Projetos">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex gap-4 text-[18px]"><button className={deleted ? 'text-vs-dim hover:text-vs-fg' : 'text-vs-strong'} onClick={() => void fetchProjects(false)}>Recentes{!deleted && projects.length ? <span className="badge ml-2 align-middle">{projects.length}</span> : null}</button><button className={deleted ? 'text-vs-strong' : 'text-vs-dim hover:text-vs-fg'} onClick={() => void fetchProjects(true)}>Lixeira</button></div>
            <div className="relative"><Search size={14} className="absolute left-2 top-[7px] text-vs-dim" /><input className="field pl-7 w-48 md:w-60" aria-label="Buscar projetos" placeholder="Buscar projetos…" value={search} onChange={e => setSearch(e.target.value)} /></div>
          </div>
          {(error || message) && !modal && <div role="alert" className="error-banner mb-4">{message || error}<button className="ml-4 underline" onClick={() => void fetchProjects()}>Tentar novamente</button></div>}
          {loading ? <p className="text-vs-dim py-8">Carregando projetos…</p> : visible.length ? <ul className="m-0 p-0 list-none">{visible.map(project => <li key={project.id} className="group flex items-center gap-3 h-9 px-2 -mx-2 hover:bg-vs-hover">
            <FolderOpen size={16} className="shrink-0" style={{ color: '#c09553' }} />
            {deleted ? <span className="truncate flex-1 text-vs-muted">{project.name}</span> : <Link className="link truncate !text-vs-link" to={`/project/${project.id}`}>{project.name}</Link>}
            <span className="text-xs text-vs-dim truncate hidden sm:inline flex-1 min-w-0">{project.description || templateLabel(project.template)}</span>
            <span className="text-xs text-vs-dim shrink-0 hidden md:inline">{new Date(project.updated_at).toLocaleDateString('pt-BR')}</span>
            <span className="flex shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100">{deleted ? <button disabled={busy} className="btn-secondary !min-h-[22px] !py-0 text-xs" onClick={() => void run(() => action(project.id, 'recover'))}><RotateCcw size={13} /> Restaurar</button> : <>
              <button className="icon-btn" aria-label={`Renomear ${project.name}`} disabled={busy} onClick={() => void renameProject(project)}><Pencil size={14} /></button>
              <button className="icon-btn" aria-label={`Duplicar ${project.name}`} disabled={busy} onClick={() => void run(() => action(project.id, 'duplicate'))}><Copy size={14} /></button>
              <button className="icon-btn" aria-label={`Mover ${project.name} para a lixeira`} disabled={busy} onClick={() => void trashProject(project.id)}><Trash2 size={14} /></button></>}</span>
          </li>)}</ul> : <div className="py-10 text-vs-muted"><h3 className="text-[15px] font-normal text-vs-fg">{deleted ? 'A lixeira está vazia' : search ? 'Nenhum resultado' : 'Seu próximo projeto está esperando'}</h3><p className="text-sm mt-1">{deleted ? 'Projetos removidos aparecem aqui para recuperação.' : 'Crie um projeto React ou comece com HTML, CSS e JavaScript.'}</p></div>}
        </section>
      </div>
    </main>
    <input hidden ref={fileInput} type="file" accept=".zip" onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void run(async () => { const files = await importZip(file); const template = 'generic'; const project = await createProject(file.name.replace(/\.zip$/i, '').slice(0, 100), 'Importado de ZIP', template, files); navigate(`/project/${project.id}`); }); }} />
    {modal && <div className="fixed inset-0 flex items-start justify-center pt-[12vh] p-4 z-20" style={{ background: '#00000080' }} onClick={() => { if (!busy) setModal(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="create-title" className="menu-pop border p-5 w-full max-w-md" style={{ background: 'var(--vs-quick-bg)', borderColor: 'var(--vs-menu-border)', boxShadow: 'var(--vs-shadow)' }} onClick={e => e.stopPropagation()}>
        <h3 id="create-title" className="text-[15px] font-semibold text-vs-strong mb-1">Novo projeto</h3><p className="text-xs text-vs-muted mb-4">Comece com uma pasta vazia ou use um template opcional.</p>
        <form onSubmit={create} className="space-y-3"><input autoFocus required maxLength={100} className="field w-full" placeholder="Nome do projeto" value={name} onChange={e => setName(e.target.value)} /><textarea className="field w-full resize-none" rows={2} placeholder="Descrição (opcional)" value={description} maxLength={500} onChange={e => setDescription(e.target.value)} />
          <label className="block text-xs text-vs-muted">Template<select className="field w-full mt-1.5" value={template} onChange={e => setTemplate(e.target.value as 'react' | 'static' | 'generic')}><option value="generic">Pasta vazia — qualquer estrutura</option><option value="react">React + TypeScript (opcional)</option><option value="static">HTML, CSS e JavaScript</option></select></label>
          {message && <p role="alert" className="error-banner">{message}</p>}
          <div className="flex justify-end gap-2 pt-1"><button type="button" className="btn-secondary" disabled={busy} onClick={() => setModal(false)}>Cancelar</button><button type="submit" className="btn-primary" disabled={busy || !name.trim()}>{busy ? 'Criando…' : 'Criar projeto'}</button></div></form>
      </section></div>}
  </div>;
}
