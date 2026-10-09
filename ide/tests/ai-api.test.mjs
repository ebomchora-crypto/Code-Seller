import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createApiServer } from '../server/api.mjs';
test('local AI adapter forwards real streaming protocol while keeping keys on server', async () => {
  let payload;
  const provider = createServer(async (request, response) => {
    assert.equal(request.url, '/v1/chat/completions');
    assert.equal(request.headers.authorization, 'Bearer test-only-key');
    let body = ''; for await (const chunk of request) body += chunk;
    payload = JSON.parse(body);
    response.writeHead(200, { 'Content-Type': 'text/event-stream' });
    response.end('data: {"choices":[{"delta":{"content":"fixture de teste"},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n');
  });
  await new Promise(done => provider.listen(0, '127.0.0.1', done));
  const base = resolve('tests/.tmp'); await mkdir(base, { recursive: true });
  const dir = await mkdtemp(resolve(base, 'ai-'));
  const server = createApiServer({ root: dir, ai: { baseUrl: `http://127.0.0.1:${provider.address().port}/v1`, model: 'test-model', key: 'test-only-key' } });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  const url = `http://127.0.0.1:${server.address().port}`;
  try {
    const project = await (await fetch(`${url}/api/projects`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'AI integration' }) })).json();
    const response = await fetch(`${url}/api/projects/${project.id}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: 'Explique App.tsx', activeFile: '/App.tsx', mode: 'ask' }) });
    assert.equal(response.status, 200); assert.match(await response.text(), /fixture de teste/);
    assert.equal(payload.model, 'test-model'); assert.equal(payload.stream, true);
    assert.match(payload.messages[0].content, /App.tsx/);
    assert.doesNotMatch(await (await fetch(`${url}/api/status`)).text(), /test-only-key/);
  } finally {
    await new Promise(done => server.close(done)); await new Promise(done => provider.close(done));
    await rm(dir, { recursive: true, force: true });
  }
});
