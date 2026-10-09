import { useEffect, useState } from 'react';
import { api } from './api';

export type GitSummary = { initialized: boolean; branch: string; changes: number };
const empty: GitSummary = { initialized: false, branch: '', changes: 0 };
/** Ramo e número de alterações para a barra de status e o ícone do Git (consulta a cada 5s). */
export function useGitSummary(projectId: string) {
  const [summary, setSummary] = useState<GitSummary>(empty);
  useEffect(() => {
    let alive = true;
    const refresh = () => api<{ initialized?: boolean; branch?: string; files?: unknown }>(`/projects/${projectId}/git`).then(data => {
      if (!alive) return;
      setSummary({ initialized: data.initialized === true, branch: typeof data.branch === 'string' ? data.branch : '', changes: Array.isArray(data.files) ? data.files.length : 0 });
    }).catch(() => undefined);
    void refresh();
    const timer = setInterval(refresh, 5000);
    return () => { alive = false; clearInterval(timer); };
  }, [projectId]);
  return summary;
}
