import { createReadStream } from 'node:fs';
import { lstat, mkdir, readdir, readFile, realpath, rename as renameFile, rm, stat } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve, sep, basename } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import { fail } from './repository.mjs';
import { atomicWrite } from './atomic.mjs';

// Pastas abertas na IDE instalada: nada é carregado de uma vez. A árvore, os arquivos, a busca e as
// alterações são feitos sob demanda, direto no disco — por isso não há limite de tamanho da pasta.
const HIDDEN = new Set(['.git', '.code-makers']);
const SKIPPED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'out', '.next', '.nuxt', 'coverage', 'target', 'venv', '.venv', '__pycache__', '.gradle', '.idea', '.vs', '.cache', '.turbo', '.code-makers']);
const BINARY_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.ico', '.avif', '.mp3', '.wav', '.ogg', '.flac', '.mp4', '.mov', '.avi', '.mkv', '.webm', '.zip', '.gz', '.tar', '.7z', '.rar', '.exe', '.dll', '.so', '.dylib', '.bin', '.pdf', '.woff', '.woff2', '.ttf', '.otf', '.eot', '.psd', '.ai', '.sketch', '.fig', '.blend', '.fbx', '.glb', '.obj', '.class', '.jar', '.pyc', '.o', '.a', '.lib', '.iso', '.dmg', '.sqlite', '.db', '.parquet']);
const IMAGE_TYPES = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.bmp': 'image/bmp', '.ico': 'image/x-icon', '.avif': 'image/avif' };
export const MAX_TEXT_BYTES = 5 * 1024 * 1024;
const MAX_LIST = 10000;
const lower = value => process.platform === 'win32' ? value.toLowerCase() : value;

async function nearestExisting(path) {
  let current = path;
  for (;;) {
    try { await lstat(current); return current; } catch (error) { if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error; }
    const parent = dirname(current); if (parent === current) return current; current = parent;
  }
}
/** Caminho do projeto ("/src/a.ts") → caminho real no disco, garantindo que nada escape da pasta aberta. */
export async function resolveInside(root, path, { mustExist = true } = {}) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.includes('\0') || path.split(/[\\/]/).includes('..')) throw fail('Caminho inválido.');
  let base;
  try { base = await realpath(root); } catch { throw fail('A pasta não está disponível. Verifique o caminho e abra a pasta novamente.', 404); }
  const target = resolve(base, `.${path}`);
  const rel = relative(base, target);
  if (rel.startsWith('..') || (rel && resolve(base, rel) !== target)) throw fail('Caminho fora da pasta.', 403);
  const probe = await nearestExisting(target);
  const real = await realpath(probe);
  if (lower(real) !== lower(base) && !lower(real).startsWith(lower(base + sep))) throw fail('Link simbólico para fora da pasta não é permitido.', 403);
  if (mustExist) { try { await lstat(target); } catch { throw fail('Arquivo não encontrado.', 404); } }
  return { base, target: probe === target ? real : target, relative: rel };
}
const toProjectPath = (base, full) => `/${relative(base, full).split(sep).join('/')}`;

export async function listDirectory(root, path = '/', { all = false } = {}) {
  const { base, target } = await resolveInside(root, path);
  const info = await stat(target); if (!info.isDirectory()) throw fail('Isto não é uma pasta.');
  const dirents = await readdir(target, { withFileTypes: true });
  const entries = [];
  for (const entry of dirents) {
    if (HIDDEN.has(entry.name)) continue;
    let folder = entry.isDirectory();
    if (entry.isSymbolicLink()) { try { folder = (await stat(join(target, entry.name))).isDirectory(); } catch { continue; } }
    entries.push({ name: entry.name, type: folder ? 'folder' : 'file', heavy: folder && !all && SKIPPED_DIRS.has(entry.name) });
    if (entries.length >= MAX_LIST) break;
  }
  entries.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }) : a.type === 'folder' ? -1 : 1));
  return { path: path === '/' ? '/' : toProjectPath(base, target), entries, truncated: dirents.length > MAX_LIST };
}

