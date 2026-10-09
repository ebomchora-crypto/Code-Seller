import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
test('PTY runs an actual shell in the chosen workspace without platform API secrets', async () => {
  const { spawnTerminal, safeEnvironment } = await import('../server/terminal.mjs');
  process.env.AI_API_KEY = 'test-secret-not-for-shell';
  assert.equal(safeEnvironment().AI_API_KEY, undefined);
  await mkdir('tests/.tmp', { recursive: true });
  const dir = await mkdtemp(resolve('tests/.tmp/pty-'));
  let terminal;
  try {
    terminal = spawnTerminal(dir);
    let output = '';
    const complete = new Promise((done, reject) => {
      const timeout = setTimeout(() => reject(new Error(`PTY timeout: ${output.slice(-300)}`)), 20000);
      terminal.onData(data => { output += data; if (data.includes('\x1b[6n')) terminal.write('\x1b[1;1R'); if (output.includes('PTY_DONE_MARKER')) { clearTimeout(timeout); done(); } });
    });
    const command = process.platform === 'win32' ? "Set-Content -LiteralPath 'terminal-test.txt' -Value 'real-terminal'; Write-Output ('PTY_DONE_' + 'MARKER')\r" : "printf real-terminal > terminal-test.txt; printf 'PTY_DONE_%s\\n' MARKER\n";
    await new Promise(done => setTimeout(done, 1000)); terminal.write(command);
    await complete;
    assert.equal((await readFile(join(dir, 'terminal-test.txt'), 'utf8')).trim(), 'real-terminal');
  } finally { if (terminal) { const exited = new Promise(done => terminal.onExit(done)); terminal.write('exit\r'); await Promise.race([exited, new Promise(done => setTimeout(done, 2000))]); } delete process.env.AI_API_KEY; await new Promise(done => setTimeout(done, 100)); await rm(dir, { recursive: true, force: true }); }
});
