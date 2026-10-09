import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { X, Maximize2, Minimize2, Menu as MenuIcon, Files, Code2, Eye, Sparkles } from 'lucide-react';
import { useIsMobile } from '../lib/useIsMobile';
import { Sidebar } from '../components/Sidebar';
import { Editor } from '../components/Editor';
import { TitleBar } from '../components/TitleBar';
import { ActivityBar, type Activity } from '../components/ActivityBar';
import { EditorTabs, Breadcrumbs } from '../components/EditorTabs';
import { StatusBar } from '../components/StatusBar';
import { ContextMenu } from '../components/ContextMenu';
import { Sash } from '../components/Sash';
import EmptyWorkbench from './EmptyWorkbench';
import { useEditorStore } from '../store/editorStore';
import { useProjectStore } from '../store/projectStore';
import { useLocalProject } from '../hooks/useLocalProject';
import { api, previewable, ProjectDetail } from '../lib/api';
import { exportZip } from '../lib/archive';
import { parseProposal } from '../lib/proposals';
import { monaco } from '../lib/monaco';
import { workspaceInfo } from '../lib/workspaceInfo';
import { askConfirm, askInput } from '../lib/dialogs';
import { patchLayout, readLayout, savedSize } from '../lib/layout';
import { useMarkers } from '../lib/markers';
import { useGitSummary } from '../lib/useGitSummary';
import { usePreferences } from '../lib/preferences';
import { buildMenus } from '../lib/buildMenus';
import { commandForFile } from '../lib/runFile';
import { runInTerminal } from '../lib/terminalBridge';
import { pickFolder, openByPath, importCopy, pickZip } from '../lib/workspaceActions';
import { themes, themeNames } from '../lib/themes';
import { useUi } from '../lib/ui';
import { cloud, IDE_DOWNLOAD } from '../lib/mode';
const Preview = lazy(() => import('../components/Preview'));
const ChatPanel = lazy(() => import('../components/ChatPanel'));
const CloudAssistant = lazy(() => import('../components/CloudAssistant'));
const HistoryPanel = lazy(() => import('../components/HistoryPanel'));
const TerminalPanel = lazy(() => import('../components/TerminalPanel'));
const GitPanel = lazy(() => import('../components/GitPanel'));
const SearchPanel = lazy(() => import('../components/SearchPanel'));
const RunPanel = lazy(() => import('../components/RunPanel'));
const ProblemsPanel = lazy(() => import('../components/ProblemsPanel'));
const CommandPalette = lazy(() => import('../components/CommandPalette'));

type Bottom = 'terminal' | 'problems' | null;
const primaryBottom: Exclude<Bottom, null> = cloud ? 'problems' : 'terminal';
const normalize = (value: string) => { const trimmed = value.trim().replace(/\\/g, '/'); return trimmed.startsWith('/') ? trimmed : `/${trimmed}`; };

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  return id ? <ProjectWorkbench key={id} id={id} /> : <EmptyWorkbench />;
}

