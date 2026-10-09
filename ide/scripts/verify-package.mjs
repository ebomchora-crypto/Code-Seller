import { fork } from 'node:child_process';
import { resolve, join } from 'node:path';
import { mkdtemp, mkdir, rm, readFile, access } from 'node:fs/promises';
import assert from 'node:assert/strict';
import WebSocket from 'ws';
const root = resolve('release/win-unpacked');
await access(join(root, 'Code Sellers IDE.exe'));
const base = join(root, 'resources', 'app');
for (const file of ['desktop/main.cjs', 'server/desktop-server.mjs', 'server/terminal.mjs']) assert.equal(await readFile(join(base, file), 'utf8'), await readFile(file, 'utf8'), `Packaged file is stale: ${file}`);
await assert.rejects(access(join(base, '.code-makers')));
await assert.rejects(access(join(base, '.env.local')));
const parent = resolve('tests/.tmp'); await mkdir(parent, { recursive: true });
const data = await mkdtemp(join(parent, 'packaged-'));
const child = fork(join(base, 'server/desktop-server.mjs'), [], { execPath: join(root, 'Code Sellers IDE.exe'), cwd: base, env: { ...process.env, CODE_MAKERS_DATA: data, CODE_MAKERS_PORT: '0' }, stdio: ['ignore', 'ignore', 'pipe', 'ipc'], windowsHide: true });
child.stderr.on('data', chunk => process.stderr.write(chunk));
let socket;
try {
  const url = await new Promise((done, reject) => { const timer = setTimeout(() => reject(new Error('Server startup timeout')), 20000); child.once('error', reject); child.once('exit', code => reject(new Error(`Server exited ${code}`))); child.on('message', message => { if (message.type === 'ready') { clearTimeout(timer); done(message.url); } }); });
  const api = async (route, input) => { const response = await fetch(url + '/api/' + route, input ? { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: url }, body: JSON.stringify(input) } : {}); assert.ok(response.ok, await response.clone().text()); return response.json(); };
  assert.equal((await api('status')).local, true);
  const html = await (await fetch(url)).text(); assert.match(html, /<div id="root"/);
  const asset = html.match(/src="([^" ]+\.js)"/)[1]; assert.match((await fetch(url + asset)).headers.get('content-type'), /javascript/);
  const react = await api('projects', { name: 'Packaged preview', template: 'react' });
  const preview = await api(`projects/${react.id}/preview`, {}); assert.ok(preview.html.includes('<html'));
  const project = await api('projects', { name: 'Package verification', template: 'generic' });
  await api(`projects/${project.id}/trust`, { trusted: true });
  socket = new WebSocket(url.replace('http:', 'ws:') + `/api/terminal/${project.id}`, { origin: url });
  await new Promise((done, reject) => {
    const timeout = setTimeout(() => reject(new Error('Packaged PTY timeout')), 25000);
    let output = '';
    socket.on('error', reject);
    socket.on('message', raw => {
      const message = JSON.parse(raw);
      if (message.type === 'ready') socket.send(JSON.stringify({ type: 'input', data: "Set-Content -Path package-test.txt -Value 'packaged-native-shell'; Write-Output ('PACKAGE_' + 'OK')\r" }));
      if (message.type === 'data') { output += message.data; if (output.includes('PACKAGE_OK')) { clearTimeout(timeout); done(); } }
      if (message.type === 'error') reject(new Error(message.message));
    });
  });
  const saved = await api(`projects/${project.id}`); assert.match(saved.files['/package-test.txt'], /packaged-native-shell/);
  console.log('Packaged Node, static assets, API and native PowerShell passed.');
} finally {
  socket?.close();
  if (child.connected) child.send({ type: 'shutdown' });
  await new Promise(done => { if (child.exitCode !== null) return done(); child.once('exit', done); setTimeout(() => child.kill(), 6000).unref(); });
  assert.equal(child.exitCode, 0, 'Desktop backend must shut down cleanly');
  await rm(data, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
}
