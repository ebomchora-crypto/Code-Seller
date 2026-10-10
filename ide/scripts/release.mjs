// Lança uma versão nova da IDE instalada: build, instalador e arquivos de atualização automática.
// Uso: (1) subir "version" em ide/package.json  (2) cd ide && npm run release  (3) commit + push na main.
// As IDEs já instaladas conferem /downloads/ide.yml, baixam o instalador novo sozinhas e oferecem reiniciar.
import { execFileSync } from 'node:child_process';
import { copyFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';
import assert from 'node:assert/strict';
const run = (command, args) => execFileSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
const downloads = resolve('../public/downloads');
const version = JSON.parse(await readFile('package.json', 'utf8')).version;
const newer = (a, b) => { const x = a.split('.').map(Number), y = b.split('.').map(Number); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); return false; };
const published = (await readFile(join(downloads, 'ide.yml'), 'utf8').catch(() => '')).match(/^version:\s*(\S+)/m)?.[1];
if (published) assert.ok(newer(version, published), `A versão ${version} não é maior que a já publicada (${published}). Suba "version" em ide/package.json antes de lançar.`);
run('npm', ['run', 'build']); run('node', ['scripts/pack-windows.mjs']);
const release = resolve('.pack/release');
await copyFile(join(release, 'CodeSellersIDE-Setup.exe'), join(downloads, 'CodeSellersIDE-Setup.exe'));
await copyFile(join(release, 'ide.yml'), join(downloads, 'ide.yml'));
const yml = await readFile(join(downloads, 'ide.yml'), 'utf8');
const expected = yml.match(/^sha512:\s*(\S+)/m)?.[1]; const actual = createHash('sha512').update(await readFile(join(downloads, 'CodeSellersIDE-Setup.exe'))).digest('base64');
assert.equal(actual, expected, 'O sha512 do instalador não bate com o ide.yml.');
assert.equal(yml.match(/^version:\s*(\S+)/m)?.[1], version);
console.log(`\nIDE ${version} pronta em public/downloads (instalador + ide.yml, sha512 conferido). Agora: commit dos dois arquivos juntos e push na main.`);
