import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Maximize2, Minimize2, Menu as MenuIcon, Files, Code2, Sparkles, Terminal as TerminalIcon, Play, Eye } from 'lucide-react';
import { useIsMobile } from '../lib/useIsMobile';
import { api } from '../lib/api';
import type { PreviewTarget } from '../components/FolderPreview';
import { Sidebar } from '../components/Sidebar';
import { Editor } from '../components/Editor';
import { TitleBar } from '../components/TitleBar';
import { ActivityBar, type Activity } from '../components/ActivityBar';
import { EditorTabs, Breadcrumbs } from '../components/EditorTabs';
import { StatusBar } from '../components/StatusBar';
import { ContextMenu } from '../components/ContextMenu';
import { Sash } from '../components/Sash';
import { useEditorStore } from '../store/editorStore';
import { useProjectStore } from '../store/projectStore';
import { useLazyProject } from '../hooks/useLazyProject';
import type { ProjectDetail } from '../lib/api';
import { askConfirm, askInput } from '../lib/dialogs';
import { patchLayout, readLayout, savedSize } from '../lib/layout';
import { useMarkers } from '../lib/markers';
import { useGitSummary } from '../lib/useGitSummary';
import { usePreferences } from '../lib/preferences';
import { buildMenus } from '../lib/buildMenus';
import { commandForFile } from '../lib/runFile';
import { runInTerminal } from '../lib/terminalBridge';
import { pickFolder, openByPath, importCopy, pickZip } from '../lib/workspaceActions';
import { formatSize, fsFind, fsOp, fsRestore, fsVersions, parentOf } from '../lib/lazyFs';
import { themes, themeNames } from '../lib/themes';
import { useUi } from '../lib/ui';
const ChatPanel = lazy(() => import('../components/ChatPanel'));
const TerminalPanel = lazy(() => import('../components/TerminalPanel'));
const GitPanel = lazy(() => import('../components/GitPanel'));
const LazySearchPanel = lazy(() => import('../components/LazySearchPanel'));
const RunPanel = lazy(() => import('../components/RunPanel'));
const ProblemsPanel = lazy(() => import('../components/ProblemsPanel'));
const FolderPreview = lazy(() => import('../components/FolderPreview'));
const CommandPalette = lazy(() => import('../components/CommandPalette'));

type Bottom = 'terminal' | 'problems' | null;
const normalize = (value: string) => { const trimmed = value.trim().replace(/\\/g, '/'); return trimmed.startsWith('/') ? trimmed : `/${trimmed}`; };

