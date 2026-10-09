import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { starterFiles } from '../server/repository.mjs';
import { writeWorkspace } from '../server/workspace.mjs';
test('new React template builds using an actual Vite process', async () => {
  await mkdir('tests/.tmp', { recursive: true }); const dir = await mkdtemp(resolve('tests/.tmp/vite-'));
  try { await writeWorkspace(dir, starterFiles('react')); const result = await promisify(execFile)(process.execPath, [resolve('node_modules/vite/bin/vite.js'), 'build'], { cwd: dir, timeout: 60000, windowsHide: true }); assert.match(result.stdout, /built in/); assert.match(await readFile(join(dir, 'dist/index.html'), 'utf8'), /assets\/index-/); }
  finally { await rm(dir, { recursive: true, force: true }); }
});
