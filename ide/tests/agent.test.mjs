import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createApiServer } from '../server/api.mjs';
import { parseCalls, visibleText, replaceSnippet, projectPath } from '../server/agent.mjs';

test('parseCalls lê chamadas completas e detecta chamada cortada', () => {
  const text = 'Vou ler.\n<ferramenta nome="ler" caminho="/a.txt"/>\n<ferramenta nome="escrever" caminho="/b.txt">\nolá\n</ferramenta>\n<ferramenta nome="execu';
  const { calls, unclosed } = parseCalls(text);
  assert.deepEqual(calls.map(call => call.name), ['ler', 'escrever']);
  assert.equal(calls[1].body, '\nolá\n'); assert.equal(unclosed, true);
  assert.equal(visibleText('Texto <ferr'), 'Texto '); assert.equal(visibleText('a <b> c'), 'a <b> c'); assert.equal(visibleText('x<ferramenta nome="a"/>'), 'x');
});
test('replaceSnippet: exato, tolerante a recuo, único e erros claros', () => {
  assert.equal(replaceSnippet('a\nb\nc', 'b', 'B'), 'a\nB\nc');
  assert.equal(replaceSnippet('  if (x) {\n    run();\n  }', 'if (x) {\nrun();\n}', 'if (y) {\n  go();\n}'), '  if (y) {\n  go();\n}');
  assert.throws(() => replaceSnippet('a a', 'a', 'b'), /2 vezes/);
  assert.equal(replaceSnippet('a a', 'a', 'b', true), 'b b');
  assert.throws(() => replaceSnippet('abc', 'zzz', 'y'), /não foi encontrado/);
});
test('projectPath aceita caminho sem barra e caminho absoluto dentro da pasta', () => {
  assert.equal(projectPath('/p', 'src/a.ts'), '/src/a.ts'); assert.equal(projectPath('/p', '/p/src/a.ts'), '/src/a.ts');
  assert.throws(() => projectPath('/p', 'C:/Windows/x'), /fora da pasta/); assert.equal(projectPath('/p', '/etc/passwd'), '/etc/passwd');
});

