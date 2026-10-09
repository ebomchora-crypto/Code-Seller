import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { relative, join } from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { fail } from './repository.mjs';
import { safePath, reservedPath } from './workspace.mjs';
import { safeEnvironment } from './terminal.mjs';
const execute = promisify(execFile);
async function git(cwd, args) {
  try {
    const result = await execute('git', ['-c', 'core.fsmonitor=false', '-c', `core.hooksPath=${join(cwd, '.cm-disabled-hooks')}`, ...args], { cwd, env: safeEnvironment(), timeout: 15000, maxBuffer: 5 * 1024 * 1024, windowsHide: true });
    return result.stdout;
  } catch (error) { throw fail(error.code === 'ENOENT' ? 'Git não está instalado.' : (error.stderr || error.message).trim().slice(0, 4000), 400); }
}
async function gitPath(cwd, path) {
  if (typeof path !== 'string' || reservedPath(path)) throw fail('Caminho Git inválido.');
  return relative(cwd, await safePath(cwd, path)).replaceAll('\\', '/');
}
export async function gitStatus(cwd) {
  try { await git(cwd, ['rev-parse', '--git-dir']); } catch { return { initialized: false, branch: null, files: [], commits: [] }; }
  let branch = 'HEAD';
  try { branch = (await git(cwd, ['symbolic-ref', '--short', 'HEAD'])).trim(); } catch {}
  const raw = await git(cwd, ['status', '--porcelain=v1', '-z', '--untracked-files=all']);
  const parts = raw.split('\0'); const files = [];
  for (let index = 0; index < parts.length; index++) {
    const item = parts[index]; if (!item) continue;
    const path = `/${item.slice(3)}`;
    const oldPath = /[RC]/.test(item.slice(0, 2)) ? `/${parts[++index]}` : undefined;
    if (!reservedPath(path)) files.push({ path, oldPath, index: item[0], worktree: item[1] });
  }
  let commits = [];
  try { commits = (await git(cwd, ['log', '-20', '--format=%H%x09%h%x09%s%x09%an%x09%aI'])).trim().split('\n').filter(Boolean).map(line => { const [id, short, message, author, date] = line.split('\t'); return { id, short, message, author, date }; }); } catch {}
  return { initialized: true, branch, files, commits };
}
export async function gitDiff(cwd, path, staged = false) {
  const name = await gitPath(cwd, path);
  const diff = await git(cwd, ['diff', ...(staged ? ['--cached'] : []), '--no-ext-diff', '--no-textconv', '--', name]);
  if (diff) return diff;
  if (!staged) {
    const status = await gitStatus(cwd);
    if (status.files.some(file => file.path === path && file.index === '?')) {
      const content = await readFile(join(cwd, name), 'utf8');
      return `Novo arquivo: ${path}\n${content.split('\n').map(line => `+${line}`).join('\n')}`;
    }
  }
  return 'Nenhuma diferença neste arquivo.';
}
export async function gitAction(cwd, input) {
  switch (input.action) {
    case 'init': {
      await git(cwd, ['init', '--initial-branch=main']);
      const path = await safePath(cwd, '/.gitignore');
      const previous = await readFile(path, 'utf8').catch(error => { if (error.code === 'ENOENT') return ''; throw error; });
      const rules = ['node_modules/', 'dist/', '.env', '.env.*', '.cm-*'];
      await writeFile(path, `${previous}\n${rules.filter(rule => !previous.split('\n').includes(rule)).join('\n')}\n`, 'utf8');
      break;
    }
    case 'stage': await git(cwd, ['add', '--', await gitPath(cwd, input.path)]); break;
    case 'unstage': {
      const path = await gitPath(cwd, input.path);
      try { await git(cwd, ['rev-parse', '--verify', 'HEAD']); }
      catch { await git(cwd, ['rm', '--cached', '--', path]); return gitStatus(cwd); }
      await git(cwd, ['restore', '--staged', '--', path]); break;
    }
    case 'commit': {
      if (typeof input.message !== 'string' || !input.message.trim() || input.message.length > 2000) throw fail('Informe uma mensagem de commit.');
      const options = [];
      if (input.authorName && input.authorEmail) {
        if (typeof input.authorName !== 'string' || typeof input.authorEmail !== 'string' || /[\r\n\x00]/.test(input.authorName + input.authorEmail)) throw fail('Identidade Git inválida.');
        options.push('-c', `user.name=${input.authorName.slice(0, 100)}`, '-c', `user.email=${input.authorEmail.slice(0, 200)}`);
      }
      await git(cwd, [...options, 'commit', '-m', input.message.trim()]); break;
    }
    default: throw fail('Operação Git não permitida.');
  }
  return gitStatus(cwd);
}
