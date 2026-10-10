import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import { writeFile, mkdtemp, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';

// O servidor do app instalado pede a janela de pastas ao Electron (processo pai) por mensagem.
test('janela de pastas é pedida ao app (Electron) e a resposta volta ao servidor', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'picker-'));
  const child = join(dir, 'child.mjs');
  await writeFile(child, `import { pickFolder } from ${JSON.stringify(new URL('../server/folder-picker.mjs', import.meta.url).href)};
const first = await pickFolder('Escolha a pasta'); process.send({ type: 'result', first });
let second; try { second = await pickFolder('x'); } catch (e) { second = 'erro:' + e.message; } process.send({ type: 'result', second }); process.exit(0);`);
  try {
    const worker = fork(child, [], { stdio: ['ignore', 'ignore', 'inherit', 'ipc'] }); const answers = []; const asked = [];
    const finished = new Promise((done, fail) => { worker.on('message', message => {
      if (message.type === 'pick-folder') { asked.push(message.title); worker.send({ type: 'picked', id: message.id, path: asked.length === 1 ? 'C:\\Users\\ana\\Meu Site' : '' }); }
      if (message.type === 'result') { answers.push(message); if (answers.length === 2) done(); }
    }); worker.on('error', fail); setTimeout(() => fail(new Error('sem resposta')), 10000).unref(); });
    await finished;
    assert.deepEqual(asked, ['Escolha a pasta', 'x']); assert.equal(answers[0].first, 'C:\\Users\\ana\\Meu Site'); assert.equal(answers[1].second, '');
  } finally { await rm(dir, { recursive: true, force: true }); }
});