function sse(text) { return `data: ${JSON.stringify({ choices: [{ delta: { content: text }, finish_reason: 'stop' }] })}\n\ndata: [DONE]\n\n`; }
async function setup(script) {
  const seen = [];
  const provider = createServer(async (request, response) => {
    let body = ''; for await (const chunk of request) body += chunk;
    const payload = JSON.parse(body); seen.push(payload);
    response.writeHead(200, { 'Content-Type': 'text/event-stream' }); response.end(sse(script[Math.min(seen.length - 1, script.length - 1)]));
  });
  await new Promise(done => provider.listen(0, '127.0.0.1', done));
  const base = resolve('tests/.tmp'); await mkdir(base, { recursive: true });
  const dir = await mkdtemp(resolve(base, 'agent-')); const folder = join(dir, 'meu-projeto'); await mkdir(folder);
  await writeFile(join(folder, 'index.html'), '<h1>Oi</h1>\r\n<p>texto</p>\r\n');
  const server = createApiServer({ root: join(dir, 'data'), ai: { baseUrl: `http://127.0.0.1:${provider.address().port}/v1`, model: 'm', key: 'k' } });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  const url = `http://127.0.0.1:${server.address().port}`;
  const post = (path, body) => fetch(`${url}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const project = await (await post('/api/open-folder', { path: folder })).json();
  const run = async body => { const response = await post(`/api/projects/${project.id}/agent`, body); const text = await response.text(); return { status: response.status, events: text.split('\n\n').filter(line => line.startsWith('data:')).map(line => JSON.parse(line.slice(5))) }; };
  const close = async () => { await new Promise(done => server.close(done)); await new Promise(done => provider.close(done)); await rm(dir, { recursive: true, force: true }); };
  return { folder, project, run, post, seen, close, url };
}

test('modo agente cria, edita (preservando CRLF) e apaga arquivos de verdade na pasta', async () => {
  const ctx = await setup([
    'Vou criar a página e ajustar o título.\n<ferramenta nome="escrever" caminho="/css/estilo.css">\nbody { color: red; }\n</ferramenta>\n<ferramenta nome="editar" caminho="/index.html"><antes><h1>Oi</h1></antes><depois><h1>Olá, mundo</h1></depois></ferramenta>',
    'Pronto: criei /css/estilo.css e troquei o título.',
  ]);
  try {
    const { status, events } = await ctx.run({ mode: 'agent', prompt: 'crie um css e mude o título' });
    assert.equal(status, 200);
    assert.equal(await readFile(join(ctx.folder, 'css/estilo.css'), 'utf8'), 'body { color: red; }\n');
    assert.equal(await readFile(join(ctx.folder, 'index.html'), 'utf8'), '<h1>Olá, mundo</h1>\r\n<p>texto</p>\r\n');
    const done = events.at(-1); assert.equal(done.type, 'done'); assert.deepEqual(done.changed.sort(), ['/css/estilo.css', '/index.html']);
    assert.match(done.text, /Pronto/);
    assert.ok(events.some(event => event.type === 'tool_result' && event.path === '/index.html' && event.ok && event.added === 1 && event.removed === 1));
    assert.ok(!events.filter(event => event.type === 'text').map(event => event.delta).join('').includes('<ferramenta'));
    assert.match(ctx.seen[0].messages[0].content, /DIRETAMENTE nos arquivos/);
    assert.match(ctx.seen[1].messages.at(-1).content, /Arquivo criado: \/css\/estilo.css/);
  } finally { await ctx.close(); }
});

test('modos perguntar e planejar são somente leitura', async () => {
  const ctx = await setup(['<ferramenta nome="escrever" caminho="/x.txt">x</ferramenta>', 'Não consegui alterar.']);
  try {
    const { events } = await ctx.run({ mode: 'ask', prompt: 'crie x' });
    await assert.rejects(readFile(join(ctx.folder, 'x.txt')));
    assert.ok(events.some(event => event.type === 'tool_result' && !event.ok && /somente leitura/.test(event.detail)));
    assert.doesNotMatch(ctx.seen[0].messages[0].content, /nome="escrever"/);
  } finally { await ctx.close(); }
});

test('comando só roda depois da aprovação do usuário; recusado não executa', async () => {
  const command = '<ferramenta nome="executar">node -e "require(\'fs\').writeFileSync(\'feito.txt\',\'ok\')"</ferramenta>';
  const ctx = await setup([command, 'Terminei.', command, 'Terminei.']);
  try {
    for (const allow of [false, true]) {
      const response = await ctx.post(`/api/projects/${ctx.project.id}/agent`, { mode: 'agent', prompt: 'rode' });
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ''; const events = [];
      for (;;) {
        const { value, done } = await reader.read(); if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n'); buffer = parts.pop();
        for (const part of parts) { const event = JSON.parse(part.slice(5)); events.push(event); if (event.type === 'approval') await ctx.post(`/api/projects/${ctx.project.id}/agent/approve`, { id: event.id, allow }); }
      }
      assert.equal(events.at(-1).type, 'done');
      if (!allow) await assert.rejects(readFile(join(ctx.folder, 'feito.txt'))); else assert.equal(await readFile(join(ctx.folder, 'feito.txt'), 'utf8'), 'ok');
    }
  } finally { await ctx.close(); }
});

test('não escapa da pasta do projeto', async () => {
  const ctx = await setup(['<ferramenta nome="escrever" caminho="/../fora.txt">x</ferramenta>', 'ok']);
  try {
    const { events } = await ctx.run({ mode: 'agent', prompt: 'x' });
    assert.ok(events.some(event => event.type === 'tool_result' && !event.ok));
    await assert.rejects(readFile(join(ctx.folder, '..', 'fora.txt')));
  } finally { await ctx.close(); }
});

test('imagens anexadas vão ao modelo; se o modelo recusar, a tarefa segue só com o texto', async () => {
  const seen = [];
  const provider = createServer(async (request, response) => {
    let body = ''; for await (const chunk of request) body += chunk;
    const payload = JSON.parse(body); seen.push(payload);
    if (JSON.stringify(payload).includes('image_url')) { response.writeHead(400, { 'Content-Type': 'application/json' }); return response.end('{"error":{"message":"images not supported"}}'); }
    response.writeHead(200, { 'Content-Type': 'text/event-stream' }); response.end(sse('Entendi o pedido sem a imagem.'));
  });
  await new Promise(done => provider.listen(0, '127.0.0.1', done));
  const base = resolve('tests/.tmp'); await mkdir(base, { recursive: true });
  const dir = await mkdtemp(resolve(base, 'agent-img-')); const folder = join(dir, 'p'); await mkdir(folder);
  const server = createApiServer({ root: join(dir, 'data'), ai: { baseUrl: `http://127.0.0.1:${provider.address().port}/v1`, model: 'm', key: 'k' } });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  const url = `http://127.0.0.1:${server.address().port}`;
  const post = (path, body) => fetch(`${url}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  try {
    const project = await (await post('/api/open-folder', { path: folder })).json();
    const png = 'data:image/png;base64,iVBORw0KGgo=';
    const bad = await post(`/api/projects/${project.id}/agent`, { mode: 'agent', prompt: 'x', images: ['http://evil/x.png'] });
    assert.equal(bad.status, 400);
    const response = await post(`/api/projects/${project.id}/agent`, { mode: 'agent', prompt: 'veja o print', images: [png] });
    const events = (await response.text()).split('\n\n').filter(line => line.startsWith('data:')).map(line => JSON.parse(line.slice(5)));
    assert.equal(events.at(-1).type, 'done');
    assert.ok(Array.isArray(seen[0].messages.at(-1).content) && seen[0].messages.at(-1).content.some(part => part.type === 'image_url'));
    assert.equal(typeof seen[1].messages.at(-1).content, 'string');
    assert.ok(events.some(event => event.type === 'text' && /não consegue ler imagens/.test(event.delta)));
  } finally { await new Promise(done => server.close(done)); await new Promise(done => provider.close(done)); await rm(dir, { recursive: true, force: true }); }
});
