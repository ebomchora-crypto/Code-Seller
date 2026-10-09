import { mkdir, lstat, realpath, readdir, readFile, unlink } from 'node:fs/promises';
import { resolve, join, relative, sep } from 'node:path';
import { randomUUID } from 'node:crypto';
import { fail } from './repository.mjs';
import { atomicWrite } from './atomic.mjs';
const ignored = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '.next', '.code-makers']);
export function reservedPath(path) {
  return path.split('/').some(part => ignored.has(part.toLowerCase()) || part.toLowerCase() === '.env' || part.toLowerCase().startsWith('.env.') || part.startsWith('.cm-'));
}
export async function safePath(root, path) {
  const base = resolve(root);
  if (!path.startsWith('/') || path.split('/').slice(1).some(part => !part || part === '.' || part === '..') || /[\\\x00-\x1f:]/.test(path)) throw fail('Caminho inválido.');
  const target = resolve(base, `.${path}`);
  const rel = relative(base, target);
  if (!rel || rel.startsWith(`..${sep}`) || rel === '..') throw fail('Caminho fora do workspace.');
  const baseStat = await lstat(base).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
  if (baseStat?.isSymbolicLink()) throw fail('Link simbólico não permitido no workspace.');
  if (baseStat && (await realpath(base)).toLowerCase() !== base.toLowerCase()) throw fail('Link simbólico não permitido no workspace.');
  let ancestor = base;
  for (const part of rel.split(sep)) {
    ancestor = join(ancestor, part);
    const stat = await lstat(ancestor).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
    if (stat?.isSymbolicLink()) throw fail('Link simbólico não permitido no workspace.');
  }
  return target;
}
export async function writeWorkspace(root, files, previous = {}) {
  await mkdir(root, { recursive: true });
  // Validate every target before the first write or removal.
  const targets = new Map();
  for (const path of new Set([...Object.keys(files), ...Object.keys(previous)])) targets.set(path, await safePath(root, path));
  for (const [path, content] of Object.entries(files)) {
    if (previous[path] === content) continue;
    const target = targets.get(path);
    await mkdir(resolve(target, '..'), { recursive: true });
    const temporary = join(resolve(target, '..'), `.cm-${randomUUID()}.tmp`);
    await atomicWrite(target, content, temporary);
  }
  for (const path of Object.keys(previous)) if (files[path] === undefined) await unlink(targets.get(path)).catch(error => { if (error.code !== 'ENOENT') throw error; });
}
export async function readWorkspace(root) {
  const files = {}; let total = 0;
  await safePath(root, '/.cm-root-check');
  async function walk(directory, prefix = '') {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const path = `${prefix}/${entry.name}`;
      if (reservedPath(path) || entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) { await walk(join(directory, entry.name), path).catch(error => { if (error.code !== 'ENOENT') throw error; }); continue; }
      if (!entry.isFile() || /\.(?:png|jpe?g|gif|webp|ico|woff2?|ttf|pdf|zip|exe|dll|node|mp[34])$/i.test(entry.name)) continue;
      const target = await safePath(root, path).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
      if (!target) continue;
      const stat = await lstat(target).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
      if (!stat || !stat.isFile() || stat.isSymbolicLink()) continue;
      total += stat.size;
      if (Object.keys(files).length >= 1000 || total > 10 * 1024 * 1024) throw fail('Workspace excede 1000 arquivos de texto ou 10 MB.');
      const bytes = await readFile(target).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
      if (!bytes) continue;
      if (bytes.includes(0)) continue;
      files[path] = bytes.toString('utf8');
    }
  }
  await walk(root);
  return files;
}
