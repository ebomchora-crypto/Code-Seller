import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, mkdtemp, rm, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createApiServer } from '../server/api.mjs';

// Supabase falso: troca o código de login por sessão, renova e responde a função ide-ai.
function fakeSupabase() {
  const seen = { verify: 0, refresh: 0, chatAuth: [], chatBody: null }; let expiresIn = 3600;
  const server = createServer(async (request, response) => {
    let body = ''; for await (const chunk of request) body += chunk;
    const send = (status, value, type = 'application/json') => { response.writeHead(status, { 'Content-Type': type }); response.end(typeof value === 'string' ? value : JSON.stringify(value)); };
    if (request.url === '/auth/v1/verify') { seen.verify++; return JSON.parse(body).token_hash === 'codigo-valido-123' ? send(200, { access_token: 'acesso-1', refresh_token: 'renova-1', expires_in: expiresIn, user: { email: 'ana@exemplo.com' } }) : send(400, { error: 'invalid' }); }
    if (request.url.startsWith('/auth/v1/token')) { seen.refresh++; return JSON.parse(body).refresh_token === 'renova-1' ? send(200, { access_token: 'acesso-2', refresh_token: 'renova-2', expires_in: 3600, user: { email: 'ana@exemplo.com' } }) : send(400, { error: 'bad' }); }
    if (request.url === '/functions/v1/ide-ai') {
      seen.chatAuth.push(request.headers.authorization); seen.chatBody = JSON.parse(body);
      if (request.headers.authorization === 'Bearer sem-acesso') return send(402, { error: 'Seu teste grátis acabou. Assine o Code Sellers para continuar.' });
      return send(200, 'data: {"choices":[{"delta":{"content":"resposta da IA do Code Sellers"},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n', 'text/event-stream');
    }
    send(404, {});
  });
  return { server, seen, expire: value => { expiresIn = value; } };
}

test('login pelo navegador → assistente usa a IA do Code Sellers sem nenhuma chave local', async () => {
  const fake = fakeSupabase(); await new Promise(done => fake.server.listen(0, '127.0.0.1', done));
  const base = resolve('tests/.tmp'); await mkdir(base, { recursive: true }); const dir = await mkdtemp(resolve(base, 'acc-'));
  const opened = [];
  const api = createApiServer({ root: dir, accountOptions: { supabaseUrl: `http://127.0.0.1:${fake.server.address().port}`, open: async url => { opened.push(url); } } });
  await new Promise(done => api.listen(0, '127.0.0.1', done));
  const url = `http://127.0.0.1:${api.address().port}`; const json = { 'Content-Type': 'application/json' };
  try {
    // Sem login e sem modelo próprio: o assistente avisa o que fazer.
    let status = await (await fetch(`${url}/api/status`)).json(); assert.equal(status.ai, false); assert.equal(status.account.signedIn, false);
    const project = await (await fetch(`${url}/api/projects`, { method: 'POST', headers: json, body: JSON.stringify({ name: 'IA' }) })).json();
    const chat = body => fetch(`${url}/api/projects/${project.id}/chat`, { method: 'POST', headers: json, body: JSON.stringify({ prompt: 'Explique', activeFile: '/src/App.tsx', mode: 'ask', ...body }) });
    let blocked = await chat(); assert.equal(blocked.status, 503); assert.match((await blocked.json()).error, /Entre com a sua conta do Code Sellers/);
    // O botão "Entrar" abre o navegador no site, com a porta local e um código de confirmação.
    const started = await (await fetch(`${url}/api/account/start`, { method: 'POST', headers: json, body: '{}' })).json();
    assert.equal(opened.length, 1); const link = new URL(opened[0]); assert.equal(link.searchParams.get('ide_port'), String(api.address().port)); const state = link.searchParams.get('ide_state'); assert.match(state, /^[a-f0-9]{32}$/); assert.ok(started.url);
    // Código errado, estado errado: nada entra.
    assert.match(await (await fetch(`${url}/api/account/callback?token_hash=codigo-valido-123&state=${'0'.repeat(32)}`)).text(), /Não deu para entrar/);
    // A volta do navegador (navegação vinda de outro site) é aceita só com o estado certo.
    const back = await fetch(`${url}/api/account/callback?token_hash=codigo-valido-123&state=${state}`, { headers: { 'Sec-Fetch-Site': 'cross-site' } });
    assert.match(await back.text(), /Pronto! Pode voltar para a IDE/);
    status = await (await fetch(`${url}/api/status`)).json(); assert.equal(status.ai, true); assert.equal(status.account.email, 'ana@exemplo.com'); assert.equal(status.model, 'Assistente do Code Sellers');
    assert.match(await readFile(join(dir, 'account.json'), 'utf8'), /renova-1/);
    // Chat: vai para a função do servidor com a sessão, e o texto chega em streaming.
    const answered = await chat(); assert.equal(answered.status, 200); assert.match(await answered.text(), /resposta da IA do Code Sellers/);
    assert.equal(fake.seen.chatAuth[0], 'Bearer acesso-1'); assert.ok(Array.isArray(fake.seen.chatBody.messages));
    // Sessão perto de vencer é renovada sozinha.
    await fetch(`${url}/api/account/logout`, { method: 'POST', headers: json, body: '{}' });
    assert.equal((await (await fetch(`${url}/api/status`)).json()).account.signedIn, false);
  } finally { await new Promise(done => api.close(done)); await new Promise(done => fake.server.close(done)); await rm(dir, { recursive: true, force: true }); }
});

test('sessão que vence é renovada; sem acesso ao plano a IDE mostra a mensagem do servidor', async () => {
  const fake = fakeSupabase(); fake.expire(30); await new Promise(done => fake.server.listen(0, '127.0.0.1', done));
  const base = resolve('tests/.tmp'); await mkdir(base, { recursive: true }); const dir = await mkdtemp(resolve(base, 'acc-'));
  let opened = '';
  const api = createApiServer({ root: dir, accountOptions: { supabaseUrl: `http://127.0.0.1:${fake.server.address().port}`, open: async url => { opened = url; } } });
  await new Promise(done => api.listen(0, '127.0.0.1', done));
  const url = `http://127.0.0.1:${api.address().port}`; const json = { 'Content-Type': 'application/json' };
  try {
    await fetch(`${url}/api/account/start`, { method: 'POST', headers: json, body: '{}' }); const state = new URL(opened).searchParams.get('ide_state');
    await fetch(`${url}/api/account/callback?token_hash=codigo-valido-123&state=${state}`);
    const project = await (await fetch(`${url}/api/projects`, { method: 'POST', headers: json, body: JSON.stringify({ name: 'IA' }) })).json();
    const response = await fetch(`${url}/api/projects/${project.id}/chat`, { method: 'POST', headers: json, body: JSON.stringify({ prompt: 'Oi', activeFile: '/x', mode: 'ask' }) });
    assert.equal(response.status, 200); await response.text();
    assert.equal(fake.seen.refresh, 1); assert.equal(fake.seen.chatAuth[0], 'Bearer acesso-2');
    assert.equal(fake.seen.verify, 1);
  } finally { await new Promise(done => api.close(done)); await new Promise(done => fake.server.close(done)); await rm(dir, { recursive: true, force: true }); }
});
