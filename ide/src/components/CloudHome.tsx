import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Terminal, Download, ExternalLink, Globe } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { IDE_DOWNLOAD } from '../lib/mode';

// Início da IDE no site: seus sites do Code Maker como cartões, sem tela de boas-vindas separada.
export function CloudHome() {
  const navigate = useNavigate();
  const { projects, loading, error, fetchProjects } = useProjectStore();
  useEffect(() => { void fetchProjects(false); }, [fetchProjects]);
  return <div className="flex-1 overflow-auto" style={{ background: 'var(--vs-editor)' }}>
    <div className="max-w-4xl mx-auto px-5 py-8 md:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div><h1 className="text-[22px] md:text-[28px] font-light tracking-tight text-vs-strong">Seus sites</h1><p className="text-vs-muted mt-1 text-[14px]">Escolha um site para editar o código. Ctrl+S salva e publica.</p></div>
        <a className="btn-primary" href="/code-maker"><Plus size={16} /> Novo site</a>
      </div>
      {error && <p role="alert" className="error-banner mb-4">{error}</p>}
      {loading && !projects.length ? <p className="text-vs-dim py-8">Carregando seus sites…</p> : projects.length ? <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 list-none p-0 m-0">{projects.map(project => <li key={project.id}>
        <button className="w-full text-left border rounded-md p-4 transition-colors hover:border-[var(--vs-focus)]" style={{ background: 'var(--vs-sidebar)', borderColor: 'var(--vs-border)' }} onClick={() => navigate(`/project/${project.id}`)}>
          <span className="flex items-center gap-2 mb-3"><Terminal size={18} style={{ color: 'var(--vs-link)' }} /><span className="badge !h-[18px]" style={project.published ? { background: '#16825d' } : undefined}>{project.published ? 'No ar' : 'Rascunho'}</span></span>
          <span className="block font-medium text-vs-strong truncate text-[15px]">{project.name}</span>
          <span className="flex items-center gap-1 text-xs text-vs-dim mt-1 truncate"><Globe size={12} className="shrink-0" /><span className="truncate">{project.publicUrl?.replace(/^https?:\/\//, '') || 'sem link'}</span></span>
          <span className="block text-xs text-vs-dim mt-3">Editado em {new Date(project.updated_at).toLocaleDateString('pt-BR')}</span>
        </button></li>)}</ul> : <div className="text-center py-14 border border-dashed rounded-md" style={{ borderColor: 'var(--vs-border)' }}><p className="text-vs-fg">Você ainda não tem sites prontos.</p><p className="text-vs-dim text-sm mt-1">Crie um no Code Maker e depois edite o código aqui.</p><a className="btn-primary mt-4" href="/code-maker"><Plus size={16} /> Criar meu primeiro site</a></div>}
      <div className="flex flex-wrap gap-3 mt-8 text-[13px]">
        <a className="link flex items-center gap-1.5" href={IDE_DOWNLOAD}><Download size={14} /> Baixar a IDE para Windows (terminal e Git)</a>
        <a className="link flex items-center gap-1.5" href="/code-maker"><ExternalLink size={14} /> Voltar ao Code Maker</a>
      </div>
    </div>
  </div>;
}
