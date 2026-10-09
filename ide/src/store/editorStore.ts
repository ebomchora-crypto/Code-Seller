import { create } from 'zustand';
export interface FileNode { id: string; name: string; type: 'file' | 'folder'; content?: string; children?: FileNode[]; parentId?: string | null; heavy?: boolean; kind?: 'text' | 'image' | 'binary' | 'large'; size?: number }
export function fileTree(files: Record<string, string>): FileNode[] {
  const root: FileNode[] = [];
  for (const [path, content] of Object.entries(files).sort(([a], [b]) => a.localeCompare(b))) {
    const parts = path.slice(1).split('/'); let nodes = root; let prefix = '';
    parts.forEach((part, index) => {
      prefix += `/${part}`;
      if (index === parts.length - 1) nodes.push({ id: path, name: part, type: 'file', content });
      else {
        let folder = nodes.find(node => node.id === prefix && node.type === 'folder');
        if (!folder) { folder = { id: prefix, name: part, type: 'folder', children: [] }; nodes.push(folder); }
        nodes = folder.children!;
      }
    });
  }
  return root;
}
export function flattenFiles(nodes: FileNode[]): Record<string, string> {
  return Object.assign({}, ...nodes.map(node => node.type === 'folder' ? flattenFiles(node.children || []) : { [node.id]: node.content ?? '' }));
}
function findFile(nodes: FileNode[], id: string): FileNode | undefined {
  for (const node of nodes) { if (node.id === id) return node; const child = findFile(node.children || [], id); if (child) return child; }
}
interface EditorState {
  /** Pasta aberta do computador: a árvore e os arquivos são carregados sob demanda. */
  lazy: boolean; lazyOpener: ((path: string) => void) | null;
  setLazyRoot: (projectId: string, nodes: FileNode[], opener: (path: string) => void) => void;
  setChildren: (path: string, nodes: FileNode[]) => void; openLoaded: (file: FileNode) => void; replaceOpen: (id: string, content: string) => void;
  locked: boolean;
  projectId: string | null;
  files: FileNode[]; openFiles: FileNode[]; activeFileId: string | null;
  setFiles: (files: FileNode[], projectId?: string | null) => void; syncFiles: (files: Record<string, string>, projectId?: string) => void;
  openFile: (file: FileNode, projectId?: string) => void; closeFile: (id: string) => void;
  setActiveFile: (id: string) => void; updateFileContent: (id: string, content: string, projectId?: string) => void;
}
function mergeChildren(previous: FileNode[] | undefined, next: FileNode[]): FileNode[] {
  const old = new Map((previous ?? []).map(node => [node.id, node]));
  return next.map(node => { const before = old.get(node.id); return before && before.type === node.type && node.type === 'folder' ? { ...node, children: before.children } : node; });
}
function withChildren(nodes: FileNode[], path: string, children: FileNode[]): FileNode[] {
  return nodes.map(node => node.id === path ? { ...node, children: mergeChildren(node.children, children) } : node.children && path.startsWith(`${node.id}/`) ? { ...node, children: withChildren(node.children, path, children) } : node);
}
export const useEditorStore = create<EditorState>((set, get) => ({
  lazy: false, lazyOpener: null,
  setLazyRoot: (projectId, nodes, opener) => set({ lazy: true, lazyOpener: opener, projectId, files: nodes, openFiles: [], activeFileId: null, locked: false }),
  setChildren: (path, nodes) => set(state => path === '/' ? { files: mergeChildren(state.files, nodes) } : { files: withChildren(state.files, path, nodes) }),
  openLoaded: file => set(state => ({ openFiles: state.openFiles.some(item => item.id === file.id) ? state.openFiles.map(item => item.id === file.id ? { ...item, ...file } : item) : [...state.openFiles, file], activeFileId: file.id })),
  replaceOpen: (id, content) => set(state => ({ openFiles: state.openFiles.map(item => item.id === id ? { ...item, content } : item) })),
  locked: false,
  projectId: null,
  files: [], openFiles: [], activeFileId: null,
  setFiles: (files, projectId = null) => set({ files, projectId, locked: false, openFiles: [], activeFileId: null, lazy: false, lazyOpener: null }),
  syncFiles: (files, projectId) => {
    if (projectId !== undefined && get().projectId !== projectId) return;
    const tree = fileTree(files);
    const openFiles = get().openFiles.map(file => findFile(tree, file.id)).filter((file): file is FileNode => Boolean(file));
    const activeFileId = openFiles.some(file => file.id === get().activeFileId) ? get().activeFileId : openFiles.at(-1)?.id ?? null;
    set({ files: tree, openFiles, activeFileId });
  },
  openFile: (file, projectId) => {
    if (projectId !== undefined && get().projectId !== projectId) return;
    if (get().lazy) { const known = get().openFiles.some(item => item.id === file.id); if (known) set({ activeFileId: file.id }); else get().lazyOpener?.(file.id); return; }
    const current = findFile(get().files, file.id);
    if (!current || current.type !== 'file') return;
    set({ openFiles: get().openFiles.some(item => item.id === file.id) ? get().openFiles : [...get().openFiles, current], activeFileId: file.id });
  },
  closeFile: id => {
    const openFiles = get().openFiles.filter(file => file.id !== id);
    set({ openFiles, activeFileId: get().activeFileId === id ? openFiles.at(-1)?.id ?? null : get().activeFileId });
  },
  setActiveFile: id => { if (get().openFiles.some(file => file.id === id)) set({ activeFileId: id }); },
  updateFileContent: (id, content, projectId) => {
    if (projectId !== undefined && get().projectId !== projectId) return;
    if (get().locked) return;
    if (get().lazy) { if (get().openFiles.some(item => item.id === id && item.content !== content)) get().replaceOpen(id, content); return; }
    const files = flattenFiles(get().files);
    if (files[id] === undefined || files[id] === content) return;
    get().syncFiles({ ...files, [id]: content });
  },
}));
