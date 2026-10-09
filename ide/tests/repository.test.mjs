import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

test('local projects survive reload, reject stale saves and recover deleted code', async () => {
  const { createRepository } = await import('../server/repository.mjs');
  const base = resolve('tests/.tmp');
  await mkdir(base, { recursive: true });
  const dir = await mkdtemp(resolve(base, 'repo-'));
  try {
    const repo = createRepository(dir);
    const project = await repo.create({ name: 'Meu projeto', template: 'react' });
    assert.match(project.files['/App.tsx'], /export default/);
    const saved = await repo.update(project.id, { revision: project.revision, files: { ...project.files, '/App.tsx': 'novo código' } });
    assert.equal((await createRepository(dir).get(project.id)).files['/App.tsx'], 'novo código');
    await assert.rejects(repo.update(project.id, { revision: project.revision, name: 'Conflito' }), /outra sessão/);
    const checkpoint = await repo.checkpoint(project.id, 'Antes da IA');
    await repo.update(project.id, { revision: saved.revision, files: { '/App.tsx': 'alterado' } });
    await repo.restore(project.id, checkpoint.id);
    assert.equal((await repo.get(project.id)).files['/App.tsx'], 'novo código');
    await repo.trash(project.id);
    assert.equal((await repo.list()).length, 0);
    assert.equal((await repo.list(true)).length, 1);
    await repo.recover(project.id);
    assert.equal((await repo.get(project.id)).files['/App.tsx'], 'novo código');
    await assert.rejects(repo.get('../outside'), /inválido/);
    await assert.rejects(repo.update(project.id, { revision: (await repo.get(project.id)).revision, files: { '/../secret': 'x' } }), /Caminho/);
    await assert.rejects(repo.update(project.id, { revision: (await repo.get(project.id)).revision, files: { '/src': 'x', '/src/App.tsx': 'y' } }), /arquivo e pasta/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
