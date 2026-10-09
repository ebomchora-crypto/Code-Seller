import { cloud } from './mode';
export type Template = 'react' | 'static' | 'generic' | 'next' | 'node' | 'python' | 'java';
export const previewable = (template: Template) => template === 'react' || template === 'static';
export interface Project {
  id: string; name: string; description: string; template: Template; folderPath?: string;
  created_at: string; updated_at: string; revision: number; deleted_at: string | null;
}
export interface Checkpoint { id: string; label: string; created_at: string; files: Record<string, string> }
export interface ProjectDetail extends Project { files: Record<string, string>; history: Checkpoint[] }
export async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  if (cloud) return (await import('./cloud/api')).cloudApi<T>(path, method, body);
  let response: Response;
  try {
    response = await fetch(`/api${path}`, { method, headers: body === undefined ? {} : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch { throw new Error('Servidor local indisponível. Inicie com npm run dev.'); }
  const data = await response.json().catch(() => null);
  if (!response.ok || data === null) throw new Error(data?.error || 'API local indisponível. Inicie com npm run dev.');
  return data;
}
