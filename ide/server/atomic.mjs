import { rename, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
export async function atomicWrite(target, content, temporary = `${target}.${randomUUID()}.tmp`) {
  await writeFile(temporary, content, 'utf8');
  for (let attempt = 0; ; attempt++) {
    try { await rename(temporary, target); return; }
    catch (error) {
      if (attempt >= 6 || !['EPERM', 'EACCES', 'EBUSY'].includes(error.code)) throw error;
      await new Promise(done => setTimeout(done, 25 * (attempt + 1)));
    }
  }
}
