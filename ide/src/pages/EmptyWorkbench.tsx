import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Laptop, XCircle, AlertTriangle } from 'lucide-react';
import { TitleBar } from '../components/TitleBar';
import { ActivityBar } from '../components/ActivityBar';
import { WelcomeExplorer } from '../components/WelcomeExplorer';
import { ContextMenu } from '../components/ContextMenu';
import { Watermark } from '../components/Editor';
import { CloudHome } from '../components/CloudHome';
import { useIsMobile } from '../lib/useIsMobile';
import { Settings as SettingsIcon } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { buildMenus } from '../lib/buildMenus';
import { pickFolder, openByPath, importCopy, pickZip } from '../lib/workspaceActions';
import { themes, themeNames } from '../lib/themes';
import { usePreferences } from '../lib/preferences';
import { useUi } from '../lib/ui';
import { cloud } from '../lib/mode';

// Tela inicial = o próprio editor sem pasta aberta, como o VS Code (sem página de boas-vindas separada).
export default function EmptyWorkbench() {
  const navigate = useNavigate();
  const recents = useProjectStore(state => state.projects);
  const sidebarRight = usePreferences(state => state.sidebarRight);
  const mobile = useIsMobile();
  const [sidebar, setSidebar] = useState(!cloud);
  const [gear, setGear] = useState<{ x: number; y: number } | null>(null);
  const [error, setError] = useState('');
  const open = (work: () => Promise<string | null>) => void work().then(id => { if (id) navigate(`/project/${id}`); }).catch(e => setError((e as Error).message));
  const newProject = () => { if (cloud) location.href = '/code-maker'; else useUi.getState().set({ newProject: true }); };
  const settings = () => useUi.getState().set({ settings: true, settingsTab: 'appearance' });
  const none = () => undefined;
  const menus = buildMenus({
    hasProject: false, active: null, previewable: false, recents: recents.map(project => ({ id: project.id, name: project.name })),
    actions: { newFile: none, newProject, openFolder: () => open(pickFolder), openByPath: () => open(openByPath), importCopy: () => open(importCopy), importZip: () => open(pickZip), openRecent: id => navigate(`/project/${id}`), save: none, closeTab: none, closeFolder: none, exportZip: none, quickOpen: none, commands: settings, view: () => setSidebar(true), problems: none, terminal: none, sidebar: () => setSidebar(value => !value), preview: none, chat: none, runFile: none, history: none, renameFile: none, deleteFile: none },
  });
  if (mobile && cloud) return <div className="flex flex-col overflow-hidden" style={{ height: '100dvh', background: 'var(--vs-editor)', color: 'var(--vs-fg)' }}>
    <header className="h-12 shrink-0 flex items-center gap-2 px-3" style={{ background: 'var(--vs-titlebar)', borderBottom: '1px solid var(--vs-border-soft)' }}><span className="flex-1 font-medium text-[15px]" style={{ color: 'var(--vs-fg-strong)' }}>Code Sellers IDE</span><button className="icon-btn" aria-label="Configurações" onClick={settings}><SettingsIcon size={20} /></button></header>
    <CloudHome />
  </div>;
  return <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--vs-editor)', color: 'var(--vs-fg)' }}>
    <TitleBar projectName="Code Sellers IDE" menus={menus} hasProject={false} sidebar={sidebar} bottom={false} preview={false} chat={false} previewDisabled canBack={false} canForward={false} onBack={() => undefined} onForward={() => undefined} onQuickOpen={newProject}
      onSidebar={() => setSidebar(value => !value)} onBottom={() => undefined} onPreview={() => undefined} onChat={() => undefined} />
    {error && <div role="alert" className="error-banner rounded-none shrink-0 py-1.5 flex justify-between"><span>{error}</span><button className="underline text-xs" onClick={() => setError('')}>Dispensar</button></div>}
    <div className={`flex-1 flex min-h-0 ${sidebarRight ? 'flex-row-reverse' : ''}`}>
      <ActivityBar cloud={cloud} active="files" sidebar={sidebar} chat={false} hasProject={false} onSelect={() => setSidebar(value => !value)} onHistory={() => undefined} onChat={() => undefined} gitChanges={0} onGear={(x, y) => setGear({ x, y })} />
      {sidebar && <div className={`shrink-0 min-h-0 ${sidebarRight ? 'border-l' : 'border-r'}`} style={{ width: 280, background: 'var(--vs-sidebar)', borderColor: 'var(--vs-border-soft)' }}>
        <WelcomeExplorer onNew={newProject} onOpen={() => open(pickFolder)} onPath={() => open(openByPath)} onZip={() => open(pickZip)} onCopy={() => open(importCopy)} onRecent={id => navigate(`/project/${id}`)} /></div>}
      <div className="flex-1 flex flex-col min-w-0">{cloud ? <CloudHome /> : <Watermark />}</div>
    </div>
    <footer className="h-[22px] shrink-0 flex items-center text-xs select-none" style={{ background: 'var(--vs-statusbar)', color: 'var(--vs-statusbar-fg)' }}>
      <span className="flex items-center gap-1 px-2 h-full" style={{ background: 'var(--vs-statusbar-remote)' }}><Laptop size={13} />{cloud ? 'Nuvem' : 'Local'}</span>
      <span className="flex items-center gap-1 px-2"><XCircle size={13} />0<AlertTriangle size={13} className="ml-1" />0</span>
    </footer>
    {gear && <ContextMenu x={gear.x} y={gear.y} close={() => setGear(null)} items={[
      { label: 'Configurações', shortcut: 'Ctrl+,', action: settings }, { label: 'Atalhos de teclado', action: () => useUi.getState().set({ settings: true, settingsTab: 'keys' }) },
      { label: 'Tema de cores', submenu: themeNames.map(name => ({ label: themes[name].label, checked: usePreferences.getState().theme === name, action: () => usePreferences.getState().update({ theme: name }) })) },
    ]} />}
  </div>;
}
