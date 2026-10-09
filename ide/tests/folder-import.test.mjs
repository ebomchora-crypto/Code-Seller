import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createApiServer } from '../server/api.mjs';
test('folder import copies code without credentials and leaves the original directory unchanged', async () => {
  await mkdir('tests/.tmp', { recursive: true }); const dir = await mkdtemp(resolve('tests/.tmp/import-')); const source = join(dir, 'source'); await mkdir(source); await writeFile(join(source, 'index.html'), '<h1>original</h1>'); await writeFile(join(source, '.env'), 'SECRET=fixture'); const server = createApiServer({ root: join(dir, 'projects') }); await new Promise(done => server.listen(0, '127.0.0.1', done));
  try { const response = await fetch(`http://127.0.0.1:${server.address().port}/api/import-folder`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: source }) }); assert.equal(response.status, 201); const project = await response.json(); assert.equal(project.files['/.env'], undefined); assert.equal(project.files['/index.html'], '<h1>original</h1>'); assert.equal(await readFile(join(source, 'index.html'), 'utf8'), '<h1>original</h1>'); assert.equal(project.trusted, undefined); }
  finally { await new Promise(done => server.close(done)); await rm(dir, { recursive: true, force: true }); }
});
