import { spawn } from 'node-pty';
// Each native PTY owns a process, so native Windows worker handles cannot leak into the API.
const terminal = spawn(process.platform === 'win32' ? 'powershell.exe' : '/bin/bash', process.platform === 'win32' ? ['-NoLogo', '-NoProfile'] : ['--noprofile', '--norc'], { name: 'xterm-256color', cols: 100, rows: 24, cwd: process.argv[2], env: Object.fromEntries(Object.entries(process.env).filter(([name]) => name !== 'ELECTRON_RUN_AS_NODE')), useConpty: true });
let closing = false;
function send(item, callback) { if (process.connected) process.send(item, callback || (() => {})); else callback?.(); }
terminal.onData(data => send({ type: 'data', data }));
terminal.onExit(event => { send({ type: 'exit', code: event.exitCode }, () => process.exit(0)); });
function close() { if (closing) return; closing = true; setTimeout(() => process.exit(0), 2000).unref(); try { terminal.kill(); } catch { process.exit(0); } }
process.on('message', item => { try { if (item.type === 'input') terminal.write(item.data); else if (item.type === 'resize') terminal.resize(item.cols, item.rows); else if (item.type === 'close') close(); } catch (error) { send({ type: 'data', data: `\r\n${error.message}\r\n` }); } });
process.on('disconnect', close);
