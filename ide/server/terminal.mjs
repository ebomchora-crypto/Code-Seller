import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { EventEmitter } from 'node:events';
import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'node:crypto';
import { localRequest } from './local-access.mjs';
const environmentNames = new Set(['PATH', 'SYSTEMROOT', 'WINDIR', 'COMSPEC', 'TEMP', 'TMP', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA', 'HOMEDRIVE', 'HOMEPATH', 'HOME', 'LANG', 'LC_ALL', 'PATHEXT', 'PROGRAMFILES', 'PROGRAMFILES(X86)', 'PROGRAMDATA']);
export function safeEnvironment() {
  return { ...Object.fromEntries(Object.entries(process.env).filter(([name]) => environmentNames.has(name.toUpperCase()))), ...(process.env.ELECTRON_RUN_AS_NODE ? { ELECTRON_RUN_AS_NODE: process.env.ELECTRON_RUN_AS_NODE } : {}), TERM: 'xterm-256color' };
}
export function spawnTerminal(cwd) {
  const child = fork(fileURLToPath(new URL('./terminal-worker.mjs', import.meta.url)), [cwd], { env: safeEnvironment(), stdio: ['ignore', 'ignore', 'pipe', 'ipc'], windowsHide: true, execArgv: [] });
  const events = new EventEmitter(); let exited = false;
  const closed = new Promise(done => child.once('exit', done));
  const send = item => { if (child.connected) child.send(item, () => {}); };
  child.on('message', item => { if (item.type === 'data') events.emit('data', item.data); if (item.type === 'exit' && !exited) { exited = true; events.emit('exit', { exitCode: item.code }); } });
  child.stderr.on('data', data => events.emit('data', data.toString()));
  child.on('error', error => events.emit('data', `\r\n${error.message}\r\n`));
  child.on('exit', code => { if (!exited) { exited = true; events.emit('exit', { exitCode: code ?? 1 }); } });
  const subscribe = (name, listener) => { events.on(name, listener); return { dispose: () => events.off(name, listener) }; };
  return { closed, onData: listener => subscribe('data', listener), onExit: listener => subscribe('exit', listener), write: data => send({ type: 'input', data }), resize: (cols, rows) => send({ type: 'resize', cols, rows }), kill: () => { if (exited) return; send({ type: 'close' }); const timer = setTimeout(() => { if (!exited) child.kill(); }, 2500); timer.unref(); child.once('exit', () => clearTimeout(timer)); } };
}
export function attachTerminals(server, repo) {
  const ws = new WebSocketServer({ noServer: true, maxPayload: 65536 });
  const sessions = new Map();
  const workers = new Set();
  server.shutdownTerminals = async () => { const active = [...workers]; active.forEach(terminal => terminal.kill()); await Promise.all(active.map(terminal => terminal.closed)); };
  const send = (socket, item) => { if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(item)); };
  const closeProject = id => { for (const item of sessions.values()) if (item.projectId === id) item.socket.close(1000, 'Projeto encerrado'); };
  server.on('upgrade', async (request, socket, head) => {
    try {
      const url = localRequest(request, true);
      const match = /^\/api\/terminal\/([a-f0-9-]{36})$/.exec(url.pathname);
      if (!match) throw new Error('Rota inválida.');
      const project = await repo.get(match[1]);
      if (!project.trusted) throw new Error('Marque este projeto como confiável para habilitar o terminal.');
      if (sessions.size >= 4 || [...sessions.values()].filter(item => item.projectId === project.id).length >= 2) throw new Error('Limite de terminais atingido.');
      if (socket.destroyed) return;
      ws.handleUpgrade(request, socket, head, connection => {
        const id = randomUUID(); let terminal; let exited = false;
        try { terminal = spawnTerminal(repo.workspace(project.id)); }
        catch { send(connection, { type: 'error', message: 'Não foi possível abrir o terminal nativo.' }); connection.close(); return; }
        workers.add(terminal); terminal.closed.then(() => workers.delete(terminal));
        sessions.set(id, { socket: connection, terminal, projectId: project.id });
        send(connection, { type: 'ready', id, cwd: repo.workspace(project.id), shell: process.platform === 'win32' ? 'PowerShell' : 'Bash' });
        terminal.onData(data => {
          if (connection.bufferedAmount > 4 * 1024 * 1024) { connection.close(1009, 'Terminal gerou dados demais.'); return; }
          send(connection, { type: 'data', data });
        });
        terminal.onExit(event => { exited = true; send(connection, { type: 'exit', code: event.exitCode }); connection.close(); });
        connection.on('message', raw => {
          try {
            const input = JSON.parse(raw.toString());
            if (input.type === 'input' && typeof input.data === 'string' && input.data.length <= 16384) terminal.write(input.data);
            else if (input.type === 'resize' && Number.isInteger(input.cols) && Number.isInteger(input.rows) && input.cols >= 20 && input.cols <= 400 && input.rows >= 5 && input.rows <= 150) terminal.resize(input.cols, input.rows);
            else if (input.type === 'stop') terminal.write('\x03');
            else if (input.type === 'close') connection.close();
          } catch { send(connection, { type: 'error', message: 'Mensagem de terminal inválida.' }); }
        });
        const cleanup = () => { if (!sessions.has(id)) return; sessions.delete(id); if (!exited) { try { terminal.kill(); } catch {} } };
        connection.on('close', cleanup); connection.on('error', cleanup);
      });
    } catch {
      socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
    }
  });
  server.on('close', () => { sessions.forEach(item => { item.socket.terminate(); try { item.terminal.kill(); } catch {} }); sessions.clear(); ws.close(); });
  return { closeProject };
}
