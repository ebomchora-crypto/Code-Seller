import { useEffect } from 'react';
import { FolderOpen, FilePlus2, Terminal, FileArchive, FolderInput, Clock } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { cloud, IDE_DOWNLOAD } from '../lib/mode';

type Props = { onNew: () => void; onOpen: () => void; onPath: () => void; onZip: () => void; onCopy: () => void; onRecent: (id: string) => void };
// Explorador quando nenhuma pasta está aberta (como o do VS Code): ações diretas e projetos recentes.
export function WelcomeExplorer({ onNew, onOpen, onPath, onZip, onCopy, onRecent }: Props) {
  const { projects, fetchProjects } = useProjectStore();
  useEffect(() => { void fetchProjects(false); }, [fetchProjects]);
  const action = (Icon: typeof FolderOpen, label: string, run: () => void, primary = false) => <button className={`${primary ? 'btn-primary' : 'btn-secondary'} w-full !justify-start`} onClick={run}><Icon size={15} />{label}</button>;
  return <aside className="h-full w-full overflow-auto bg-vs-sidebar text-[13px]" aria-label="Explorador de arquivos">
    <div className="h-[35px] flex items-center pl-5"><span className="panel-title">Explorador</span></div>
    <div className="px-5 pb-4 space-y-2"><p className="text-vs-muted mb-3">{cloud ? 'Escolha um dos seus sites para editar.' : 'Você ainda não abriu uma pasta.'}</p>
      {cloud ? <>{action(FilePlus2, 'Novo site no Code Maker', onNew, true)}{action(FileArchive, 'Baixar a IDE para Windows', () => { location.href = IDE_DOWNLOAD; })}</> : <>{action(FilePlus2, 'Novo projeto', onNew, true)}{action(FolderOpen, 'Abrir pasta', onOpen)}{action(Terminal, 'Abrir por caminho', onPath)}{action(FolderInput, 'Importar cópia de pasta', onCopy)}{action(FileArchive, 'Importar ZIP', onZip)}</>}</div>
    {projects.length > 0 && <><div className="px-5 h-[22px] flex items-center gap-1.5 text-[11px] uppercase font-bold"><Clock size={12} />{cloud ? 'Meus sites' : 'Recentes'}</div>
      {projects.slice(0, 40).map(project => <button key={project.id} className="list-row pl-5 pr-2" onClick={() => onRecent(project.id)} title={project.description}><FolderOpen size={15} style={{ color: '#c09553' }} className="shrink-0" /><span className="truncate">{project.name}</span></button>)}</>}
  </aside>;
}
