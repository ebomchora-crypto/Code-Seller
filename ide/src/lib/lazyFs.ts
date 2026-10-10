import { api } from './api';
import type { FileNode } from '../store/editorStore';

// Pastas abertas do computador: tudo é pedido ao servidor local, arquivo por arquivo.
export type DirEntry = { name: string; type: 'file' | 'folder'; heavy?: boolean };
export type ReadResult = { kind: 'text'; content: string; encoding: 'utf8' | 'latin1'; bom: boolean; size: number; mtime: number } | { kind: 'image' | 'binary' | 'large'; size: number; mtime: number };
const base = (id: string) => `/projects/${id}/fs`;
const q = (value: string) => encodeURIComponent(value);
export const childPath = (parent: string, name: string) => `${parent === '/' ? '' : parent}/${name}`;
export const parentOf = (path: string) => path.slice(0, path.lastIndexOf('/')) || '/';
export const toNodes = (parent: string, entries: DirEntry[]): FileNode[] => entries.map(entry => ({ id: childPath(parent, entry.name), name: entry.name, type: entry.type, heavy: entry.heavy, ...(entry.type === 'folder' ? {} : {}) }));
export const fsList = (id: string, path: string, all = false) => api<{ path: string; entries: DirEntry[]; truncated: boolean }>(`${base(id)}/list?path=${q(path)}${all ? '&all=1' : ''}`);
export const fsRead = (id: string, path: string) => api<ReadResult>(`${base(id)}/file?path=${q(path)}`);
export const fsWrite = (id: string, body: { path: string; content: string; expectedMtime?: number; encoding?: string; bom?: boolean; force?: boolean }) => api<{ mtime: number; size: number }>(`${base(id)}/file`, 'PUT', body);
export const fsOp = (id: string, body: { op: 'create' | 'mkdir' | 'rename' | 'delete'; path: string; to?: string }) => api<{ mtime?: number }>(`${base(id)}/op`, 'POST', body);
export const fsVersions = (id: string, path: string) => api<{ versions: { id: string; time: number; size: number }[] }>(`${base(id)}/versions?path=${q(path)}`);
export const fsRestore = (id: string, path: string, version: string) => api<{ content: string }>(`${base(id)}/restore`, 'POST', { path, version });
export const fsStats = (id: string, paths: string[]) => api<Record<string, { mtime: number; size: number } | null>>(`${base(id)}/stats`, 'POST', { paths });
export const fsFind = (id: string, query: string) => api<{ paths: string[]; indexed: number }>(`${base(id)}/find?q=${q(query)}`);
export const fsSearch = (id: string, query: string, caseSensitive: boolean, all: boolean) => api<{ matches: { path: string; line: number; text: string }[]; scanned: number; truncated: boolean }>(`${base(id)}/search?q=${q(query)}${caseSensitive ? '&cs=1' : ''}${all ? '&all=1' : ''}`);
export const rawUrl = (id: string, path: string) => `/api${base(id)}/raw?path=${q(path)}`;
export const formatSize = (bytes: number) => bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : bytes < 1073741824 ? `${(bytes / 1048576).toFixed(1)} MB` : `${(bytes / 1073741824).toFixed(2)} GB`;