export async function readEntry(root, path) {
  const { target } = await resolveInside(root, path);
  const info = await stat(target);
  if (info.isDirectory()) throw fail('Isto é uma pasta.');
  const extension = extname(target).toLowerCase();
  const base = { size: info.size, mtime: info.mtimeMs };
  if (IMAGE_TYPES[extension]) return { kind: 'image', ...base };
  if (info.size > MAX_TEXT_BYTES) return { kind: 'large', ...base };
  const buffer = await readFile(target);
  if (buffer.subarray(0, 8000).includes(0)) return { kind: 'binary', ...base };
  let bom = false; let data = buffer;
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) { bom = true; data = buffer.subarray(3); }
  try { return { kind: 'text', content: new TextDecoder('utf-8', { fatal: true }).decode(data), encoding: 'utf8', bom, ...base }; }
  catch { return { kind: 'text', content: data.toString('latin1'), encoding: 'latin1', bom: false, ...base }; }
}
export async function rawEntry(root, path, response) {
  const { target } = await resolveInside(root, path);
  const type = IMAGE_TYPES[extname(target).toLowerCase()];
  if (!type) throw fail('Só imagens podem ser exibidas.', 415);
  const info = await stat(target);
  response.writeHead(200, { 'Content-Type': type, 'Content-Length': info.size, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  await new Promise((done, reject) => { const stream = createReadStream(target); stream.on('error', reject); stream.on('end', done); stream.pipe(response); });
}

export async function writeEntry(root, input) {
  const { target } = await resolveInside(root, input.path, { mustExist: false });
  if (typeof input.content !== 'string') throw fail('Conteúdo inválido.');
  let current = null;
  try { current = await stat(target); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (current?.isDirectory()) throw fail('Isto é uma pasta.');
  if (current && !input.force && typeof input.expectedMtime === 'number' && Math.abs(current.mtimeMs - input.expectedMtime) > 2) throw fail('Este arquivo foi alterado fora da IDE depois que você o abriu.', 409);
  await mkdir(dirname(target), { recursive: true });
  const latin = input.encoding === 'latin1';
  const body = Buffer.concat([input.bom && !latin ? Buffer.from([0xef, 0xbb, 0xbf]) : Buffer.alloc(0), Buffer.from(input.content, latin ? 'latin1' : 'utf8')]);
  await atomicWrite(target, body, `${target}.${randomUUID()}.cmtmp`);
  const saved = await stat(target);
  return { mtime: saved.mtimeMs, size: saved.size };
}

async function toRecycleBin(target, folder) {
  if (process.platform !== 'win32') { await rm(target, { recursive: true, force: false }); return; }
  const script = `Add-Type -AssemblyName Microsoft.VisualBasic; $p = $env:CM_TARGET; if ((Get-Item -LiteralPath $p).PSIsContainer) { [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteDirectory($p, 'OnlyErrorDialogs', 'SendToRecycleBin') } else { [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile($p, 'OnlyErrorDialogs', 'SendToRecycleBin') }`;
  try { await promisify(execFile)('powershell.exe', ['-NoProfile', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')], { windowsHide: true, timeout: 120000, env: { ...process.env, CM_TARGET: target } }); }
  catch { throw fail(`Não foi possível enviar ${folder ? 'a pasta' : 'o arquivo'} para a Lixeira do Windows. Nada foi apagado.`, 500); }
}
export async function operate(root, input) {
  switch (input.op) {
    case 'create': {
      const { target } = await resolveInside(root, input.path, { mustExist: false });
      if (await stat(target).then(() => true, () => false)) throw fail('Já existe um arquivo ou pasta neste caminho.');
      await mkdir(dirname(target), { recursive: true });
      await atomicWrite(target, Buffer.alloc(0), `${target}.${randomUUID()}.cmtmp`);
      return { mtime: (await stat(target)).mtimeMs };
    }
    case 'mkdir': {
      const { target } = await resolveInside(root, input.path, { mustExist: false });
      if (await stat(target).then(() => true, () => false)) throw fail('Já existe um arquivo ou pasta neste caminho.');
      await mkdir(target, { recursive: true }); return {};
    }
    case 'rename': {
      const from = await resolveInside(root, input.path); const to = await resolveInside(root, input.to, { mustExist: false });
      if (await stat(to.target).then(() => true, () => false)) throw fail('Já existe um arquivo ou pasta neste caminho.');
      await mkdir(dirname(to.target), { recursive: true }); await renameFile(from.target, to.target); return {};
    }
    case 'delete': {
      const { target, base } = await resolveInside(root, input.path);
      if (lower(target) === lower(base)) throw fail('A pasta raiz não pode ser apagada pela IDE.', 403);
      const info = await lstat(target);
      await toRecycleBin(target, info.isDirectory()); return {};
    }
    default: throw fail('Operação inválida.');
  }
}
export async function statEntries(root, paths) {
  if (!Array.isArray(paths) || paths.length > 60) throw fail('Lista inválida.');
  const result = {};
  for (const path of paths) {
    try { const { target } = await resolveInside(root, path); const info = await stat(target); result[path] = { mtime: info.mtimeMs, size: info.size }; } catch { result[path] = null; }
  }
  return result;
}

async function* walk(base, { all = false } = {}) {
  const queue = [base];
  while (queue.length) {
    const dir = queue.shift(); let handle;
    try { handle = await readdir(dir, { withFileTypes: true }); } catch { continue; }
    for (const entry of handle) {
      if (HIDDEN.has(entry.name)) continue;
      if (entry.isDirectory()) { if (all || !SKIPPED_DIRS.has(entry.name)) queue.push(join(dir, entry.name)); }
      else if (entry.isFile()) yield join(dir, entry.name);
    }
  }
}
const indexes = new Map();
/** Busca de arquivos pelo nome (Ctrl+P). O índice fica em memória por um minuto. */
export async function findFiles(root, query, { limit = 80 } = {}) {
  const { base } = await resolveInside(root, '/');
  let index = indexes.get(base);
  if (!index || Date.now() - index.at > 60000) {
    const list = []; let count = 0;
    for await (const file of walk(base)) { list.push(toProjectPath(base, file)); if (++count >= 400000) break; }
    index = { at: Date.now(), list }; indexes.set(base, index);
  }
  const needle = String(query || '').toLowerCase().trim();
  if (!needle) return { paths: index.list.slice(0, limit), indexed: index.list.length };
  const parts = needle.split(/\s+/);
  const scored = [];
  for (const path of index.list) {
    const low = path.toLowerCase();
    if (!parts.every(part => low.includes(part))) continue;
    const name = low.slice(low.lastIndexOf('/') + 1);
    scored.push([name.startsWith(parts[0]) ? 0 : name.includes(parts[0]) ? 1 : 2, path.length, path]);
    if (scored.length > 5000) break;
  }
  scored.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return { paths: scored.slice(0, limit).map(item => item[2]), indexed: index.list.length };
}
export function forgetIndex(root) { for (const key of [...indexes.keys()]) if (lower(root).startsWith(lower(key)) || lower(key).startsWith(lower(root))) indexes.delete(key); }

/** Busca de texto literal em toda a pasta, em partes, ignorando binários e pastas pesadas. */
export async function searchText(root, query, { caseSensitive = false, all = false, limit = 1000, seconds = 25, cancelled = () => false } = {}) {
  if (typeof query !== 'string' || !query || query.length > 500) throw fail('Digite o texto a buscar.');
  const { base } = await resolveInside(root, '/');
  const needle = caseSensitive ? query : query.toLowerCase();
  const deadline = Date.now() + seconds * 1000;
  const matches = []; let scanned = 0; let truncated = false;
  for await (const file of walk(base, { all })) {
    if (cancelled()) break;
    if (Date.now() > deadline || matches.length >= limit) { truncated = true; break; }
    if (BINARY_EXTENSIONS.has(extname(file).toLowerCase())) continue;
    let text;
    try { const info = await stat(file); if (info.size > 1.5 * 1024 * 1024) continue; const buffer = await readFile(file); if (buffer.subarray(0, 4000).includes(0)) continue; text = buffer.toString('utf8'); } catch { continue; }
    scanned++;
    const haystack = caseSensitive ? text : text.toLowerCase();
    if (!haystack.includes(needle)) continue;
    const lines = text.split(/\r?\n/); const lowLines = caseSensitive ? lines : haystack.split(/\r?\n/);
    for (let index = 0; index < lines.length; index++) {
      if (!lowLines[index].includes(needle)) continue;
      matches.push({ path: toProjectPath(base, file), line: index + 1, text: lines[index].slice(0, 240) });
      if (matches.length >= limit) { truncated = true; break; }
    }
  }
  return { matches, scanned, truncated };
}

export async function packageScripts(root) {
  try {
    const { target } = await resolveInside(root, '/package.json'); if ((await stat(target)).size > 1024 * 1024) return {};
    const candidate = JSON.parse(await readFile(target, 'utf8')).scripts;
    return candidate && typeof candidate === 'object' && !Array.isArray(candidate) ? Object.fromEntries(Object.entries(candidate).filter(([name, command]) => /^[\w:.-]{1,100}$/.test(name) && typeof command === 'string')) : {};
  } catch { return {}; }
}
/** Arquivos que a IA recebe como contexto numa pasta aberta: o ativo e os citados no pedido. */
export async function chatContext(root, activeFile, prompt) {
  const wanted = new Set(); if (typeof activeFile === 'string' && activeFile.startsWith('/')) wanted.add(activeFile);
  for (const token of String(prompt).match(/[\w@./\\-]+\.[A-Za-z0-9]{1,8}/g) ?? []) { const path = `/${token.replace(/\\/g, '/').replace(/^\.?\//, '')}`; if (wanted.size < 7) wanted.add(path); }
  const files = {};
  for (const path of wanted) { try { const entry = await readEntry(root, path); if (entry.kind === 'text') files[path] = entry.content; } catch { /* arquivo citado que não existe */ } }
  return files;
}
export const folderName = path => basename(path);
export async function folderExists(path) { try { return (await stat(path)).isDirectory(); } catch { return false; } }