/** Pasta aberta do computador, de qualquer tamanho: a árvore e os arquivos são carregados sob demanda. */
export default function LazyWorkbench({ project }: { project: ProjectDetail }) {
  const id = project.id;
  const lazyProject = useLazyProject(project);
  const mobile = useIsMobile();
  const [tab, setTab] = useState<'files' | 'editor' | 'search' | 'terminal' | 'site' | 'ai'>('files');
  const [burger, setBurger] = useState<{ x: number; y: number } | null>(null);
  const { status, error, setError, flush, open, loadDir, writeFile, disk, reload, loadMore } = lazyProject;
  const active = useEditorStore(state => state.activeFileId);
  const tabSize = usePreferences(state => state.tabSize);
  const sidebarRight = usePreferences(state => state.sidebarRight);
  const recents = useProjectStore(state => state.projects);
  const navigate = useNavigate();
  const initial = useMemo(readLayout, []);
  const [sidebar, setSidebar] = useState(() => initial.sidebar !== false);
  const [chat, setChat] = useState(() => initial.chat === true);
  const [sidebarWidth, setSidebarWidth] = useState(() => savedSize(initial.sidebarWidth, 280, 170, 560));
  const [panelHeight, setPanelHeight] = useState(() => savedSize(initial.panelHeight, 300, 120, 700));
  const [chatWidth, setChatWidth] = useState(() => savedSize(initial.chatWidth, 380, 280, 700));
  const [activity, setActivity] = useState<Activity>('files');
  const [bottom, setBottom] = useState<Bottom>('terminal');
  const [maximized, setMaximized] = useState(false);
  const [preview, setPreview] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<PreviewTarget>({ kind: 'static' });
  const [previewWidth, setPreviewWidth] = useState(() => savedSize(initial.previewWidth, 440, 280, 1000));
  const [running, setRunning] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [terminalOpened, setTerminalOpened] = useState(true);
  const [palette, setPalette] = useState<'files' | 'commands' | 'versions' | null>(null);
  const [versionItems, setVersionItems] = useState<{ label: string; action: () => void }[]>([]);
  const [gear, setGear] = useState<{ x: number; y: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [launch, setLaunch] = useState<{ command: string; label: string } | null>(null);
  const markers = useMarkers(id);
  const git = useGitSummary(id);
  const trail = useRef<{ stack: string[]; index: number; jumping: boolean }>({ stack: [], index: -1, jumping: false });
  const [, nudge] = useState(0);
  useEffect(() => { void useProjectStore.getState().fetchProjects(false); }, []);
  const lastStatus = useRef(status);
  useEffect(() => { if (lastStatus.current === 'saving' && status === 'saved') setReloadKey(value => value + 1); lastStatus.current = status; }, [status]);
  useEffect(() => { if (bottom === 'terminal') setTerminalOpened(true); }, [bottom]);
  useEffect(() => { patchLayout({ sidebar, chat }); }, [sidebar, chat]);
  useEffect(() => { if (!launch) return; setBottom('terminal'); const timer = setTimeout(() => runInTerminal(launch), 350); setLaunch(null); return () => clearTimeout(timer); }, [launch]);
  useEffect(() => { const openTerminal = () => setBottom('terminal'); window.addEventListener('cm-open-terminal', openTerminal); return () => window.removeEventListener('cm-open-terminal', openTerminal); }, []);
  useEffect(() => {
    const t = trail.current;
    if (t.jumping) { t.jumping = false; nudge(value => value + 1); return; }
    if (!active || t.stack[t.index] === active) return;
    t.stack = [...t.stack.slice(0, t.index + 1), active].slice(-50); t.index = t.stack.length - 1; nudge(value => value + 1);
  }, [active]);
  function go(step: number) { const t = trail.current; const file = t.stack[t.index + step]; if (!file) return; t.index += step; t.jumping = true; useEditorStore.getState().setActiveFile(file); nudge(value => value + 1); }
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'F5' && !event.ctrlKey) { event.preventDefault(); void runProject(); return; }
      if (event.altKey && !event.ctrlKey && event.key === 'ArrowLeft') { event.preventDefault(); go(-1); return; }
      if (event.altKey && !event.ctrlKey && event.key === 'ArrowRight') { event.preventDefault(); go(1); return; }
      if (event.altKey && event.key.toLowerCase() === 'z' && !event.ctrlKey) { event.preventDefault(); usePreferences.getState().update({ wordWrap: !usePreferences.getState().wordWrap }); return; }
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase(); const view = (name: Activity) => { setActivity(name); setSidebar(true); };
      if (key === 's') { event.preventDefault(); void flush(); }
      if (key === 'p') { event.preventDefault(); setPalette(event.shiftKey ? 'commands' : 'files'); }
      if (key === 'b') { event.preventDefault(); setSidebar(value => !value); }
      if (key === 'n' && !event.shiftKey) { event.preventDefault(); void newFile(); }
      if (key === 'w') { event.preventDefault(); const current = useEditorStore.getState().activeFileId; if (current) useEditorStore.getState().closeFile(current); }
      if (key === 'e' && event.shiftKey) { event.preventDefault(); view('files'); }
      if (key === 'f' && event.shiftKey) { event.preventDefault(); view('search'); }
      if (key === 'g' && event.shiftKey) { event.preventDefault(); view('git'); }
      if (key === 'd' && event.shiftKey) { event.preventDefault(); view('run'); }
      if (key === 'm' && event.shiftKey) { event.preventDefault(); setBottom('problems'); }
      if (key === 'i' && event.altKey) { event.preventDefault(); setChat(value => !value); }
      if (event.code === 'Backquote') { event.preventDefault(); setBottom(value => value === 'terminal' ? null : 'terminal'); }
    };
    window.addEventListener('keydown', keydown); return () => window.removeEventListener('keydown', keydown);
  }, [flush, id]);

  const refreshParent = (path: string) => loadDir(parentOf(path));
  const closeUnder = (path: string, folder: boolean) => useEditorStore.getState().openFiles.filter(file => file.id === path || (folder && file.id.startsWith(`${path}/`))).forEach(file => { disk.delete(file.id); useEditorStore.getState().closeFile(file.id); });
  async function guarded(work: () => Promise<void>) { setBusy(true); setError(null); try { await work(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }
  async function newFile(folder?: string) {
    const value = await askInput('Novo arquivo', folder ? `${folder.slice(1)}/` : '', { description: 'Caminho a partir da raiz da pasta. As pastas são criadas automaticamente.', confirmLabel: 'Criar' });
    if (!value?.trim() || value.trim().endsWith('/')) return;
    void guarded(async () => { const path = normalize(value); await fsOp(id, { op: 'create', path }); await refreshParent(path); await open(path); });
  }
  async function renamePath(target = active || undefined, folder = false) {
    if (!target) return;
    const value = await askInput(folder ? 'Renomear pasta' : 'Renomear arquivo', target.slice(1), { description: 'Novo caminho. Atualize os imports que apontem para o caminho antigo.', confirmLabel: 'Renomear' });
    if (!value?.trim() || normalize(value) === target) return;
    void guarded(async () => { const to = normalize(value); await flush(); await fsOp(id, { op: 'rename', path: target, to }); closeUnder(target, folder); await Promise.all([refreshParent(target), refreshParent(to)]); if (!folder) await open(to); });
  }
  async function deletePath(target = active || undefined, folder = false) {
    if (!target) return;
    const ok = await askConfirm(`Excluir ${target.slice(1)}?`, { description: folder ? 'A pasta inteira vai para a Lixeira do computador.' : 'O arquivo vai para a Lixeira do computador.', confirmLabel: 'Excluir', danger: true });
    if (!ok) return;
    void guarded(async () => { await fsOp(id, { op: 'delete', path: target }); closeUnder(target, folder); await refreshParent(target); });
  }
  async function showVersions() {
    const target = active; if (!target) { setError('Abra um arquivo para ver as versões anteriores.'); return; }
    try {
      await flush(); const { versions } = await fsVersions(id, target);
      if (!versions.length) { setError('Ainda não há versões anteriores deste arquivo. Elas são guardadas automaticamente quando você salva uma alteração.'); return; }
      setVersionItems(versions.map(version => ({ label: `${new Date(version.time).toLocaleString('pt-BR')} · ${formatSize(version.size)}`, action: () => void guarded(async () => { await fsRestore(id, target, version.id); await reload(target); }) })));
      setPalette('versions');
    } catch (e) { setError((e as Error).message); }
  }
  async function openAt(path: string, line: number) { await open(path); setTimeout(() => window.dispatchEvent(new CustomEvent('cm-reveal-line', { detail: { line, path } })), 250); }
  const runCommand = (command: string, label: string) => setLaunch({ command, label });
  /** Executar: apps com servidor (npm) rodam no terminal e abrem ao lado; sites simples abrem direto na visualização. */
  async function runProject() {
    setError(null); await flush();
    const show = (target: PreviewTarget) => { setPreviewTarget(target); setPreview(true); setReloadKey(value => value + 1); if (mobile) setTab('site'); };
    try {
      const workspace = await api<{ scripts?: Record<string, string> }>(`/projects/${id}/workspace`);
      const script = workspace.scripts?.dev ? 'dev' : workspace.scripts?.start ? 'start' : null;
      if (script) {
        const text = workspace.scripts![script]; const port = /vite/.test(text) ? 5173 : /next|react-scripts|node/.test(text) ? 3000 : 3000;
        setRunning(true); show({ kind: 'url', url: `http://localhost:${port}` }); runCommand(`npm install && npm run ${script}`, 'Executar projeto'); return;
      }
    } catch { /* sem package.json: tenta como site simples */ }
    try { await api(`/projects/${id}/fs/serve`, 'POST', {}); show({ kind: 'static' }); return; } catch { /* sem index.html */ }
    runFile();
  }
  const runFile = () => { const command = active ? commandForFile(active) : null; if (command && active) runCommand(command, `Executar ${active.slice(1)}`); else setError('Este tipo de arquivo não tem comando de execução automático.'); };
  const toggleBottom = (value: Exclude<Bottom, null>) => setBottom(current => current === value ? null : value);
  const showView = (value: Activity) => { setActivity(value); setSidebar(true); };
  const openFiles = useEditorStore(state => state.openFiles);
  // O assistente enxerga os arquivos abertos (e só altera o arquivo ativo): o resto da pasta fica no disco.
  const session = useMemo(() => ({ project, status, error, get files() { return Object.fromEntries(useEditorStore.getState().openFiles.filter(file => (!file.kind || file.kind === 'text') && typeof file.content === 'string').map(file => [file.id, file.content as string])); }, flush, replace: () => undefined, onChange: () => undefined }) as never, [project, status, error, flush, openFiles]);
  const applyFiles = async (next: Record<string, string>) => { const current = (session as { files: Record<string, string> }).files; for (const [path, content] of Object.entries(next)) if (current[path] !== content) await writeFile(path, content); };
  const commands = [
    { label: 'Arquivo: novo arquivo', action: () => void newFile() }, { label: 'Arquivo: renomear arquivo ativo', action: () => void renamePath() }, { label: 'Arquivo: excluir arquivo ativo', action: () => void deletePath() },
    { label: 'Executar: projeto', action: () => void runProject() }, { label: 'Visualização: alternar', action: () => setPreview(value => !value) }, { label: 'Arquivo: salvar', action: () => void flush() }, { label: 'Arquivo: restaurar versão anterior…', action: () => void showVersions() }, { label: 'Executar: arquivo atual', action: runFile }, { label: 'Terminal: abrir', action: () => setBottom('terminal') }, { label: 'Problemas: abrir', action: () => setBottom('problems') },
    { label: 'Git: controle de código', action: () => showView('git') }, { label: 'Buscar: texto na pasta', action: () => showView('search') }, { label: 'Executar: painel de scripts', action: () => showView('run') },
    { label: 'Configurações: abrir', action: () => useUi.getState().set({ settings: true, settingsTab: 'appearance' }) }, { label: 'Configurações: assistente de IA', action: () => useUi.getState().set({ settings: true, settingsTab: 'ai' }) },
    ...themeNames.map(name => ({ label: `Tema de cores: ${themes[name].label}`, action: () => usePreferences.getState().update({ theme: name }) })), { label: 'Assistente: abrir', action: () => setChat(true) },
  ];
  const leaveTo = async (work: () => Promise<string | null>) => { try { await flush(); const next = await work(); if (next) navigate(`/project/${next}`); } catch (e) { setError((e as Error).message); } };
  const menus = buildMenus({
    lazy: true, hasProject: true, active, previewable: true, recents: recents.filter(item => item.id !== id).map(item => ({ id: item.id, name: item.name })),
    actions: {
      newFile: () => void newFile(), newProject: () => useUi.getState().set({ newProject: true }), openFolder: () => void leaveTo(pickFolder), openByPath: () => void leaveTo(openByPath), importCopy: () => void leaveTo(importCopy), importZip: () => void leaveTo(pickZip),
      openRecent: next => void leaveTo(async () => next), save: () => void flush(), closeTab: () => { if (active) useEditorStore.getState().closeFile(active); }, closeFolder: () => void leaveTo(async () => { navigate('/'); return null; }),
      exportZip: () => undefined, quickOpen: () => setPalette('files'), commands: () => setPalette('commands'), view: showView, problems: () => setBottom('problems'), terminal: () => toggleBottom('terminal'),
      sidebar: () => setSidebar(value => !value), preview: () => setPreview(value => !value), chat: () => setChat(value => !value), runFile: () => void runProject(), history: () => void showVersions(), renameFile: () => void renamePath(), deleteFile: () => void deletePath(),
    },
  });
  if (mobile) {
    const burgerItems = [
      { label: 'Executar', action: () => void runProject() }, { label: 'Buscar no projeto', action: () => setTab('search') }, { label: 'Versões anteriores do arquivo', action: () => void showVersions() },
      { label: 'Configurações', action: () => useUi.getState().set({ settings: true, settingsTab: 'appearance' }) }, { separator: true as const },
      ...Object.entries(menus).filter(([name]) => ['Arquivo', 'Editar', 'Ver'].includes(name)).map(([name, items]) => ({ label: name, submenu: items })),
    ];
    const tabs = [{ id: 'files' as const, label: 'Arquivos', Icon: Files }, { id: 'editor' as const, label: 'Código', Icon: Code2 }, { id: 'site' as const, label: 'Site', Icon: Eye }, { id: 'terminal' as const, label: 'Terminal', Icon: TerminalIcon }, { id: 'ai' as const, label: 'IA', Icon: Sparkles }];
    return <div className="flex flex-col overflow-hidden" style={{ height: '100dvh', background: 'var(--vs-editor)', color: 'var(--vs-fg)' }}>
      <header className="h-12 shrink-0 flex items-center gap-1 pl-1 pr-2" style={{ background: 'var(--vs-titlebar)', borderBottom: '1px solid var(--vs-border-soft)' }}>
        <button className="icon-btn" aria-label="Menu" onClick={e => { const rect = e.currentTarget.getBoundingClientRect(); setBurger({ x: rect.left, y: rect.bottom }); }}><MenuIcon size={20} /></button>
        <span className="flex-1 min-w-0 truncate font-medium text-[15px]" style={{ color: 'var(--vs-fg-strong)' }}>{project.name}</span>
        <button className="btn-primary !min-h-[34px] !px-3" onClick={() => void runProject()}><Play size={13} fill="currentColor" />Executar</button>
        <span className="text-[11px]" style={{ color: 'var(--vs-fg-dim)' }}>{status === 'saving' ? 'Salvando…' : status === 'error' ? 'Erro ao salvar' : 'Salvo'}</span>
      </header>
      {error && <div role="alert" className="error-banner rounded-none shrink-0 py-2 flex justify-between items-center gap-2 text-[13px]"><span>{error}</span><button className="underline shrink-0" onClick={() => setError(null)}>Fechar</button></div>}
      <main className="flex-1 min-h-0 relative flex flex-col">
        {tab === 'files' && <div className="flex-1 min-h-0" style={{ background: 'var(--vs-sidebar)' }}><Sidebar lazy disabled={busy} markers={markers} projectName={project.name} onOpenFile={() => setTab('editor')} onExpand={path => void loadDir(path)} onMore={path => void loadMore(path)} onRefresh={() => { void loadDir('/'); }} onCreate={folder => void newFile(folder)} onRename={(path, folder) => void renamePath(path, folder)} onDelete={(path, folder) => void deletePath(path, folder)} /></div>}
        {tab === 'editor' && <><EditorTabs markers={markers} onSplit={() => undefined} onQuickOpen={() => setPalette('files')} /><Breadcrumbs path={active} /><div className="flex flex-col flex-1 min-h-0"><Editor projectId={id} /></div></>}
        {tab === 'search' && <div className="flex-1 min-h-0"><Suspense fallback={null}><LazySearchPanel projectId={id} onOpen={(path, line) => { setTab('editor'); void openAt(path, line); }} /></Suspense></div>}
        {tab === 'site' && <div className="flex-1 min-h-0"><Suspense fallback={null}><FolderPreview projectId={id} target={previewTarget} reloadKey={reloadKey} running={running} onUrl={url => { setPreviewTarget({ kind: 'url', url }); setReloadKey(value => value + 1); }} /></Suspense></div>}
        {tab === 'terminal' && <div className="flex-1 min-h-0 relative"><Suspense fallback={null}><div className="absolute inset-0"><TerminalPanel key={id} projectId={id} /></div></Suspense></div>}
        {tab === 'ai' && <div className="flex-1 min-h-0"><Suspense fallback={<p className="p-5 text-sm text-vs-dim">Carregando assistente…</p>}><ChatPanel key={id} session={session} modes={['ask', 'plan', 'edit']} apply={applyFiles} /></Suspense></div>}
      </main>
      <nav className="shrink-0 flex safe-bottom" style={{ background: 'var(--vs-activitybar)', borderTop: '1px solid var(--vs-border-soft)' }} aria-label="Seções">
        {tabs.map(({ id: key, label, Icon }) => <button key={key} aria-label={label} aria-current={tab === key} className="flex-1 h-14 flex flex-col items-center justify-center gap-0.5 text-[11px]" style={{ color: tab === key ? 'var(--vs-fg-strong)' : 'var(--vs-activitybar-fg-dim)', borderTop: tab === key ? '2px solid var(--vs-focus)' : '2px solid transparent' }} onClick={() => setTab(key)}><Icon size={20} strokeWidth={1.6} />{label}</button>)}
      </nav>
      {burger && <ContextMenu x={burger.x} y={burger.y} close={() => setBurger(null)} items={burgerItems} />}
      {palette && <Suspense fallback={null}><CommandPalette title={palette === 'files' ? 'Abrir arquivo…' : palette === 'versions' ? 'Restaurar versão anterior deste arquivo…' : 'Executar comando…'} close={() => setPalette(null)} items={palette === 'files' ? [] : palette === 'versions' ? versionItems : commands}
        search={palette === 'files' ? async query => (await fsFind(id, query)).paths.map(path => ({ label: path, action: () => { setTab('editor'); void open(path); } })) : undefined} /></Suspense>}
    </div>;
  }
  const showBottom = bottom !== null; const t = trail.current;
  const sidebarPanel = sidebar && <div className={`relative shrink-0 min-h-0 ${sidebarRight ? 'border-l' : 'border-r'}`} style={{ width: sidebarWidth, background: 'var(--vs-sidebar)', borderColor: 'var(--vs-border-soft)' }}>
    {activity === 'files' && <Sidebar lazy disabled={busy} markers={markers} projectName={project.name} onExpand={path => void loadDir(path)} onMore={path => void loadMore(path)} onRefresh={() => { void loadDir('/'); }} onCreate={folder => void newFile(folder)} onRename={(path, folder) => void renamePath(path, folder)} onDelete={(path, folder) => void deletePath(path, folder)} />}
    <Suspense fallback={null}>{activity === 'git' && <GitPanel key={id} projectId={id} />}{activity === 'search' && <LazySearchPanel projectId={id} onOpen={(path, line) => void openAt(path, line)} />}{activity === 'run' && <RunPanel projectId={id} files={{}} hasPackage run={runCommand} />}</Suspense>
    <Sash orientation="vertical" edge={sidebarRight ? 'start' : 'end'} invert={sidebarRight} label="Redimensionar barra lateral" value={sidebarWidth} min={170} max={560} onChange={setSidebarWidth} onCommit={value => patchLayout({ sidebarWidth: value })} />
  </div>;
  return <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--vs-editor)', color: 'var(--vs-fg)' }}>
    <TitleBar projectName={project.name} menus={menus} hasProject sidebar={sidebar} bottom={showBottom} preview={preview} run={{ label: 'Executar', onClick: () => void runProject() }} chat={chat} previewDisabled={false} canBack={t.index > 0} canForward={t.index < t.stack.length - 1}
      onBack={() => go(-1)} onForward={() => go(1)} onQuickOpen={() => setPalette('files')} onSidebar={() => setSidebar(value => !value)} onBottom={() => toggleBottom('terminal')} onPreview={() => setPreview(value => !value)} onChat={() => setChat(value => !value)} />
    {error && <div role="alert" className="error-banner rounded-none shrink-0 py-1.5 flex justify-between items-center"><span>{error}</span><button className="underline text-xs ml-3" onClick={() => setError(null)}>Dispensar</button></div>}
    <div className={`flex-1 flex min-h-0 min-w-0 ${sidebarRight ? 'flex-row-reverse' : ''}`}>
      <ActivityBar active={activity} sidebar={sidebar} chat={chat} hasProject onSelect={value => { if (activity === value && sidebar) setSidebar(false); else showView(value); }} onHistory={() => void showVersions()} onChat={() => setChat(value => !value)} gitChanges={git.changes} onGear={(x, y) => setGear({ x, y })} />
      {sidebarPanel}
      <div className="flex-1 flex flex-col min-w-64 min-h-0">
        <div className="flex-1 flex flex-col min-h-0" style={{ display: maximized && showBottom ? 'none' : 'flex' }}>
          <EditorTabs markers={markers} onSplit={() => undefined} onQuickOpen={() => setPalette('files')} />
          <Breadcrumbs path={active} />
          <div className="flex flex-1 min-h-0"><div className="flex flex-col flex-1 min-w-0"><Editor projectId={id} /></div></div>
        </div>
        {showBottom && <div className="relative shrink-0 flex flex-col border-t" style={{ height: maximized ? undefined : panelHeight, flex: maximized ? '1 1 0' : undefined, minHeight: 0, background: 'var(--vs-panel)', borderColor: 'var(--vs-border)' }}>
          {!maximized && <Sash orientation="horizontal" label="Redimensionar painel inferior" invert value={panelHeight} min={120} max={Math.max(240, window.innerHeight - 200)} onChange={setPanelHeight} onCommit={value => patchLayout({ panelHeight: value })} />}
          <div className="h-[35px] shrink-0 flex items-center justify-between px-3" role="tablist" aria-label="Painel">
            <div className="flex h-full">{([['problems', 'Problemas', markers.length], ['terminal', 'Terminal', 0]] as const).map(([name, label, count]) => <button key={name} role="tab" aria-selected={bottom === name} className="relative px-2.5 text-[11px] uppercase tracking-wide flex items-center gap-1.5" style={{ color: bottom === name ? 'var(--vs-fg-strong)' : 'var(--vs-fg-muted)', borderBottom: bottom === name ? '1px solid var(--vs-fg-strong)' : '1px solid transparent' }} onClick={() => setBottom(name)}>{label}{count > 0 && <span className="badge">{count}</span>}</button>)}</div>
            <div className="flex"><button className="icon-btn" aria-label={maximized ? 'Restaurar painel' : 'Maximizar painel'} onClick={() => setMaximized(value => !value)}>{maximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}</button><button className="icon-btn" aria-label="Fechar painel" onClick={() => { setBottom(null); setMaximized(false); }}><X size={16} /></button></div>
          </div>
          <div className="flex-1 min-h-0 relative"><Suspense fallback={null}>
            <div className="absolute inset-0" style={{ display: bottom === 'terminal' ? 'block' : 'none' }}>{terminalOpened && <TerminalPanel key={id} projectId={id} />}</div>
            {bottom === 'problems' && <div className="absolute inset-0"><ProblemsPanel projectId={id} /></div>}
          </Suspense></div>
        </div>}
      </div>
      {preview && <div className={`relative shrink-0 min-h-0 ${sidebarRight ? 'border-r' : 'border-l'}`} style={{ width: previewWidth, borderColor: 'var(--vs-border)' }}>
        <Sash orientation="vertical" invert={!sidebarRight} edge={sidebarRight ? 'end' : 'start'} label="Redimensionar visualização" value={previewWidth} min={280} max={1000} onChange={setPreviewWidth} onCommit={value => patchLayout({ previewWidth: value })} />
        <Suspense fallback={null}><FolderPreview projectId={id} target={previewTarget} reloadKey={reloadKey} running={running} onUrl={url => { setPreviewTarget({ kind: 'url', url }); setReloadKey(value => value + 1); }} /></Suspense></div>}
      {chat && <div className={`relative shrink-0 min-h-0 ${sidebarRight ? 'border-r' : 'border-l'}`} style={{ width: chatWidth, borderColor: 'var(--vs-border)' }}>
        <Sash orientation="vertical" invert={!sidebarRight} edge={sidebarRight ? 'end' : 'start'} label="Redimensionar assistente" value={chatWidth} min={280} max={700} onChange={setChatWidth} onCommit={value => patchLayout({ chatWidth: value })} />
        <Suspense fallback={<p className="p-5 text-sm text-vs-dim">Carregando assistente…</p>}><ChatPanel key={id} session={session} modes={['ask', 'plan', 'edit']} apply={applyFiles} /></Suspense></div>}
    </div>
    <StatusBar status={status} busy={busy} active={active} git={git} markers={markers} tabSize={tabSize} onSave={() => void flush()} onProblems={() => setBottom('problems')} onGit={() => showView('git')} />
    {palette && <Suspense fallback={null}><CommandPalette title={palette === 'files' ? 'Abrir arquivo…' : palette === 'versions' ? 'Restaurar versão anterior deste arquivo…' : 'Executar comando…'} close={() => setPalette(null)} items={palette === 'files' ? [] : palette === 'versions' ? versionItems : commands}
      search={palette === 'files' ? async query => (await fsFind(id, query)).paths.map(path => ({ label: path, action: () => void open(path) })) : undefined} /></Suspense>}
    {gear && <ContextMenu x={gear.x} y={gear.y} close={() => setGear(null)} items={[
      { label: 'Paleta de comandos…', shortcut: 'Ctrl+Shift+P', action: () => setPalette('commands') }, { separator: true },
      { label: 'Configurações', shortcut: 'Ctrl+,', action: () => useUi.getState().set({ settings: true, settingsTab: 'appearance' }) },
      { label: 'Atalhos de teclado', action: () => useUi.getState().set({ settings: true, settingsTab: 'keys' }) },
      { label: 'Tema de cores', submenu: themeNames.map(name => ({ label: themes[name].label, checked: usePreferences.getState().theme === name, action: () => usePreferences.getState().update({ theme: name }) })) },
    ]} />}
  </div>;
}
