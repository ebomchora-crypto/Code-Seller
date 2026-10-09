import { create } from 'zustand';
export interface FileNode { id: string; name: string; type: 'file' | 'folder'; content?: string; children?: FileNode[]; parentId?: string | null }
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
  locked: boolean;
  projectId: string | null;
  files: FileNode[]; openFiles: FileNode[]; activeFileId: string | null;
  setFiles: (files: FileNode[], projectId?: string | null) => void; syncFiles: (files: Record<string, string>, projectId?: string) => void;
  openFile: (file: FileNode, projectId?: string) => void; closeFile: (id: string) => void;
  setActiveFile: (id: string) => void; updateFileContent: (id: string, content: string, projectId?: string) => void;
}
export const useEditorStore = create<EditorState>((set, get) => ({
  locked: false,
  projectId: null,
  files: [], openFiles: [], activeFileId: null,
  setFiles: (files, projectId = null) => set({ files, projectId, locked: false, openFiles: [], activeFileId: null }),
  syncFiles: (files, projectId) => {
    if (projectId !== undefined && get().projectId !== projectId) return;
    const tree = fileTree(files);
    const openFiles = get().openFiles.map(file => findFile(tree, file.id)).filter((file): file is FileNode => Boolean(file));
    const activeFileId = openFiles.some(file => file.id === get().activeFileId) ? get().activeFileId : openFiles.at(-1)?.id ?? null;
    set({ files: tree, openFiles, activeFileId });
  },
  openFile: (file, projectId) => {
    if (projectId !== undefined && get().projectId !== projectId) return;
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
    const files = flattenFiles(get().files);
    if (files[id] === undefined || files[id] === content) return;
    get().syncFiles({ ...files, [id]: content });
  },
}));
