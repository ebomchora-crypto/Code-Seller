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

test('gravar não perde nada: cópia de segurança, restauração, permissões e sem sobras', async () => {
  const { createBackups } = await import('../server/backups.mjs');
  const { stat, chmod, utimes } = await import('node:fs/promises');
  const root = await scratch();
  try {
    const folder = join(root, 'proj'); await mkdir(folder);
    const backups = createBackups(join(root, 'dados', 'backups')); const ctx = { backups, projectId: 'p1' };
    await writeFile(join(folder, 'run.sh'), 'versao 1\n'); await chmod(join(folder, 'run.sh'), 0o755);
    const first = await writeEntry(folder, { path: '/run.sh', content: 'versao 2\n' }, ctx);
    assert.equal(await readFile(join(folder, 'run.sh'), 'utf8'), 'versao 2\n');
    if (process.platform !== 'win32') assert.equal((await stat(join(folder, 'run.sh'))).mode & 0o777, 0o755);
    assert.ok(first.mtime > 0);
    // A versão original foi guardada fora da pasta do usuário.
    const versions = await backups.versions('p1', '/run.sh'); assert.equal(versions.length, 1);
    assert.equal((await backups.read('p1', '/run.sh', versions[0].id)).toString(), 'versao 1\n');
    assert.deepEqual((await readdir(folder)).sort(), ['run.sh']);
    // Salvamentos seguidos não enchem o disco de cópias.
    await writeEntry(folder, { path: '/run.sh', content: 'versao 3\n' }, ctx); assert.equal((await backups.versions('p1', '/run.sh')).length, 1);
    // Conteúdo com acentos e BOM continua igual byte a byte.
    await writeFile(join(folder, 'bom.txt'), Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from('olá')]));
    const read = await readEntry(folder, '/bom.txt'); assert.equal(read.bom, true);
    await writeEntry(folder, { path: '/bom.txt', content: read.content + '!', bom: read.bom, force: true }, ctx);
    assert.deepEqual([...await readFile(join(folder, 'bom.txt'))], [...Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from('olá!')])]);
    // Falha: nada muda e nenhum arquivo temporário sobra.
    await assert.rejects(writeEntry(folder, { path: '/run.sh', content: 'x'.repeat(25 * 1024 * 1024 + 10) }, ctx), /grande demais/);
    assert.equal(await readFile(join(folder, 'run.sh'), 'utf8'), 'versao 3\n');
    await assert.rejects(writeEntry(folder, { path: '/pasta-falsa/../../x', content: 'a' }, ctx), /inválido/);
    assert.ok(!(await readdir(folder)).some(name => name.endsWith('.cmtmp')));
    // Conflito com mudança externa continua protegendo.
    const old = (await stat(join(folder, 'run.sh'))).mtimeMs; await new Promise(done => setTimeout(done, 20));
    await writeFile(join(folder, 'run.sh'), 'mexeu por fora'); await utimes(join(folder, 'run.sh'), new Date(), new Date(Date.now() + 5000));
    await assert.rejects(writeEntry(folder, { path: '/run.sh', content: 'meu', expectedMtime: old }, ctx), /alterado fora da IDE/);
    assert.equal(await readFile(join(folder, 'run.sh'), 'utf8'), 'mexeu por fora');
    // Gravações simultâneas do mesmo arquivo terminam inteiras (uma depois da outra).
    await Promise.all(Array.from({ length: 9 }, (_, i) => writeEntry(folder, { path: '/par.txt', content: `${i}`.repeat(200000), force: true }, ctx)));
    const final = await readFile(join(folder, 'par.txt'), 'utf8'); assert.match(final, /^(\d)\1{199999}$/);
    assert.ok(!(await readdir(folder)).some(name => name.includes('.cmtmp')));
    // Excluir não apaga de vez fora do Windows: vai para a lixeira da IDE.
    if (process.platform !== 'win32') { const trash = join(root, 'dados', 'trash'); await operate(folder, { op: 'delete', path: '/bom.txt' }, { trash }); assert.equal((await readdir(trash)).length, 1); assert.ok(!(await readdir(folder)).includes('bom.txt')); }
  } finally { await rm(root, { recursive: true, force: true }); }
});
