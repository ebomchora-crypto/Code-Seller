import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
test('Git integration stages, commits and shows real working-tree diffs', async () => {
  const { gitStatus, gitAction, gitDiff } = await import('../server/git.mjs');
  await mkdir('tests/.tmp', { recursive: true });
  const dir = await mkdtemp(resolve('tests/.tmp/git-'));
  try {
    await writeFile(join(dir, 'app.js'), 'const value = 1;\n');
    assert.equal((await gitStatus(dir)).initialized, false);
    await gitAction(dir, { action: 'init' });
    await gitAction(dir, { action: 'stage', path: '/app.js' });
    await gitAction(dir, { action: 'commit', message: 'Primeiro commit', authorName: 'IDE test', authorEmail: 'test@example.invalid' });
    await writeFile(join(dir, 'app.js'), 'const value = 2;\n');
    const status = await gitStatus(dir);
    assert.equal(status.branch, 'main');
    assert.ok(status.files.some(file => file.path === '/app.js' && file.worktree === 'M'));
    assert.match(await gitDiff(dir, '/app.js'), /\+const value = 2/);
    await gitAction(dir, { action: 'stage', path: '/app.js' });
    await gitAction(dir, { action: 'unstage', path: '/app.js' });
    assert.ok((await gitStatus(dir)).files.some(file => file.worktree === 'M' && file.index === ' '));
    await assert.rejects(gitAction(dir, { action: 'stage', path: '/../outside' }), /inválido|fora/);
    await assert.rejects(gitAction(dir, { action: 'push' }), /não permitida/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
