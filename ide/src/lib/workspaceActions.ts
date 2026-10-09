import { api, ProjectDetail } from './api';
import { askConfirm, askInput } from './dialogs';
import { importZip } from './archive';
import { useProjectStore } from '../store/projectStore';

// Ações de "Arquivo" que valem com ou sem projeto aberto. Cada uma devolve o id do projeto aberto (ou null se cancelou).
export async function pickFolder(): Promise<string | null> {
  let project: ProjectDetail | { canceled: true };
  try { project = await api<ProjectDetail | { canceled: true }>('/pick-folder', 'POST', {}); }
  catch { const path = await askInput('Abrir pasta', '', { description: 'Informe o caminho completo da pasta. As edições serão salvas nos arquivos originais.', confirmLabel: 'Abrir' }); if (!path) return null; project = await api<ProjectDetail>('/open-folder', 'POST', { path }); }
  return 'id' in project ? project.id : null;
}
export async function openByPath(): Promise<string | null> {
  const path = await askInput('Abrir por caminho', '', { description: 'Caminho completo da pasta. As edições serão salvas nos arquivos originais.', confirmLabel: 'Abrir' });
  return path ? (await api<ProjectDetail>('/open-folder', 'POST', { path })).id : null;
}
export async function importCopy(): Promise<string | null> {
  const path = await askInput('Importar cópia da pasta', '', { description: 'Será criada uma cópia dos arquivos de texto; dependências, Git e .env não são importados.', confirmLabel: 'Importar' });
  return path ? (await api<ProjectDetail>('/import-folder', 'POST', { path })).id : null;
}
export function pickZip(): Promise<string | null> {
  return new Promise(resolve => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.zip';
    input.onchange = async () => {
      const file = input.files?.[0]; if (!file) return resolve(null);
      try { const files = await importZip(file); resolve((await useProjectStore.getState().createProject(file.name.replace(/\.zip$/i, '').slice(0, 100), 'Importado de ZIP', 'generic', files)).id); } catch (error) { void askConfirm('Não foi possível importar o ZIP', { description: (error as Error).message, confirmLabel: 'OK' }); resolve(null); }
    };
    input.oncancel = () => resolve(null); input.click();
  });
}
