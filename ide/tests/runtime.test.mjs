import { test } from 'node:test';
import assert from 'node:assert/strict';
import { starterFiles } from '../server/repository.mjs';
import { JSDOM } from 'jsdom';

async function until(check) {
  const deadline = Date.now() + 2500;
  while (!check()) {
    if (Date.now() > deadline) throw new Error('Aplicação não renderizou a tempo.');
    await new Promise(done => setTimeout(done, 10));
  }
}

test('runtime bundles and renders React locally and reports invalid code without running project commands', async () => {
  const { compileProject } = await import('../server/runtime.mjs');
  const result = await compileProject({ template: 'react', files: starterFiles('react') });
  assert.match(result.html, /Code Makers console/);
  assert.match(result.html, /Vamos criar/);
  assert.equal(result.errors.length, 0);
  // Execute only this known test template in an isolated test DOM, never user code on the server.
  const dom = new JSDOM(result.html, { runScripts: 'dangerously', pretendToBeVisual: true });
  try {
    await until(() => dom.window.document.querySelector('button'));
    dom.window.document.querySelector('button').click();
    await until(() => dom.window.document.querySelector('button')?.textContent === 'Cliques: 1');
    assert.match(dom.window.document.querySelector('h1').textContent, /Vamos criar/);
  } finally { dom.window.close(); }
  const broken = await compileProject({ template: 'react', files: { ...starterFiles('react'), '/App.tsx': 'export default function {' } });
  assert.ok(broken.errors.length);
  assert.match(broken.errors[0], /App.tsx/);
  const escape = await compileProject({ template: 'react', files: { ...starterFiles('react'), '/App.tsx': 'import data from "../../../.env.local"; export default () => data;' } });
  assert.ok(escape.errors.some(error => error.includes('Arquivo não encontrado')));
});
test('static runtime includes actual JavaScript and CSS and refuses remote script dependencies', async () => {
  const { compileProject } = await import('../server/runtime.mjs');
  const result = await compileProject({ template: 'static', files: starterFiles('static') });
  assert.match(result.html, /addEventListener/);
  assert.match(result.html, /background: #101018/);
  const dom = new JSDOM(result.html, { runScripts: 'dangerously' });
  try { dom.window.document.querySelector('button').click(); assert.equal(dom.window.document.querySelector('button').textContent, 'Cliques: 1'); }
  finally { dom.window.close(); }
  const unsupported = await compileProject({ template: 'static', files: { '/index.html': '<script src="https://example.com/x.js"></script>' } });
  assert.ok(unsupported.errors.length);
});
