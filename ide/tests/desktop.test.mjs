import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createApiServer } from '../server/api.mjs';

test('desktop serves SPA, offline assets and API together without exposing files', async () => {
  const parent = resolve('tests/.tmp'); await mkdir(parent, { recursive: true });
  const dir = await mkdtemp(join(parent, 'desktop-'));
  const web = join(dir, 'web'); await mkdir(join(web, 'assets'), { recursive: true });
  await writeFile(join(web, 'index.html'), '<!doctype html><title>Code Makers</title>');
  await writeFile(join(web, 'assets', 'app.js'), 'console.log("desktop")');
  await writeFile(join(dir, 'private.txt'), 'secret');
  const server = createApiServer({ root: join(dir, 'data'), staticRoot: web });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  const url = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.match(await (await fetch(url + '/project/123')).text(), /Code Makers/);
    const asset = await fetch(url + '/assets/app.js'); assert.match(asset.headers.get('content-type'), /javascript/);
    assert.equal((await fetch(url + '/assets/missing.js')).status, 404);
    assert.equal((await fetch(url + '/.env')).status, 404);
    assert.equal((await fetch(url + '/%2e%2e%5cprivate.txt')).status, 404);
    assert.equal((await fetch(url + '/api/status')).status, 200);
    assert.equal((await fetch(url + '/api/unknown')).status, 404);
    assert.equal((await fetch(url, { headers: { Origin: 'https://evil.example' } })).status, 403);
  } finally { await new Promise(done => server.close(done)); await rm(dir, { recursive: true, force: true }); }
});
