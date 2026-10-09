import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

test('API creates real projects, rejects foreign origins and reports unconfigured AI', async () => {
  const { createApiServer } = await import('../server/api.mjs');
  const base = resolve('tests/.tmp');
  await mkdir(base, { recursive: true });
  const dir = await mkdtemp(resolve(base, 'api-'));
  const server = createApiServer({ root: dir, ai: {} });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  const url = `http://127.0.0.1:${server.address().port}`;
  try {
    const blocked = await fetch(`${url}/api/projects`, { method: 'POST', headers: { Origin: 'https://evil.example', 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Blocked' }) });
    assert.equal(blocked.status, 403);
    const response = await fetch(`${url}/api/projects`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Real', template: 'static' }) });
    assert.equal(response.status, 201);
    const project = await response.json();
    assert.match(project.files['/index.html'], /doctype/);
    const disabled = await fetch(`${url}/api/projects/${project.id}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: 'Olá', mode: 'ask' }) });
    assert.equal(disabled.status, 503);
    assert.match((await disabled.json()).error, /IA não configurada/);
    assert.equal((await (await fetch(`${url}/api/projects`)).json()).length, 1);
  } finally {
    await new Promise(done => server.close(done));
    await rm(dir, { recursive: true, force: true });
  }
});
