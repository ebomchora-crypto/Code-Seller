import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import EditorPage from '../src/pages/EditorPage';
vi.mock('../src/lib/monaco', () => ({ languageForPath: () => 'typescript', monaco: { Uri: { parse: (path: string) => ({ path }) }, editor: { getModel: () => null, createModel: () => ({}), getModels: () => [] } } }));
vi.mock('@monaco-editor/react', () => ({ default: ({ path, value, onChange }: { path: string; value: string; onChange: (value: string) => void }) => <textarea aria-label={path} value={value} onChange={event => onChange(event.target.value)} /> }));
// Native terminal transport is covered by the real PTY/WebSocket tests; jsdom has no canvas renderer.
vi.mock('@xterm/xterm', () => ({ Terminal: class {} }));
afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllGlobals(); });
test('closing the editor is blocked while a real save request is pending', async () => {
  localStorage.setItem('cm-layout', JSON.stringify({ preview: false, chat: false }));
  const id = '22222222-2222-2222-2222-222222222222';
  const project = { id, name: 'Pending save', template: 'generic', revision: 1, history: [], files: { '/test.ts': 'original' } };
  let complete: (() => void) | undefined;
  vi.stubGlobal('fetch', async (_url: string, options?: RequestInit) => {
    if (options?.method === 'PUT') await new Promise<void>(done => { complete = done; });
    return new Response(JSON.stringify(project), { headers: { 'Content-Type': 'application/json' } });
  });
  render(<MemoryRouter initialEntries={[`/project/${id}`]}><Routes><Route path="/project/:id" element={<EditorPage />} /></Routes></MemoryRouter>);
  const editor = await screen.findByRole('textbox', { name: `file:///projects/${id}/test.ts` });
  expect(window.dispatchEvent(new Event('beforeunload', { cancelable: true }))).toBe(true);
  fireEvent.change(editor, { target: { value: 'changed' } });
  await waitFor(() => expect(complete).toBeTypeOf('function'));
  expect(window.dispatchEvent(new Event('beforeunload', { cancelable: true }))).toBe(false);
  complete?.();
  await waitFor(() => expect(window.dispatchEvent(new Event('beforeunload', { cancelable: true }))).toBe(true));
});
test('quick open selects the requested file and edits are saved through the project API', async () => {
  localStorage.setItem('cm-layout', JSON.stringify({ preview: false, chat: false }));
  const id = '11111111-1111-1111-1111-111111111111';
  let project = { id, name: 'IDE test', description: '', template: 'react', revision: 1, created_at: '', updated_at: '', deleted_at: null, history: [], files: { '/App.tsx': 'app content', '/utils.ts': 'original helper' } };
  vi.stubGlobal('fetch', async (_url: string, options?: RequestInit) => { if (options?.method === 'PUT') { const input = JSON.parse(options.body as string); project = { ...project, revision: project.revision + 1, files: input.files }; } return new Response(JSON.stringify(project), { headers: { 'Content-Type': 'application/json' } }); });
  render(<MemoryRouter initialEntries={[`/project/${id}`]}><Routes><Route path="/project/:id" element={<EditorPage />} /></Routes></MemoryRouter>);
  await screen.findByRole('textbox', { name: `file:///projects/${id}/App.tsx` });
  fireEvent.keyDown(window, { key: 'p', ctrlKey: true });
  const search = await screen.findByRole('textbox', { name: 'Abrir arquivo…' }); fireEvent.change(search, { target: { value: 'utils' } }); fireEvent.keyDown(search, { key: 'Enter' });
  const editor = await screen.findByRole('textbox', { name: `file:///projects/${id}/utils.ts` }); fireEvent.change(editor, { target: { value: 'updated helper' } });
  await waitFor(() => expect(project.files['/utils.ts']).toBe('updated helper'));
  expect(project.files['/App.tsx']).toBe('app content');
  expect(screen.getByLabelText('Tipo do arquivo').textContent).toBe('TypeScript');
  expect(await screen.findByRole('button', { name: 'Confiar neste projeto e abrir terminal' })).toBeTruthy();
});
