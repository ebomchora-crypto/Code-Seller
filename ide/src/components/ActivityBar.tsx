import { Files, Search, GitBranch, Settings, History, Play, Sparkles } from 'lucide-react';

export type Activity = 'files' | 'search' | 'git' | 'run';
type Props = { noHistory?: boolean; cloud?: boolean; active: Activity; sidebar: boolean; chat: boolean; hasProject: boolean; onSelect: (value: Activity) => void; onHistory: () => void; onChat: () => void; onGear: (x: number, y: number) => void; gitChanges: number };
// Barra de atividades: ícones de 48px, indicador branco no item aberto, engrenagem com menu embaixo.
export function ActivityBar({ noHistory = false, cloud = false, active, sidebar, chat, hasProject, onSelect, onHistory, onChat, onGear, gitChanges }: Props) {
  const color = (on: boolean) => on ? 'var(--vs-activitybar-fg)' : 'var(--vs-activitybar-fg-dim)';
  const button = (key: string, label: string, Icon: typeof Files, on: boolean, onClick: (event: React.MouseEvent<HTMLButtonElement>) => void, badge = 0, disabled = false) =>
    <button key={key} title={label} aria-label={label} aria-pressed={on} disabled={disabled} className="relative w-12 h-12 flex items-center justify-center disabled:opacity-40" style={{ color: color(on) }} onClick={onClick}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.color = 'var(--vs-activitybar-fg)'; }} onMouseLeave={e => { e.currentTarget.style.color = color(on); }}>
      {on && <span className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: 'var(--vs-activitybar-fg)' }} />}
      <Icon size={24} strokeWidth={1.5} />
      {badge > 0 && <span className="absolute right-1.5 bottom-2 min-w-4 h-4 px-1 rounded-full text-[9px] font-semibold leading-4 text-center" style={{ background: 'var(--vs-activitybar-badge)', color: '#fff' }}>{badge > 99 ? '99+' : badge}</span>}
    </button>;
  const view = (name: Activity, label: string, Icon: typeof Files, badge = 0, needsProject = false) => button(name, label, Icon, sidebar && active === name, () => onSelect(name), badge, needsProject && !hasProject);
  return <nav className="w-12 shrink-0 flex flex-col justify-between" style={{ background: 'var(--vs-activitybar)' }} aria-label="Ferramentas">
    <div>{view('files', 'Explorador', Files)}{view('search', 'Buscar no projeto', Search, 0, true)}{!cloud && view('git', 'Git', GitBranch, gitChanges, true)}{!cloud && view('run', 'Executar', Play, 0, true)}{button('chat', 'Assistente de IA', Sparkles, chat, onChat, 0, !hasProject)}</div>
    <div>{button('history', 'Histórico', History, false, onHistory, 0, !hasProject || noHistory)}{button('gear', 'Gerenciar', Settings, false, event => { const rect = event.currentTarget.getBoundingClientRect(); onGear(rect.right, rect.top - 100); })}</div>
  </nav>;
}
