import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { fail } from './repository.mjs';

// Cópia de segurança de cada arquivo ANTES de ele ser sobrescrito numa pasta aberta. As cópias ficam
// na pasta de dados da IDE (nunca dentro da pasta do usuário) e dão para restaurar a versão anterior.
const KEEP_PER_FILE = 12;
const MIN_GAP_MS = 45_000;        // salvamentos seguidos viram uma cópia só (o autosave não enche o disco)
const MAX_PROJECT_BYTES = 400 * 1024 * 1024;

const hash = value => createHash('sha1').update(value).digest('hex').slice(0, 16);

export function createBackups(base) {
  const folderFor = (projectId, path) => join(base, hash(projectId), hash(path));
  const versions = async (projectId, path) => {
    const dir = folderFor(projectId, path);
    let names; try { names = await readdir(dir); } catch { return []; }
    const out = [];
    for (const name of names) {
      const match = /^(\d+)\.bak$/.exec(name); if (!match) continue;
      try { const info = await stat(join(dir, name)); out.push({ id: match[1], time: Number(match[1]), size: info.size }); } catch { /* sumiu */ }
    }
    return out.sort((a, b) => b.time - a.time);
  };
  async function prune(projectId) {
    const dir = join(base, hash(projectId)); let total = 0; const all = [];
    let groups; try { groups = await readdir(dir); } catch { return; }
    for (const group of groups) { let names; try { names = await readdir(join(dir, group)); } catch { continue; } for (const name of names) { if (!name.endsWith('.bak')) continue; try { const info = await stat(join(dir, group, name)); total += info.size; all.push({ file: join(dir, group, name), time: info.mtimeMs, size: info.size }); } catch { /* sumiu */ } } }
    if (total <= MAX_PROJECT_BYTES) return;
    all.sort((a, b) => a.time - b.time);
    for (const item of all) { if (total <= MAX_PROJECT_BYTES * 0.8) break; await rm(item.file, { force: true }); total -= item.size; }
  }
  return {
    /** Guarda o conteúdo atual do arquivo (bytes) se ele for diferente da última cópia e já houver intervalo. */
    async save(projectId, path, buffer) {
      const dir = folderFor(projectId, path);
      const existing = await versions(projectId, path);
      const latest = existing[0];
      if (latest && Date.now() - latest.time < MIN_GAP_MS) return null;
      if (latest) { try { const previous = await readFile(join(dir, `${latest.id}.bak`)); if (previous.equals(buffer)) return null; } catch { /* segue e grava */ } }
      await mkdir(dir, { recursive: true });
      const id = String(Date.now());
      await writeFile(join(dir, `${id}.bak`), buffer);
      await writeFile(join(dir, 'caminho.txt'), path, 'utf8');
      for (const old of existing.slice(KEEP_PER_FILE - 1)) await rm(join(dir, `${old.id}.bak`), { force: true });
      void prune(projectId).catch(() => {});
      return id;
    },
    versions,
    async read(projectId, path, id) {
      if (!/^\d+$/.test(String(id))) throw fail('Versão inválida.');
      try { return await readFile(join(folderFor(projectId, path), `${id}.bak`)); } catch { throw fail('Essa versão não existe mais.', 404); }
    },
    async forget(projectId) { await rm(join(base, hash(projectId)), { recursive: true, force: true }); },
  };
}
