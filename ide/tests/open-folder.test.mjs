import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile, rm, readdir, symlink } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createRepository } from '../server/repository.mjs';
import { listDirectory, readEntry, writeEntry, operate, searchText, findFiles, statEntries, resolveInside } from '../server/folder.mjs';

const scratch = async () => { await mkdir('tests/.tmp', { recursive: true }); return mkdtemp(resolve('tests/.tmp/open-')); };

test('abrir pasta não lê nada de uma vez: sem limite de arquivos e sem alterar a pasta', async () => {
  const root = await scratch();
  try {
    const folder = join(root, 'grande'); await mkdir(join(folder, 'src'), { recursive: true });
    // Mais arquivos do que o antigo limite de 1000, e mais de 10 MB no total.
    for (let i = 0; i < 1500; i++) await writeFile(join(folder, 'src', `arquivo-${i}.txt`), 'x'.repeat(8000));
    const repo = createRepository(join(root, 'metadata'));
    const project = await repo.openFolder({ path: folder });
    assert.equal(project.lazy, true); assert.deepEqual(project.files, {}); assert.equal(repo.workspace(project.id), folder);
    assert.equal((await readdir(join(folder, 'src'))).length, 1500);
    const again = await repo.openFolder({ path: folder }); assert.equal(again.id, project.id);
    const renamed = await repo.update(project.id, { revision: project.revision, name: 'Meu projeto grande' });
    assert.equal(renamed.name, 'Meu projeto grande'); assert.equal((await readdir(join(folder, 'src'))).length, 1500);
    await repo.trash(project.id); await repo.recover(project.id);
    assert.equal((await readdir(join(folder, 'src'))).length, 1500);
    const restarted = createRepository(join(root, 'metadata')); await restarted.get(project.id); assert.equal(restarted.workspace(project.id), folder);
    await rm(folder, { recursive: true }); await assert.rejects(restarted.get(project.id), /não está disponível/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('árvore, leitura, gravação, operações e busca funcionam arquivo por arquivo', async () => {
  const root = await scratch();
  try {
    await mkdir(join(root, 'src/components'), { recursive: true }); await mkdir(join(root, 'node_modules/pkg'), { recursive: true }); await mkdir(join(root, '.git'));
    await writeFile(join(root, 'src/App.tsx'), 'export const nome = "Aurora";\r\nconsole.log(nome);\r\n');
    await writeFile(join(root, 'src/components/Card.tsx'), 'const Aurora = 1;');
    await writeFile(join(root, 'node_modules/pkg/index.js'), 'Aurora');
    await writeFile(join(root, 'imagem.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 1, 2]));
    await writeFile(join(root, 'dados.bin'), Buffer.from([1, 2, 0, 3]));
    await writeFile(join(root, 'antigo.txt'), Buffer.from('ação', 'latin1'));
    const top = await listDirectory(root, '/');
    assert.deepEqual(top.entries.filter(e => e.type === 'folder').map(e => e.name), ['node_modules', 'src']);
    assert.equal(top.entries.find(e => e.name === 'node_modules').heavy, true);
    assert.equal(top.entries.some(e => e.name === '.git'), false);
    const app = await readEntry(root, '/src/App.tsx'); assert.equal(app.kind, 'text'); assert.match(app.content, /\r\n/);
    assert.equal((await readEntry(root, '/imagem.png')).kind, 'image'); assert.equal((await readEntry(root, '/dados.bin')).kind, 'binary');
    const latin = await readEntry(root, '/antigo.txt'); assert.equal(latin.encoding, 'latin1'); assert.equal(latin.content, 'ação');
    // grava preservando CRLF e detecta alteração externa
    const saved = await writeEntry(root, { path: '/src/App.tsx', content: app.content.replace('Aurora', 'Lima'), expectedMtime: app.mtime });
    assert.match(await readFile(join(root, 'src/App.tsx'), 'utf8'), /Lima";\r\n/);
    await writeFile(join(root, 'src/App.tsx'), 'mudou fora'); const outside = Date.now() + 5000;
    await assert.rejects(writeEntry(root, { path: '/src/App.tsx', content: 'meu', expectedMtime: saved.mtime - 10000 }), /alterado fora da IDE/);
    await writeEntry(root, { path: '/src/App.tsx', content: 'meu', expectedMtime: saved.mtime - 10000, force: true }); assert.ok(outside);
    await writeEntry(root, { path: '/novo/dir/arquivo.md', content: '# oi' }); assert.equal(await readFile(join(root, 'novo/dir/arquivo.md'), 'utf8'), '# oi');
    await operate(root, { op: 'create', path: '/vazio.txt' }); await assert.rejects(operate(root, { op: 'create', path: '/vazio.txt' }), /Já existe/);
    await operate(root, { op: 'rename', path: '/vazio.txt', to: '/pasta/renomeado.txt' }); assert.equal((await readdir(join(root, 'pasta'))).join(), 'renomeado.txt');
    // busca: ignora node_modules e binários; resultado por linha
    const found = await searchText(root, 'aurora'); assert.deepEqual(found.matches.map(m => m.path), ['/src/components/Card.tsx']);
    assert.equal((await searchText(root, 'aurora', { all: true })).matches.length, 2);
    assert.equal((await searchText(root, 'AURORA', { caseSensitive: true })).matches.length, 0);
    assert.deepEqual((await findFiles(root, 'card')).paths, ['/src/components/Card.tsx']);
    const stats = await statEntries(root, ['/src/App.tsx', '/nao-existe']); assert.equal(stats['/nao-existe'], null); assert.ok(stats['/src/App.tsx'].mtime > 0);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('nada escapa da pasta aberta (.., caminhos absolutos e links simbólicos)', async () => {
  const root = await scratch();
  try {
    const folder = join(root, 'projeto'); const outside = join(root, 'segredo'); await mkdir(folder); await mkdir(outside); await writeFile(join(outside, 'senha.txt'), 'segredo');
    for (const path of ['/../segredo/senha.txt', '/a/../../segredo', 'relativo', 'C:\\Windows', '/x\0y']) await assert.rejects(resolveInside(folder, path), /inválido|fora/i);
    let linked = true; try { await symlink(outside, join(folder, 'atalho'), 'dir'); } catch { linked = false; }
    if (linked) {
      await assert.rejects(readEntry(folder, '/atalho/senha.txt'), /fora da pasta/);
      await assert.rejects(writeEntry(folder, { path: '/atalho/novo.txt', content: 'x' }), /fora da pasta/);
      await assert.rejects(operate(folder, { op: 'delete', path: '/atalho/senha.txt' }), /fora da pasta/);
      assert.equal(await readFile(join(outside, 'senha.txt'), 'utf8'), 'segredo');
    }
    await assert.rejects(operate(folder, { op: 'delete', path: '/' }), /raiz/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
