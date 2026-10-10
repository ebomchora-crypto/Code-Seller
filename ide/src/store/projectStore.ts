import { create } from 'zustand';
import { api, Project, ProjectDetail, Template } from '../lib/api';
export type { Project } from '../lib/api';
interface ProjectState {
  projects: Project[]; loading: boolean; error: string | null; deleted: boolean;
  fetchProjects: (deleted?: boolean) => Promise<void>;
  createProject: (name: string, description: string, template: Template, files?: Record<string, string>, location?: string) => Promise<ProjectDetail>;
  action: (id: string, action: 'delete' | 'recover' | 'duplicate') => Promise<void>;
  rename: (project: Project, name: string) => Promise<void>;
}
export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [], loading: false, error: null, deleted: false,
  fetchProjects: async (deleted = get().deleted) => {
    set({ loading: true, error: null, deleted });
    try { const projects = await api<Project[]>(`/projects?deleted=${deleted}`); set({ projects: Array.isArray(projects) ? projects : [] }); }
    catch (error) { set({ error: (error as Error).message }); }
    finally { set({ loading: false }); }
  },
  createProject: async (name, description, template, files, location) => {
    const project = await api<ProjectDetail>('/projects', 'POST', { name, description, template, files, location });
    await get().fetchProjects(); return project;
  },
  action: async (id, action) => {
    await api(`/projects/${id}${action === 'delete' ? '' : `/${action}`}`, action === 'delete' ? 'DELETE' : 'POST', action === 'delete' ? undefined : {});
    await get().fetchProjects();
  },
  rename: async (project, name) => {
    await api(`/projects/${project.id}`, 'PUT', { revision: project.revision, name }); await get().fetchProjects();
  },
}));
