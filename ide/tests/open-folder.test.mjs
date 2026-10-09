import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile, rm, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createRepository } from '../server/repository.mjs';
test('opening arbitrary and empty folders edits original files and preserves structure across restart', async () => {
  await mkdir('tests/.tmp', { recursive: true }); const root = await mkdtemp(resolve('tests/.tmp/open-'));
  try {
    const folder = join(root, 'python-project'); await mkdir(join(folder, 'nested'), { recursive: true }); await writeFile(join(folder, 'nested', 'main.py'), 'print("hello")');
    const repo = createRepository(join(root, 'metadata')); const project = await repo.openFolder({ path: folder }); assert.equal(project.template, 'generic'); assert.equal(repo.workspace(project.id), folder); assert.equal(project.files['/App.tsx'], undefined);
    const edited = await repo.update(project.id, { revision: project.revision, files: { ...project.files, '/nested/main.py': 'print("edited")' } }); assert.equal(await readFile(join(folder, 'nested', 'main.py'), 'utf8'), 'print("edited")');
    const restarted = createRepository(join(root, 'metadata')); assert.equal((await restarted.get(project.id)).revision, edited.revision); assert.equal(restarted.workspace(project.id), folder); assert.equal((await restarted.openFolder({ path: folder })).id, project.id);
    await repo.trash(project.id); assert.equal(await readFile(join(folder, 'nested', 'main.py'), 'utf8'), 'print("edited")'); await repo.recover(project.id);
    const empty = join(root, 'empty'); await mkdir(empty); const blank = await repo.openFolder({ path: empty }); assert.deepEqual(blank.files, {}); assert.deepEqual(await readdir(empty), []);
    await rm(folder, { recursive: true }); await assert.rejects(restarted.get(project.id), /não está disponível/); await assert.rejects(readFile(join(folder, 'nested', 'main.py')), { code: 'ENOENT' });
  } finally { await rm(root, { recursive: true, force: true }); }
});
