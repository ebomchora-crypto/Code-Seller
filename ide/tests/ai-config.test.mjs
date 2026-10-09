import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createApiServer } from '../server/api.mjs';
test('AI configuration and conversations survive restart without exposing saved secrets', async () => {
  await mkdir('tests/.tmp', { recursive: true }); const root = await mkdtemp(resolve('tests/.tmp/config-')); let server;
  async function start() { server = createApiServer({ root }); await new Promise(done => server.listen(0, '127.0.0.1', done)); return `http://127.0.0.1:${server.address().port}/api`; }
  async function request(base, path, data) { const response = await fetch(base + path, data === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); assert.equal(response.ok, true); return response.json(); }
  try { let base = await start(); const project = await request(base, '/projects', { name: 'Conversation' }); const config = await request(base, '/ai-config', { baseUrl: 'http://127.0.0.1:11434/v1', model: 'fixture-model', key: 'secret-fixture' }); assert.equal(config.keyPresent, true); assert.equal(JSON.stringify(config).includes('secret-fixture'), false); const messages = [{ role: 'user', content: 'preserved locally' }]; await request(base, `/projects/${project.id}/conversation`, { messages }); await new Promise(done => server.close(done)); base = await start(); assert.equal((await request(base, '/ai-config')).model, 'fixture-model'); assert.equal(JSON.stringify(await request(base, '/ai-config')).includes('secret-fixture'), false); assert.deepEqual(await request(base, `/projects/${project.id}/conversation`), messages); await request(base, '/ai-config', { baseUrl: '', model: '', clearKey: true }); assert.equal((await request(base, '/ai-config')).keyPresent, false); }
  finally { if (server?.listening) await new Promise(done => server.close(done)); await rm(root, { recursive: true, force: true }); }
});
