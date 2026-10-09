import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditorStore, type FileNode } from '../store/editorStore';
import type { ProjectDetail } from '../lib/api';
import { fsList, fsRead, fsStats, fsWrite, toNodes } from '../lib/lazyFs';
import { askConfirm } from '../lib/dialogs';

type Disk = { content: string; mtime: number; encoding: 'utf8' | 'latin1'; bom: boolean };
const isText = (file: FileNode) => !file.kind || file.kind === 'text';

/**
 * Pasta aberta do computador, sem limite de tamanho: a árvore carrega por pasta, cada arquivo é lido
 * quando você abre e gravado sozinho (só ele) logo depois de editar. Mudanças feitas por fora (Git,
 * build, outro editor) são percebidas a cada poucos segundos.
 */
export function useLazyProject(project: ProjectDetail) {
  const id = project.id;
  const disk = useRef(new Map<string, Disk>());
  const conflicts = useRef(new Set<string>());
  const notified = useRef(new Set<string>());
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const running = useRef<Promise<void> | null>(null);
  const [status, setStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [error, setError] = useState<string | null>(null);
  const [rootReady, setRootReady] = useState(false);

  const loadDir = useCallback(async (path: string) => {
    try { const result = await fsList(id, path); useEditorStore.getState().setChildren(path, toNodes(path, result.entries)); if (path === '/') setRootReady(true); }
    catch (e) { setError((e as Error).message); }
  }, [id]);

  const open = useCallback(async (path: string) => {
    const store = useEditorStore.getState();
    if (store.openFiles.some(file => file.id === path)) { store.setActiveFile(path); return; }
    try {
      const result = await fsRead(id, path); const name = path.split('/').at(-1) || path;
      if (result.kind === 'text') { disk.current.set(path, { content: result.content, mtime: result.mtime, encoding: result.encoding, bom: result.bom }); store.openLoaded({ id: path, name, type: 'file', content: result.content, kind: 'text', size: result.size }); }
      else store.openLoaded({ id: path, name, type: 'file', kind: result.kind, size: result.size });
    } catch (e) { setError((e as Error).message); }
  }, [id]);

  const dirty = () => useEditorStore.getState().openFiles.filter(file => isText(file) && disk.current.has(file.id) && (file.content ?? '') !== disk.current.get(file.id)!.content);

  const saveAll = useCallback(async () => {
    for (let guard = 0; guard < 50; guard++) {
      const pending = dirty().filter(file => !conflicts.current.has(`${file.id}\n${file.content}`));
      if (!pending.length) break;
      setStatus('saving');
      for (const file of pending) {
        const known = disk.current.get(file.id)!; const content = file.content ?? '';
        const send = (force: boolean) => fsWrite(id, { path: file.id, content, expectedMtime: known.mtime, encoding: known.encoding, bom: known.bom, force });
        try {
          let result;
          try { result = await send(false); }
          catch (e) {
            if (!/alterado fora da IDE/.test((e as Error).message)) throw e;
            const overwrite = await askConfirm(`${file.name} mudou no disco`, { description: 'Outro programa alterou este arquivo depois que você o abriu. Sobrescrever com a sua versão?', confirmLabel: 'Sobrescrever', danger: true });
            if (!overwrite) { conflicts.current.add(`${file.id}\n${file.content}`); continue; }
            result = await send(true);
          }
          disk.current.set(file.id, { ...known, content, mtime: result.mtime });
        } catch (e) { setStatus('error'); setError(`Não foi possível salvar ${file.name}: ${(e as Error).message}`); return; }
      }
    }
    setStatus('saved');
  }, [id]);

  const run = useCallback(() => { const next = (running.current ?? Promise.resolve()).then(saveAll).finally(() => { if (running.current === next) running.current = null; }); running.current = next; return next; }, [saveAll]);
  const flush = useCallback(async () => { clearTimeout(timer.current); await run(); }, [run]);

  // Salva sozinho 600 ms depois da última edição.
  useEffect(() => useEditorStore.subscribe((state, previous) => {
    if (state.openFiles === previous.openFiles || !state.lazy) return;
    if (dirty().length) { setError(current => current && current.startsWith('Não foi possível salvar') ? null : current); clearTimeout(timer.current); timer.current = setTimeout(() => void run(), 600); }
  }), [run]);

  // Árvore inicial e volta ao foco (atualiza as pastas já abertas).
  useEffect(() => {
    useEditorStore.getState().setLazyRoot(id, [], path => void open(path));
    void loadDir('/');
    const loadedDirs = () => { const out: string[] = ['/']; const walk = (nodes: FileNode[]) => nodes.forEach(node => { if (node.type === 'folder' && node.children) { out.push(node.id); walk(node.children); } }); walk(useEditorStore.getState().files); return out.slice(0, 40); };
    const refocus = () => { for (const path of loadedDirs()) void loadDir(path); };
    window.addEventListener('focus', refocus);
    return () => { window.removeEventListener('focus', refocus); clearTimeout(timer.current); useEditorStore.getState().setFiles([], null); };
  }, [id, open, loadDir]);

  // Mudanças feitas fora da IDE.
  useEffect(() => {
    const poll = setInterval(async () => {
      if (running.current || document.hidden) return;
      const files = useEditorStore.getState().openFiles.filter(file => isText(file) && disk.current.has(file.id)).slice(0, 60);
      if (!files.length) return;
      try {
        const stats = await fsStats(id, files.map(file => file.id));
        for (const file of files) {
          const known = disk.current.get(file.id); const stat = stats[file.id]; if (!known) continue;
          if (stat === null) { if (!notified.current.has(`${file.id}:gone`)) { notified.current.add(`${file.id}:gone`); setError(`${file.name} foi apagado fora da IDE. Salve para recriar o arquivo.`); } continue; }
          if (Math.abs(stat.mtime - known.mtime) <= 2) continue;
          const current = useEditorStore.getState().openFiles.find(item => item.id === file.id);
          if ((current?.content ?? '') === known.content) {
            const fresh = await fsRead(id, file.id);
            if (fresh.kind === 'text') { disk.current.set(file.id, { content: fresh.content, mtime: fresh.mtime, encoding: fresh.encoding, bom: fresh.bom }); useEditorStore.getState().replaceOpen(file.id, fresh.content); }
          } else if (!notified.current.has(`${file.id}:${stat.mtime}`)) { notified.current.add(`${file.id}:${stat.mtime}`); setError(`${file.name} mudou no disco enquanto você editava. Ao salvar, a IDE pergunta se deve sobrescrever.`); }
        }
      } catch { /* servidor ocupado: tenta de novo no próximo ciclo */ }
    }, 3000);
    return () => clearInterval(poll);
  }, [id]);

  useEffect(() => {
    const leaving = (event: BeforeUnloadEvent) => { if (dirty().length || running.current) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', leaving); return () => window.removeEventListener('beforeunload', leaving);
  }, []);

  /** Grava um arquivo qualquer (usado pelo assistente de IA) e atualiza o editor se ele estiver aberto. */
  const writeFile = useCallback(async (path: string, content: string) => {
    const known = disk.current.get(path);
    const result = await fsWrite(id, { path, content, encoding: known?.encoding, bom: known?.bom, force: true });
    if (useEditorStore.getState().openFiles.some(file => file.id === path)) { disk.current.set(path, { content, mtime: result.mtime, encoding: known?.encoding ?? 'utf8', bom: known?.bom ?? false }); useEditorStore.getState().replaceOpen(path, content); }
  }, [id]);

  return { status, error, setError, flush, open, loadDir, rootReady, writeFile, disk: disk.current };
}
