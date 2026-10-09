import { useEffect, useState } from 'react';
import { cloud } from '../lib/mode';
import { api, ProjectDetail } from '../lib/api';
import { Autosave } from '../lib/autosave';
import { fileTree, flattenFiles, useEditorStore } from '../store/editorStore';

export function useLocalProject(id: string | undefined) {
  const [session, setSession] = useState<Autosave | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, render] = useState(0);
  useEffect(() => {
    const preventLoss = (event: BeforeUnloadEvent) => {
      if (session && session.status !== 'saved') { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('beforeunload', preventLoss);
    return () => window.removeEventListener('beforeunload', preventLoss);
  }, [session]);
  useEffect(() => {
    let alive = true; let unsubscribe = () => {}; let autosave: Autosave | null = null; let polling = false;
    const timer = setInterval(async () => {
      if (!alive || !autosave || polling || autosave.status !== 'saved' || useEditorStore.getState().locked) return;
      polling = true; const revision = autosave.project.revision;
      try {
        const project = await api<ProjectDetail>(`/projects/${id}`);
        if (alive && autosave.status === 'saved' && autosave.project.revision === revision && !useEditorStore.getState().locked && project.revision !== revision) {
          autosave.replace(project); useEditorStore.getState().syncFiles(project.files, project.id);
        }
      } catch { /* A transient polling failure must not replace pending edits. */ }
      finally { polling = false; }
    }, cloud ? 15000 : 2500);
    setSession(null); setError(null);
    useEditorStore.getState().setFiles([], id ?? null);
    if (!id) { clearInterval(timer); return; }
    api<ProjectDetail>(`/projects/${id}`).then(project => {
      if (!alive) return;
      autosave = new Autosave(project);
      autosave.onChange = () => { if (alive) render(count => count + 1); };
      const tree = fileTree(project.files);
      useEditorStore.getState().setFiles(tree, project.id);
      const first = tree.find(file => file.id === '/App.tsx' || file.id === '/index.html') || tree.find(file => file.type === 'file');
      if (first) useEditorStore.getState().openFile(first);
      setSession(autosave);
      unsubscribe = useEditorStore.subscribe((state, previous) => {
        if (state.projectId === project.id && state.files !== previous.files && autosave) {
          const files = flattenFiles(state.files);
          if (JSON.stringify(files) !== JSON.stringify(autosave.files)) autosave.update(files);
        }
      });
    }).catch(error => { if (alive) setError(error.message); });
    return () => { alive = false; clearInterval(timer); unsubscribe(); if (autosave) autosave.onChange = () => {}; };
  }, [id]);
  return { session, error };
}
