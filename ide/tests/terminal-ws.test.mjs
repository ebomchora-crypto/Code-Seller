import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { WebSocket } from 'ws';
import { createApiServer } from '../server/api.mjs';
test('terminal WebSocket rejects foreign origins and untrusted projects', async () => {
  await mkdir('tests/.tmp', { recursive: true });
  const dir = await mkdtemp(resolve('tests/.tmp/ws-'));
  const server = createApiServer({ root: dir });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  const host = `127.0.0.1:${server.address().port}`;
  const request = async (path, data) => (await fetch(`http://${host}/api${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })).json();
  try {
    const project = await request('/projects', { name: 'Terminal policy' });
    const rejected = origin => new Promise((done, reject) => { const socket = new WebSocket(`ws://${host}/api/terminal/${project.id}`, { origin }); socket.on('open', () => { socket.close(); reject(new Error('Unexpected open')); }); socket.on('error', () => done()); });
    await rejected('https://foreign.example'); await rejected(`http://${host}`);
    await request(`/projects/${project.id}/trust`, { trusted: true });
    const opened = await new Promise((done, reject) => { const socket = new WebSocket(`ws://${host}/api/terminal/${project.id}`, { origin: `http://${host}` }); socket.on('error', reject); socket.on('message', raw => { const data = JSON.parse(raw); if (data.type === 'ready') done({ socket, data }); }); });
    assert.equal(opened.data.shell, process.platform === 'win32' ? 'PowerShell' : 'Bash');
    await new Promise((done, reject) => {
      const timer = setTimeout(() => reject(new Error('Comando WebSocket não retornou resultado.')), 15000); let output = '';
      opened.socket.on('message', raw => {
        const item = JSON.parse(raw); if (item.type !== 'data') return;
        output += item.data;
        if (item.data.includes('\x1b[6n')) opened.socket.send(JSON.stringify({ type: 'input', data: '\x1b[1;1R' }));
        if (output.includes('WS_DONE_MARKER')) { clearTimeout(timer); done(); }
      });
      const command = process.platform === 'win32' ? "Set-Content ws-test.txt 'from-terminal'\rWrite-Output ('WS_DONE_'+'MARKER')\r" : "printf from-terminal > ws-test.txt; printf 'WS_DONE_%s\\n' MARKER\n";
      opened.socket.send(JSON.stringify({ type: 'input', data: command }));
    });
    const updated = await (await fetch(`http://${host}/api/projects/${project.id}`)).json();
    assert.equal(updated.files['/ws-test.txt'].trim(), 'from-terminal');
    const closed = new Promise(done => opened.socket.on('close', done));
    opened.socket.send(JSON.stringify({ type: 'input', data: 'exit\r' })); await closed;
  } finally { await new Promise(done => server.close(done)); await rm(dir, { recursive: true, force: true }); }
});
