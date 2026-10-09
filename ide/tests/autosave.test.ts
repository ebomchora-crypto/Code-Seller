import { expect, test } from 'vitest';
import { Autosave } from '../src/lib/autosave';
import type { ProjectDetail } from '../src/lib/api';
const project: ProjectDetail = { id: 'local', name: 'Projeto', template: 'react', files: { '/App.tsx': 'original' }, history: [], revision: 1, description: '', created_at: '', updated_at: '', deleted_at: null };
test('autosave serializes rapid edits and uses the server revision for the next write', async () => {
  const calls: { revision: number; files: Record<string, string> }[] = [];
  let release!: () => void;
  const gate = new Promise<void>(done => { release = done; });
  const save = new Autosave(project, async input => {
    calls.push(input);
    if (calls.length === 1) await gate;
    return { ...project, files: input.files, revision: input.revision + 1 };
  });
  save.update({ '/App.tsx': 'primeira edição' });
  save.update({ '/App.tsx': 'última edição' });
  release();
  await save.flush();
  expect(calls.map(call => call.revision)).toEqual([1, 2]);
  expect(save.project.files['/App.tsx']).toBe('última edição');
  expect(save.status).toBe('saved');
});
test('a failed disk save keeps edited files available for retry and export', async () => {
  let fail = true;
  const save = new Autosave(project, async input => {
    if (fail) throw new Error('Disco cheio');
    return { ...project, files: input.files, revision: 2 };
  });
  save.update({ '/App.tsx': 'não perder' });
  await expect(save.flush()).rejects.toThrow('Disco cheio');
  expect(save.files['/App.tsx']).toBe('não perder');
  expect(save.status).toBe('error');
  fail = false;
  await save.flush();
  expect(save.project.files['/App.tsx']).toBe('não perder');
});
