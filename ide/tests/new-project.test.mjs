import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createApiServer } from '../server/api.mjs';

test('novo projeto numa pasta escolhida e "Executar" serve o site com segurança', async () => {
  const base = resolve('tests/.tmp'); await mkdir(base, { recursive: true }); const dir = await mkdtemp(resolve(base, 'np-'));
  const api = createApiServer({ root: join(dir, 'dados') });
  await new Promise(done => api.listen(0, '127.0.0.1', done));
  const url = `http://127.0.0.1:${api.address().port}`; const json = { 'Content-Type': 'application/json' };
  const post = (path, body) => fetch(`${url}/api${path}`, { method: 'POST', headers: json, body: JSON.stringify(body) });
  try {
    const where = join(dir, 'Meus Sites');
    const created = await post('/projects', { name: 'Oficina: do Zé?', template: 'static', location: where });
    assert.equal(created.status, 201); const project = await created.json();
    assert.equal(project.lazy, true); assert.equal(project.folderPath, join(where, 'Oficina- do Zé'));
    assert.ok((await readdir(project.folderPath)).includes('index.html'));
    // Não sobrescreve uma pasta que já tem coisas.
    const again = await post('/projects', { name: 'Oficina: do Zé?', template: 'static', location: where }); assert.equal(again.status, 409);
    assert.equal((await post('/projects', { name: 'x', template: 'static', location: 'relativo/pasta' })).status, 400);
    assert.equal((await post('/projects', { name: 'CON', template: 'static', location: where })).status, 400);
    // Executar: o site abre numa porta própria e arquivos fora da pasta nunca saem.
    await writeFile(join(dir, 'segredo.txt'), 'SEGREDO');
    const served = await (await post(`/projects/${project.id}/fs/serve`, {})).json(); assert.match(served.url, /^http:\/\/127\.0\.0\.1:\d+\/$/);
    const page = await fetch(served.url); assert.equal(page.status, 200); assert.match(page.headers.get('content-type'), /text\/html/); assert.match(await page.text(), /<html/);
    assert.equal((await fetch(`${served.url}style.css`)).status, 200);
    for (const attack of ['/../segredo.txt', '/%2e%2e/segredo.txt', '/..%2fsegredo.txt']) { const r = await fetch(served.url.slice(0, -1) + attack); assert.notEqual(await r.text(), 'SEGREDO'); }
    assert.equal((await fetch(`${served.url}nao-existe.js`)).status, 404);
    // Sem index.html não há o que servir.
    const empty = await (await post('/projects', { name: 'vazio', template: 'generic', location: where })).json();
    assert.equal((await post(`/projects/${empty.id}/fs/serve`, {})).status, 404);
    // Abrir fora da IDE só vale para endereços do próprio computador.
    assert.equal((await post('/open-external', { url: 'https://exemplo.com' })).status, 403);
    assert.equal((await post('/open-external', { url: 'file:///etc/passwd' })).status, 403);
    assert.equal((await (await fetch(`${url}/api/default-location`)).json()).path.endsWith('Code Sellers IDE'), true);
  } finally { await new Promise(done => api.close(done)); await rm(dir, { recursive: true, force: true }); }
});
