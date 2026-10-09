import { GitBranch, XCircle, AlertTriangle, Check, Loader2, Laptop, Bell } from 'lucide-react';
import { fileTypeName } from '../lib/fileType';
import { languageForPath } from '../lib/monaco';
import { useStatus } from '../store/statusStore';
import type { GitSummary } from '../lib/useGitSummary';
import type { Marker } from '../lib/markers';
import { cloud } from '../lib/mode';

type Props = { publish?: { published: boolean; url?: string }; status: 'saved' | 'saving' | 'error' | string; busy: boolean; active: string | null; git: GitSummary; markers: Marker[]; tabSize: number; onProblems: () => void; onGit: () => void; onSave: () => void };
// Barra de status como a do VS Code; fica vermelha quando a gravação no disco falha.
export function StatusBar({ publish, status, busy, active, git, markers, tabSize, onProblems, onGit, onSave }: Props) {
  const { line, column, selected } = useStatus();
  const errors = markers.filter(item => item.severity === 'error').length;
  const warnings = markers.filter(item => item.severity === 'warning').length;
  const item = 'flex items-center gap-1 px-2 h-full hover:bg-[var(--vs-statusbar-hover)] whitespace-nowrap';
  return <footer className="h-[22px] shrink-0 flex items-center justify-between text-xs select-none" style={{ background: status === 'error' ? 'var(--vs-error-border)' : 'var(--vs-statusbar)', color: 'var(--vs-statusbar-fg)', borderTop: '1px solid var(--vs-border-soft)' }}>
    <div className="flex h-full min-w-0">
      <span className="flex items-center gap-1 px-2 h-full" style={{ background: 'var(--vs-statusbar-remote)' }} title={cloud ? 'Site salvo na sua conta do Code Sellers' : 'Projeto local na sua máquina'}><Laptop size={13} />{cloud ? 'Nuvem' : 'Local'}</span>
      {git.initialized && <button className={item} title={`Ramo ${git.branch}`} onClick={onGit}><GitBranch size={13} />{git.branch || 'main'}{git.changes > 0 && <span className="opacity-90">*{git.changes}</span>}</button>}
      <button className={item} title="Mostrar problemas" onClick={onProblems}><XCircle size={13} />{errors}<AlertTriangle size={13} className="ml-1" />{warnings}</button>
      <button className={item} title={cloud ? 'Salvar e publicar o site (Ctrl+S)' : 'Salvar agora (Ctrl+S)'} onClick={onSave}>
        {status === 'saving' || busy ? <Loader2 size={13} className="animate-spin" /> : status === 'error' ? <XCircle size={13} /> : <Check size={13} />}
        <span>{status === 'saving' ? (cloud ? 'Salvando rascunho…' : 'Salvando no disco…') : status === 'error' ? 'Falha ao salvar' : busy ? (cloud ? 'Publicando…' : 'Processando…') : cloud ? (publish?.published ? 'Publicado' : 'Rascunho salvo · Ctrl+S publica') : 'Salvo no disco'}</span>
      </button>
      {cloud && publish?.url && <a className={item} href={publish.url} target="_blank" rel="noopener noreferrer" title="Abrir o site publicado">{publish.url.replace(/^https?:\/\//, '')}</a>}
    </div>
    <div className="flex h-full min-w-0">
      {active && <span className={item} title="Linha e coluna">Ln {line}, Col {column}{selected > 0 ? ` (${selected} selecionados)` : ''}</span>}
      {active && <span className={item}>Espaços: {tabSize}</span>}
      <span className={item}>UTF-8</span>
      <span className={item}>LF</span>
      <span aria-label="Tipo do arquivo" className={item}>{active ? fileTypeName(languageForPath(active)) : 'Sem arquivo ativo'}</span>
      <span className="flex items-center px-2 h-full" aria-hidden><Bell size={13} /></span>
    </div>
  </footer>;
}
