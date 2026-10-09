import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile, rm, symlink } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createRepository } from '../server/repository.mjs';
test('physical workspace persists edits and reconciles external changes with a recoverable checkpoint', async () => {
  await mkdir('tests/.tmp', { recursive: true });
  const dir = await mkdtemp(resolve('tests/.tmp/workspace-'));
  try {
    const repo = createRepository(join(dir, 'projects'));
    const project = await repo.create({ name: 'Physical' });
    const cwd = repo.workspace(project.id);
    assert.match(await readFile(join(cwd, 'App.tsx'), 'utf8'), /export default/);
    const saved = await repo.update(project.id, { revision: project.revision, files: { ...project.files, '/App.tsx': 'editor' } });
    assert.equal(await readFile(join(cwd, 'App.tsx'), 'utf8'), 'editor');
    await writeFile(join(cwd, 'App.tsx'), 'terminal', 'utf8');
    await writeFile(join(cwd, '.env.local'), 'SECRET=test-only', 'utf8');
    const external = await repo.get(project.id);
    assert.equal(external.files['/App.tsx'], 'terminal');
    assert.equal(external.files['/.env.local'], undefined);
    assert.ok(external.revision > saved.revision);
    assert.equal(external.history[0].files['/App.tsx'], 'editor');
    await repo.restore(project.id, external.history[0].id);
    assert.equal(await readFile(join(cwd, 'App.tsx'), 'utf8'), 'editor');
    await assert.rejects(repo.update(project.id, { revision: (await repo.get(project.id)).revision, files: { '/.git/config': 'bad' } }), /reservad/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
test('workspace refuses symbolic links instead of writing beyond its root', async () => {
  const { writeWorkspace } = await import('../server/workspace.mjs');
  await mkdir('tests/.tmp', { recursive: true });
  const dir = await mkdtemp(resolve('tests/.tmp/links-'));
  try {
    const workspace = join(dir, 'workspace'); const outside = join(dir, 'outside');
    await mkdir(workspace); await mkdir(outside);
    await symlink(outside, join(workspace, 'escape'), process.platform === 'win32' ? 'junction' : 'dir');
    await assert.rejects(writeWorkspace(workspace, { '/escape/payload.txt': 'must not write' }, {}), /simbólico/);
    await assert.rejects(readFile(join(outside, 'payload.txt')), { code: 'ENOENT' });
  } finally { await rm(dir, { recursive: true, force: true }); }
});