function ProjectWorkbench({ id }: { id: string }) {
  const { session, error: loadError } = useLocalProject(id);
  useEditorStore(state => state.files);
  const active = useEditorStore(state => state.activeFileId);
  const tabSize = usePreferences(state => state.tabSize);
  const sidebarRight = usePreferences(state => state.sidebarRight);
  const recents = useProjectStore(state => state.projects);
  const initial = useMemo(readLayout, []);
  const [sidebar, setSidebar] = useState(() => initial.sidebar !== false);
  const [preview, setPreview] = useState(() => initial.preview !== false);
  const [chat, setChat] = useState(() => initial.chat === true);
  const [sidebarWidth, setSidebarWidth] = useState(() => savedSize(initial.sidebarWidth, 260, 170, 520));
  const [panelHeight, setPanelHeight] = useState(() => savedSize(initial.panelHeight, 300, 120, 700));
  const [previewWidth, setPreviewWidth] = useState(() => savedSize(initial.previewWidth, 520, 280, 1000));
  const [chatWidth, setChatWidth] = useState(() => savedSize(initial.chatWidth, 360, 280, 700));
  const [history, setHistory] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activity, setActivity] = useState<Activity>('files');
  const [bottom, setBottom] = useState<Bottom>(cloud ? null : 'terminal');
  const [maximized, setMaximized] = useState(false);
  const [terminalOpened, setTerminalOpened] = useState(!cloud);
  const [gear, setGear] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => { if (bottom === 'terminal') setTerminalOpened(true); }, [bottom]);
  const [palette, setPalette] = useState<'files' | 'commands' | null>(null);
  const [split, setSplit] = useState<string | null>(null);
  const markers = useMarkers(id);
  const git = useGitSummary(id);
  const trail = useRef<{ stack: string[]; index: number; jumping: boolean }>({ stack: [], index: -1, jumping: false });
  const [, nudge] = useState(0);
  const mobile = useIsMobile();
  const [tab, setTab] = useState<'files' | 'editor' | 'preview' | 'ai' | 'search'>('files');
  const [burger, setBurger] = useState<{ x: number; y: number } | null>(null);
  const publishedFiles = useRef<Record<string, string> | null>(null);
  useEffect(() => { if (session && publishedFiles.current === null) publishedFiles.current = session.files; }, [session]);
  useEffect(() => { void useProjectStore.getState().fetchProjects(false); }, []);
  useEffect(() => { setSplit(null); return () => { monaco.editor.getModels().forEach(model => { if (model.uri.path.startsWith(`/projects/${id}/`)) model.dispose(); }); }; }, [id]);
  useEffect(() => { if (split && session && session.files[split] === undefined) setSplit(null); }, [session?.files, split]);
  useEffect(() => {
    const t = trail.current;
    if (t.jumping) { t.jumping = false; nudge(value => value + 1); return; }
    if (!active || t.stack[t.index] === active) return;
    t.stack = [...t.stack.slice(0, t.index + 1), active].slice(-50); t.index = t.stack.length - 1; nudge(value => value + 1);
  }, [active]);
  function go(step: number) {
    const t = trail.current; const next = t.index + step;
    const file = t.stack[next];
    if (!file || !session || session.files[file] === undefined) return;
    t.index = next; t.jumping = true;
    useEditorStore.getState().openFile({ id: file, name: file.split('/').at(-1)!, type: 'file' }, id); nudge(value => value + 1);
  }
  const navigate = useNavigate();
  useEffect(() => { patchLayout({ sidebar, preview, chat }); }, [sidebar, preview, chat]);
  const [launch, setLaunch] = useState<{ command: string; label: string } | null>(null);
  useEffect(() => { if (!launch) return; setBottom('terminal'); const timer = setTimeout(() => runInTerminal(launch), 350); setLaunch(null); return () => clearTimeout(timer); }, [launch]);
  useEffect(() => { const open = () => setBottom('terminal'); window.addEventListener('cm-open-terminal', open); return () => window.removeEventListener('cm-open-terminal', open); }, []);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => { if (session && session.status !== 'saved') { event.preventDefault(); event.returnValue = ''; } };
    const showView = (name: Activity) => { setActivity(name); setSidebar(true); };
    const keydown = (event: KeyboardEvent) => {
      if (event.altKey && !event.ctrlKey && event.key === 'ArrowLeft') { event.preventDefault(); go(-1); return; }
      if (event.altKey && !event.ctrlKey && event.key === 'ArrowRight') { event.preventDefault(); go(1); return; }
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key === 's') { event.preventDefault(); void saveNow(); }
      if (key === 'p') { event.preventDefault(); setPalette(event.shiftKey ? 'commands' : 'files'); }
      if (key === 'b') { event.preventDefault(); setSidebar(value => !value); }
      if (key === 'n' && !event.shiftKey) { event.preventDefault(); void newFile(); }
      if (key === 'w') { event.preventDefault(); const current = useEditorStore.getState().activeFileId; if (current) useEditorStore.getState().closeFile(current); }
      if (key === 'e' && event.shiftKey) { event.preventDefault(); showView('files'); }
      if (key === 'f' && event.shiftKey) { event.preventDefault(); showView('search'); }
      if (key === 'g' && event.shiftKey) { event.preventDefault(); showView('git'); }
      if (key === 'd' && event.shiftKey) { event.preventDefault(); showView('run'); }
      if (key === 'm' && event.shiftKey) { event.preventDefault(); setBottom('problems'); }
      if (key === 'i' && event.altKey) { event.preventDefault(); setChat(value => !value); }
      if (event.code === 'Backquote') { event.preventDefault(); setBottom(value => value === primaryBottom ? null : primaryBottom); }
    };
    window.addEventListener('beforeunload', beforeUnload); window.addEventListener('keydown', keydown);
    return () => { window.removeEventListener('beforeunload', beforeUnload); window.removeEventListener('keydown', keydown); };
  }, [session]);
  useEffect(() => {
    const wrap = (event: KeyboardEvent) => { if (event.altKey && event.key.toLowerCase() === 'z') { event.preventDefault(); usePreferences.getState().update({ wordWrap: !usePreferences.getState().wordWrap }); } };
    window.addEventListener('keydown', wrap); return () => window.removeEventListener('keydown', wrap);
  }, []);
  async function run(work: () => Promise<void>) {
    setBusy(true); setError(null);
    useEditorStore.setState({ locked: true });
    try { await work(); } catch (error) { setError((error as Error).message); } finally { setBusy(false); if (useEditorStore.getState().projectId === id) useEditorStore.setState({ locked: false }); }
  }
  async function apply(next: Record<string, string>, label: string) {
    if (!session) return;
    const previousLock = useEditorStore.getState().locked;
    useEditorStore.setState({ locked: true });
    try {
      await session.flush();
      const project = await api<ProjectDetail>(`/projects/${id}/apply`, 'POST', { revision: session.project.revision, files: next, label });
      session.replace(project); useEditorStore.getState().syncFiles(project.files, session.project.id);
    } finally { if (useEditorStore.getState().projectId === session.project.id) useEditorStore.setState({ locked: previousLock }); }
  }
  // Salvar = gravar o rascunho e, no site, publicar (monta as páginas e deixa o site no ar).
  async function saveNow() {
    if (!session) return;
    try {
      await session.flush();
      if (!cloud) return;
      const sent = session.files; setBusy(true);
      const result = await api<{ revision: number; publicUrl: string }>(`/projects/${id}/publish`, 'POST', { revision: session.project.revision });
      session.project = { ...session.project, revision: result.revision, publicUrl: result.publicUrl, published: true };
      publishedFiles.current = sent;
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); nudge(value => value + 1); }
  }
  async function newFile(folder?: string) {
    if (!session) return;
    const fallback = cloud ? 'secoes/nova-secao.html' : session.project.template === 'react' ? 'src/Componente.tsx' : 'novo-arquivo.txt';
    const value = await askInput('Novo arquivo', folder ? `${folder.slice(1)}/` : fallback, { description: 'Caminho do arquivo. As pastas são criadas automaticamente.', confirmLabel: 'Criar' });
    if (!value || !value.trim() || value.trim().endsWith('/')) return;
    void run(async () => {
      const path = normalize(value);
      parseProposal(JSON.stringify({ changes: [{ path, content: '' }] }));
      if (session.files[path] !== undefined) throw new Error('Já existe um arquivo neste caminho.');
      await apply({ ...session.files, [path]: '' }, 'Antes de criar arquivo');
      useEditorStore.getState().openFile({ id: path, name: path.split('/').at(-1)!, type: 'file' }, session.project.id);
    });
  }
  async function renamePath(target = active || undefined, folder = false) {
    if (!session || !target) return;
    const value = await askInput(folder ? 'Renomear pasta' : 'Renomear arquivo', target.slice(1), { description: 'Novo caminho. Atualize os imports que apontem para o caminho antigo.', confirmLabel: 'Renomear' });
    if (!value || normalize(value) === target) return;
    void run(async () => {
      const path = normalize(value);
      parseProposal(JSON.stringify({ changes: [{ path, content: '' }] }));
      const next: Record<string, string> = {};
      for (const [file, content] of Object.entries(session.files)) {
        const moved = folder ? (file.startsWith(`${target}/`) ? path + file.slice(target.length) : null) : (file === target ? path : null);
        const key = moved ?? file;
        if (Object.prototype.hasOwnProperty.call(next, key)) throw new Error('Já existe um arquivo neste caminho.');
        next[key] = content;
      }
      await apply(next, folder ? 'Antes de renomear pasta' : 'Antes de renomear arquivo');
      if (!folder) useEditorStore.getState().openFile({ id: path, name: path.split('/').at(-1)!, type: 'file' }, session.project.id);
    });
  }
  async function deletePath(target = active || undefined, folder = false) {
    if (!session || !target) return;
    const ok = await askConfirm(`Excluir ${target.slice(1)}?`, { description: folder ? 'Todos os arquivos desta pasta serão excluídos. Você pode recuperá-los no histórico.' : 'O arquivo poderá ser recuperado no histórico.', confirmLabel: 'Excluir', danger: true });
    if (!ok) return;
    void run(async () => {
      const next = Object.fromEntries(Object.entries(session.files).filter(([file]) => folder ? !file.startsWith(`${target}/`) : file !== target));
      await apply(next, folder ? 'Antes de excluir pasta' : 'Antes de excluir arquivo');
    });
  }
  async function checkpoint() {
    if (!session) return;
    const label = await askInput('Nome da versão', 'Checkpoint manual', { confirmLabel: 'Criar checkpoint' });
    if (label === null) return;
    void run(async () => { await session.flush(); await api(`/projects/${id}/checkpoint`, 'POST', { label: label.trim() || 'Checkpoint manual' }); const project = await api<ProjectDetail>(`/projects/${id}`); session.replace(project); });
  }
  async function leaveTo(work: () => Promise<string | null>) {
    if (!session) return;
    try { await session.flush(); const next = await work(); if (next) navigate(`/project/${next}`); } catch (e) { setError((e as Error).message); }
  }
  if (loadError) return <div className="p-10"><p className="error-banner mb-4">{loadError}</p><Link to="/" className="link">Voltar aos projetos</Link></div>;
  if (!session) return <div className="p-10 text-vs-dim">Carregando projeto local…</div>;

  const noPreview = !previewable(session.project.template);
  const showBottom = bottom !== null;
  const showView = (value: Activity) => { setActivity(value); setSidebar(true); };
  const selectActivity = (value: Activity) => { if (activity === value && sidebar) setSidebar(false); else showView(value); };
  const openFileItems = Object.keys(session.files).map(path => ({ label: path, action: () => useEditorStore.getState().openFile({ id: path, name: path.split('/').at(-1)!, type: 'file' }, session.project.id) }));
  const save = () => void saveNow();
  const toggleBottom = (value: Exclude<Bottom, null>) => setBottom(current => current === value ? null : value);
  const runCommand = (command: string, label: string) => setLaunch({ command, label });
  const runFile = () => { const command = active ? commandForFile(active) : null; if (command && active) runCommand(command, `Executar ${active.slice(1)}`); else setError('Este tipo de arquivo não tem comando de execução automático.'); };
  const commands = [
    { label: 'Arquivo: novo arquivo', action: () => void newFile() }, { label: 'Arquivo: renomear arquivo ativo', action: () => void renamePath() }, { label: 'Arquivo: excluir arquivo ativo', action: () => void deletePath() },
    { label: 'Arquivo: salvar', action: save }, { label: 'Executar: arquivo atual', action: runFile }, { label: 'Terminal: abrir', action: () => setBottom('terminal') }, { label: 'Problemas: abrir', action: () => setBottom('problems') },
    { label: 'Git: controle de código', action: () => showView('git') }, { label: 'Buscar: texto no projeto', action: () => showView('search') }, { label: 'Executar: painel de scripts', action: () => showView('run') },
    { label: 'Configurações: abrir', action: () => useUi.getState().set({ settings: true, settingsTab: 'appearance' }) }, { label: 'Configurações: assistente de IA', action: () => useUi.getState().set({ settings: true, settingsTab: 'ai' }) },
    ...themeNames.map(name => ({ label: `Tema de cores: ${themes[name].label}`, action: () => usePreferences.getState().update({ theme: name }) })),
    { label: 'Histórico: abrir checkpoints', action: () => setHistory(true) }, { label: 'Histórico: criar checkpoint', action: () => void checkpoint() }, { label: 'Exportar: baixar ZIP', action: () => void run(() => exportZip(session.project.name, session.files)) },
    { label: 'Assistente: abrir', action: () => setChat(true) }, { label: 'Preview: alternar', action: () => setPreview(value => !value) },
  ];
  const menus = buildMenus({
    hasProject: true, active, previewable: !noPreview, recents: recents.filter(project => project.id !== id).map(project => ({ id: project.id, name: project.name })),
    actions: {
      newFile: () => void newFile(), newProject: () => { if (cloud) location.href = '/code-maker'; else useUi.getState().set({ newProject: true }); }, openFolder: () => void leaveTo(pickFolder), openByPath: () => void leaveTo(openByPath), importCopy: () => void leaveTo(importCopy), importZip: () => void leaveTo(pickZip),
      openRecent: next => void leaveTo(async () => next), save, closeTab: () => { if (active) useEditorStore.getState().closeFile(active); }, closeFolder: () => void leaveTo(async () => { navigate('/'); return null; }),
      exportZip: () => void run(() => exportZip(session.project.name, session.files)), quickOpen: () => setPalette('files'), commands: () => setPalette('commands'),
      view: showView, problems: () => setBottom('problems'), terminal: () => toggleBottom(primaryBottom), sidebar: () => setSidebar(value => !value), preview: () => setPreview(value => !value), chat: () => setChat(value => !value),
      runFile, history: () => setHistory(true), renameFile: () => void renamePath(), deleteFile: () => void deletePath(),
    },
  });
  const unpublished = publishedFiles.current !== session.files || session.project.published === false;
  const publishButton = cloud ? { label: busy ? 'Publicando…' : session.status === 'saving' ? 'Salvando…' : unpublished ? 'Publicar' : 'Publicado ✓', done: !unpublished && !busy, busy: busy || session.status === 'saving', onClick: save } : undefined;
  if (mobile) {
    const burgerItems = [
      { label: 'Buscar no projeto', action: () => setTab('search') }, { label: 'Histórico de versões', action: () => setHistory(true) },
      { label: 'Configurações', action: () => useUi.getState().set({ settings: true, settingsTab: 'appearance' }) }, { separator: true as const },
      ...Object.entries(menus).filter(([name]) => ['Arquivo', 'Editar', 'Ver'].includes(name)).map(([name, items]) => ({ label: name, submenu: items })),
      ...(cloud ? [{ separator: true as const }, { label: 'Voltar ao Code Maker', action: () => { location.href = '/code-maker'; } }] : []),
    ];
    const tabs = [{ id: 'files' as const, label: 'Arquivos', Icon: Files }, { id: 'editor' as const, label: 'Código', Icon: Code2 }, ...(noPreview ? [] : [{ id: 'preview' as const, label: 'Site', Icon: Eye }]), { id: 'ai' as const, label: 'IA', Icon: Sparkles }];
    return <div className="flex flex-col overflow-hidden" style={{ height: '100dvh', background: 'var(--vs-editor)', color: 'var(--vs-fg)' }}>
      <header className="h-12 shrink-0 flex items-center gap-1 pl-1 pr-2" style={{ background: 'var(--vs-titlebar)', borderBottom: '1px solid var(--vs-border-soft)' }}>
        <button className="icon-btn" aria-label="Menu" onClick={e => { const rect = e.currentTarget.getBoundingClientRect(); setBurger({ x: rect.left, y: rect.bottom }); }}><MenuIcon size={20} /></button>
        <span className="flex-1 min-w-0 truncate font-medium text-[15px]" style={{ color: 'var(--vs-fg-strong)' }}>{session.project.name}</span>
        {publishButton && <button className="btn-primary !min-h-[36px] !px-4" style={publishButton.done ? { background: 'var(--vs-btn2-bg)' } : undefined} disabled={publishButton.busy} onClick={publishButton.onClick}>{publishButton.label}</button>}
      </header>
      {(error || session.error) && <div role="alert" className="error-banner rounded-none shrink-0 py-2 flex justify-between items-center gap-2 text-[13px]"><span>{error || session.error}</span><button className="underline shrink-0" onClick={() => { setError(null); if (session.error) void run(() => session.flush()); }}>{session.error ? 'Tentar de novo' : 'Fechar'}</button></div>}
      <main className="flex-1 min-h-0 relative flex flex-col">
        {tab === 'files' && <div className="flex-1 min-h-0" style={{ background: 'var(--vs-sidebar)' }}><Sidebar disabled={busy} markers={markers} projectName={session.project.name} onOpenFile={() => setTab('editor')} onCreate={folder => void newFile(folder)} onRename={(path, folder) => void renamePath(path, folder)} onDelete={(path, folder) => void deletePath(path, folder)} /></div>}
        {tab === 'editor' && <><EditorTabs markers={markers} onSplit={() => undefined} onQuickOpen={() => setPalette('files')} /><Breadcrumbs path={active} /><div className="flex flex-col flex-1 min-h-0"><Editor projectId={session.project.id} /></div></>}
        {tab === 'preview' && !noPreview && <div className="flex-1 min-h-0"><Suspense fallback={<p className="p-5 text-sm text-vs-dim">Carregando…</p>}><Preview project={session.project} files={session.files} /></Suspense></div>}
        {tab === 'ai' && <div className="flex-1 min-h-0"><Suspense fallback={<p className="p-5 text-sm text-vs-dim">Carregando assistente…</p>}>{cloud ? <CloudAssistant key={id} session={session} /> : <ChatPanel key={id} session={session} apply={apply} />}</Suspense></div>}
        {tab === 'search' && <div className="flex-1 min-h-0"><Suspense fallback={null}><SearchPanel session={session} apply={apply} /></Suspense></div>}
      </main>
      <nav className="shrink-0 flex safe-bottom" style={{ background: 'var(--vs-activitybar)', borderTop: '1px solid var(--vs-border-soft)' }} aria-label="Seções">
        {tabs.map(({ id: key, label, Icon }) => <button key={key} aria-label={label} aria-current={tab === key} className="flex-1 h-14 flex flex-col items-center justify-center gap-0.5 text-[11px]" style={{ color: tab === key ? 'var(--vs-fg-strong)' : 'var(--vs-activitybar-fg-dim)', borderTop: tab === key ? '2px solid var(--vs-focus)' : '2px solid transparent' }} onClick={() => setTab(key)}><Icon size={20} strokeWidth={1.7} />{label}</button>)}
      </nav>
      {burger && <ContextMenu x={burger.x} y={burger.y} close={() => setBurger(null)} items={burgerItems} />}
      {history && <Suspense fallback={null}><HistoryPanel session={session} busy={busy} close={() => setHistory(false)} checkpoint={() => void checkpoint()} restore={checkpointId => void run(async () => { await session.flush(); const project = await api<ProjectDetail>(`/projects/${id}/restore`, 'POST', { id: checkpointId }); session.replace(project); useEditorStore.getState().syncFiles(project.files, session.project.id); })} /></Suspense>}
      {palette && <Suspense fallback={null}><CommandPalette title={palette === 'files' ? 'Abrir arquivo…' : 'Executar comando…'} close={() => setPalette(null)} items={palette === 'files' ? openFileItems : commands} /></Suspense>}
    </div>;
  }
  const t = trail.current;
  const sidebarPanel = sidebar && <div className={`relative shrink-0 min-h-0 ${sidebarRight ? 'border-l' : 'border-r'}`} style={{ width: sidebarWidth, background: 'var(--vs-sidebar)', borderColor: 'var(--vs-border-soft)' }}>
    {activity === 'files' && <Sidebar disabled={busy} markers={markers} projectName={session.project.name} onCreate={folder => void newFile(folder)} onRename={(path, folder) => void renamePath(path, folder)} onDelete={(path, folder) => void deletePath(path, folder)} />}
    <Suspense fallback={null}>{activity === 'git' && <GitPanel key={id} projectId={session.project.id} />}{activity === 'search' && <SearchPanel session={session} apply={apply} />}{activity === 'run' && <RunPanel projectId={session.project.id} files={session.files} run={runCommand} />}</Suspense>
    <Sash orientation="vertical" edge={sidebarRight ? 'start' : 'end'} invert={sidebarRight} label="Redimensionar barra lateral" value={sidebarWidth} min={170} max={520} onChange={setSidebarWidth} onCommit={value => patchLayout({ sidebarWidth: value })} />
  </div>;
  return <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--vs-editor)', color: 'var(--vs-fg)' }}>
    <TitleBar publish={publishButton} projectName={session.project.name} menus={menus} hasProject sidebar={sidebar} bottom={showBottom} preview={preview && !noPreview} chat={chat} previewDisabled={noPreview}
      canBack={t.index > 0} canForward={t.index < t.stack.length - 1} onBack={() => go(-1)} onForward={() => go(1)} onQuickOpen={() => setPalette('files')}
      onSidebar={() => setSidebar(value => !value)} onBottom={() => toggleBottom(primaryBottom)} onPreview={() => setPreview(value => !value)} onChat={() => setChat(value => !value)} />
    {(error || session.error) && <div role="alert" className="error-banner rounded-none shrink-0 py-1.5 flex justify-between items-center"><span>{error || session.error}</span><span>{session.error && <button className="underline text-xs ml-3" onClick={() => void run(() => session.flush())}>Tentar salvar</button>}{error && <button className="underline text-xs ml-3" onClick={() => setError(null)}>Dispensar</button>}</span></div>}
    {noPreview && <div className="flex items-center gap-3 px-4 py-1.5 text-xs border-b text-vs-muted" style={{ background: 'var(--vs-sidebar)' }}><span>{workspaceInfo(session.files)}</span><span className="truncate flex-1" title={session.project.folderPath}>{session.project.folderPath || 'Pasta local da IDE'}</span><button className="btn-secondary !py-0 !min-h-[22px] text-xs" onClick={() => setBottom('terminal')}>Executar no terminal</button><span className="hidden lg:inline">Use a URL do seu servidor para visualizar aplicações web.</span></div>}
    <div className={`flex-1 flex min-h-0 min-w-0 ${sidebarRight ? 'flex-row-reverse' : ''}`}>
      <ActivityBar cloud={cloud} active={activity} sidebar={sidebar} chat={chat} hasProject onSelect={selectActivity} onHistory={() => setHistory(true)} onChat={() => setChat(value => !value)} gitChanges={git.changes} onGear={(x, y) => setGear({ x, y })} />
      {sidebarPanel}
      <div className="flex-1 flex flex-col min-w-64 min-h-0">
        <div className="flex-1 flex flex-col min-h-0" style={{ display: maximized && showBottom ? 'none' : 'flex' }}>
          <EditorTabs markers={markers} onSplit={() => setSplit(value => value ? null : active || Object.keys(session.files)[0] || null)} onQuickOpen={() => setPalette('files')} />
          <Breadcrumbs path={active} />
          <div className="flex flex-1 min-h-0">
            <div className="flex flex-col flex-1 min-w-0"><Editor projectId={session.project.id} /></div>
            {split && <div className="flex flex-col flex-1 min-w-0 border-l" style={{ borderColor: 'var(--vs-border)' }}><select className="field rounded-none text-xs" aria-label="Arquivo no segundo editor" value={split} onChange={e => setSplit(e.target.value)}>{Object.keys(session.files).map(path => <option key={path}>{path}</option>)}</select><Editor projectId={session.project.id} fileId={split} /></div>}
          </div>
        </div>
        {showBottom && <div className="relative shrink-0 flex flex-col border-t" style={{ height: maximized ? undefined : panelHeight, flex: maximized ? '1 1 0' : undefined, minHeight: 0, background: 'var(--vs-panel)', borderColor: 'var(--vs-border)' }}>
          {!maximized && <Sash orientation="horizontal" label="Redimensionar painel inferior" invert value={panelHeight} min={120} max={Math.max(240, window.innerHeight - 200)} onChange={setPanelHeight} onCommit={value => patchLayout({ panelHeight: value })} />}
          <div className="h-[35px] shrink-0 flex items-center justify-between px-3" role="tablist" aria-label="Painel">
            <div className="flex h-full">{([['problems', 'Problemas', markers.length], ['terminal', 'Terminal', 0]] as const).filter(([name]) => !cloud || name === 'problems').map(([name, label, count]) => <button key={name} role="tab" aria-selected={bottom === name} className="relative px-2.5 text-[11px] uppercase tracking-wide flex items-center gap-1.5" style={{ color: bottom === name ? 'var(--vs-fg-strong)' : 'var(--vs-fg-muted)', borderBottom: bottom === name ? '1px solid var(--vs-fg-strong)' : '1px solid transparent' }} onClick={() => setBottom(name)}>{label}{count > 0 && <span className="badge">{count}</span>}</button>)}</div>
            <div className="flex"><button className="icon-btn" title={maximized ? 'Restaurar tamanho do painel' : 'Maximizar painel'} aria-label={maximized ? 'Restaurar painel' : 'Maximizar painel'} onClick={() => setMaximized(value => !value)}>{maximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}</button><button className="icon-btn" title="Fechar painel" aria-label="Fechar painel" onClick={() => { setBottom(null); setMaximized(false); }}><X size={16} /></button></div>
          </div>
          <div className="flex-1 min-h-0 relative">
            <Suspense fallback={null}>
              <div className="absolute inset-0" style={{ display: bottom === 'terminal' ? 'block' : 'none' }}>{terminalOpened && !cloud && <TerminalPanel key={id} projectId={session.project.id} />}</div>
              {bottom === 'problems' && <div className="absolute inset-0"><ProblemsPanel projectId={session.project.id} /></div>}
            </Suspense>
          </div>
        </div>}
      </div>
      {preview && !noPreview && <div className={`relative shrink-0 min-h-0 ${sidebarRight ? 'border-r' : 'border-l'}`} style={{ width: previewWidth, borderColor: 'var(--vs-border)' }}>
        <Sash orientation="vertical" invert={!sidebarRight} edge={sidebarRight ? 'end' : 'start'} label="Redimensionar preview" value={previewWidth} min={280} max={1000} onChange={setPreviewWidth} onCommit={value => patchLayout({ previewWidth: value })} />
        <Suspense fallback={<p className="p-5 text-sm text-vs-dim">Carregando runtime…</p>}><Preview project={session.project} files={session.files} /></Suspense></div>}
      {chat && <div className={`relative shrink-0 min-h-0 ${sidebarRight ? 'border-r' : 'border-l'}`} style={{ width: chatWidth, borderColor: 'var(--vs-border)' }}>
        <Sash orientation="vertical" invert={!sidebarRight} edge={sidebarRight ? 'end' : 'start'} label="Redimensionar assistente" value={chatWidth} min={280} max={700} onChange={setChatWidth} onCommit={value => patchLayout({ chatWidth: value })} />
        <Suspense fallback={<p className="p-5 text-sm text-vs-dim">Carregando assistente…</p>}>{cloud ? <CloudAssistant key={id} session={session} /> : <ChatPanel key={id} session={session} apply={apply} />}</Suspense></div>}
    </div>
    <StatusBar publish={cloud ? { published: publishedFiles.current === session.files && session.project.published !== false, url: session.project.publicUrl } : undefined} status={session.status} busy={busy} active={active} git={git} markers={markers} tabSize={tabSize} onSave={save} onProblems={() => setBottom('problems')} onGit={() => showView('git')} />
    {history && <Suspense fallback={null}><HistoryPanel session={session} busy={busy} close={() => setHistory(false)} checkpoint={() => void checkpoint()} restore={checkpointId => void run(async () => { await session.flush(); const project = await api<ProjectDetail>(`/projects/${id}/restore`, 'POST', { id: checkpointId }); session.replace(project); useEditorStore.getState().syncFiles(project.files, session.project.id); })} /></Suspense>}
    {palette && <Suspense fallback={null}><CommandPalette title={palette === 'files' ? 'Abrir arquivo…' : 'Executar comando…'} close={() => setPalette(null)} items={palette === 'files' ? openFileItems : commands} /></Suspense>}
    {gear && <ContextMenu x={gear.x} y={gear.y} close={() => setGear(null)} items={[
      { label: 'Paleta de comandos…', shortcut: 'Ctrl+Shift+P', action: () => setPalette('commands') }, { separator: true },
      { label: 'Configurações', shortcut: 'Ctrl+,', action: () => useUi.getState().set({ settings: true, settingsTab: 'appearance' }) },
      { label: 'Atalhos de teclado', action: () => useUi.getState().set({ settings: true, settingsTab: 'keys' }) },
      { label: 'Tema de cores', submenu: themeNames.map(name => ({ label: themes[name].label, checked: usePreferences.getState().theme === name, action: () => usePreferences.getState().update({ theme: name }) })) },
      ...(cloud ? [{ separator: true as const }, { label: 'Baixar a IDE para Windows', action: () => { location.href = IDE_DOWNLOAD; } }] : []),
    ]} />}
  </div>;
}
