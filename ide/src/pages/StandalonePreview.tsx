import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ProjectDetail } from '../lib/api';
import Preview from '../components/Preview';
export default function StandalonePreview() {
  const { id } = useParams();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { let alive = true; api<ProjectDetail>(`/projects/${id}`).then(project => { if (alive) setProject(project); }).catch(error => { if (alive) setError(error.message); }); return () => { alive = false; }; }, [id]);
  return <div className="h-screen flex flex-col"><header className="p-3 text-sm border-b border-vs-border flex justify-between"><span>{project?.name || 'Preview'}</span><Link className="text-vs-link" to={`/project/${id}`}>Abrir editor</Link></header><div className="flex-1 min-h-0">{error ? <p className="error-banner m-5">{error}</p> : project ? <Preview project={project} files={project.files} /> : <p className="p-6 text-vs-dim">Carregando…</p>}</div></div>;
}
