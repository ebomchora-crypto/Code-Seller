import { beforeEach, expect, test } from 'vitest';
import { useEditorStore } from '../src/store/editorStore';
beforeEach(() => useEditorStore.setState({ files: [], openFiles: [], activeFileId: null }));
test('switching project files clears previous project tabs', () => {
  const store = useEditorStore.getState();
  store.setFiles([{ id: '/a.ts', name: 'a.ts', type: 'file', content: 'A' }]);
  store.openFile(useEditorStore.getState().files[0]);
  store.setFiles([{ id: '/b.ts', name: 'b.ts', type: 'file', content: 'B' }]);
  expect(useEditorStore.getState().openFiles).toEqual([]);
  expect(useEditorStore.getState().activeFileId).toBeNull();
});
test('closing and reopening a tab keeps the latest code', () => {
  const store = useEditorStore.getState();
  store.setFiles([{ id: '/a.ts', name: 'a.ts', type: 'file', content: 'original' }]);
  const oldFile = useEditorStore.getState().files[0];
  store.openFile(oldFile);
  store.updateFileContent('/a.ts', 'edited');
  store.closeFile('/a.ts');
  store.openFile(oldFile);
  expect(useEditorStore.getState().openFiles[0].content).toBe('edited');
});
test('late events from a previous project cannot overwrite the currently open project', () => {
  const store = useEditorStore.getState();
  store.setFiles([{ id: '/App.tsx', name: 'App.tsx', type: 'file', content: 'Projeto A' }], 'a');
  store.setFiles([{ id: '/App.tsx', name: 'App.tsx', type: 'file', content: 'Projeto B' }], 'b');
  store.syncFiles({ '/App.tsx': 'resposta atrasada de A' }, 'a');
  store.updateFileContent('/App.tsx', 'evento atrasado de A', 'a');
  expect(useEditorStore.getState().files[0].content).toBe('Projeto B');
});
