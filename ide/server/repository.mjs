import { mkdir, readFile, readdir } from 'node:fs/promises';
import { join, isAbsolute, resolve, basename } from 'node:path';
import { randomUUID } from 'node:crypto';
import { readWorkspace, writeWorkspace, reservedPath } from './workspace.mjs';
import { atomicWrite } from './atomic.mjs';

export function fail(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

export function validateFiles(files) {
  if (!files || typeof files !== 'object' || Array.isArray(files)) throw fail('Arquivos inválidos.');
  const entries = Object.entries(files);
  if (entries.length > 1000) throw fail('O workspace suporta até 1000 arquivos de texto.');
  let size = 0;
  const names = new Set();
  for (const [path, content] of entries) {
    if (names.has(path.toLowerCase())) throw fail('Caminhos duplicados que diferem apenas por maiúsculas não são suportados.');
    names.add(path.toLowerCase());
    if (!path.startsWith('/') || path.length > 240 || /[\\\x00-\x1f:]/.test(path) || path.split('/').slice(1).some(part => !part || part === '.' || part === '..')) throw fail('Caminho de arquivo inválido.');
    if (reservedPath(path)) throw fail('Caminho reservado: dependências, Git e credenciais não são editáveis pela IDE.');
    if (path.split('/').slice(1).some(part => /[<>"|?*]/.test(part) || /[. ]$/.test(part) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part))) throw fail('Nome de arquivo incompatível com Windows.');
    if (typeof content !== 'string') throw fail('Apenas arquivos de texto são suportados.');
    size += Buffer.byteLength(content);
    const segments = path.split('/').slice(1);
    for (let index = 1; index < segments.length; index++) {
      if (Object.hasOwn(files, '/' + segments.slice(0, index).join('/'))) throw fail('Um caminho não pode ser arquivo e pasta ao mesmo tempo.');
    }
  }
  if (size > 10 * 1024 * 1024) throw fail('O projeto excede o limite local de 10 MB.');
  return structuredClone(files);
}

const css = 'body { margin: 0; font-family: system-ui, sans-serif; background: #101018; color: #f4f4f5; }\nmain { max-width: 760px; margin: 12vh auto; padding: 32px; }\nbutton { background: #6366f1; color: white; border: 0; border-radius: 8px; padding: 12px 20px; cursor: pointer; }\n';
export function starterFiles(template) {
  if (template === 'generic') return {};
  if (template === 'next') return {
    '/package.json': JSON.stringify({ name: 'meu-app-next', version: '1.0.0', private: true, scripts: { dev: 'next dev', build: 'next build', start: 'next start' }, dependencies: { next: '15.5.0', react: '19.1.0', 'react-dom': '19.1.0' }, devDependencies: { typescript: '5.9.3', '@types/react': '19.1.0', '@types/node': '22.10.0' } }, null, 2),
    '/next.config.mjs': 'const nextConfig = {};\nexport default nextConfig;\n',
    '/tsconfig.json': JSON.stringify({ compilerOptions: { target: 'ES2017', lib: ['dom', 'dom.iterable', 'esnext'], allowJs: true, skipLibCheck: true, strict: true, noEmit: true, esModuleInterop: true, module: 'esnext', moduleResolution: 'bundler', resolveJsonModule: true, isolatedModules: true, jsx: 'preserve', incremental: true, plugins: [{ name: 'next' }] }, include: ['**/*.ts', '**/*.tsx'], exclude: ['node_modules'] }, null, 2),
    '/app/layout.tsx': "import type { ReactNode } from 'react';\nimport './globals.css';\n\nexport const metadata = { title: 'Meu app Next.js' };\n\nexport default function RootLayout({ children }: { children: ReactNode }) {\n  return (\n    <html lang=\"pt-BR\">\n      <body>{children}</body>\n    </html>\n  );\n}\n",
    '/app/page.tsx': "export default function Home() {\n  return (\n    <main>\n      <h1>Olá, Next.js</h1>\n      <p>Edite app/page.tsx e rode npm install e npm run dev no terminal.</p>\n    </main>\n  );\n}\n",
    '/app/globals.css': css,
  };
  if (template === 'node') return {
    '/package.json': JSON.stringify({ name: 'meu-servidor', version: '1.0.0', private: true, type: 'module', scripts: { start: 'node index.js', dev: 'node --watch index.js' } }, null, 2),
    '/index.js': "import { createServer } from 'node:http';\n\nconst server = createServer((request, response) => {\n  response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });\n  response.end('Olá do Node.js!');\n});\n\nserver.listen(3000, '127.0.0.1', () => console.log('Servidor em http://127.0.0.1:3000'));\n",
  };
  if (template === 'python') return {
    '/main.py': "def saudacao(nome: str) -> str:\n    return f'Olá, {nome}!'\n\n\nif __name__ == '__main__':\n    print(saudacao('mundo'))\n",
    '/README.md': '# Projeto Python\n\nExecute com `python main.py` no terminal.\n',
  };
  if (template === 'java') return {
    '/Main.java': 'public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Olá, Java!\");\n    }\n}\n',
    '/README.md': '# Projeto Java\n\nExecute com `java Main.java` no terminal.\n',
  };
  if (template === 'static') return {
    '/index.html': '<!doctype html>\n<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="style.css"><title>Meu projeto</title></head><body><main><h1>Vamos criar algo incrível.</h1><p>Edite os arquivos e veja as mudanças no preview.</p><button id="counter">Cliques: 0</button></main><script src="script.js"></script></body></html>',
    '/style.css': css,
    '/script.js': 'let count = 0;\ndocument.querySelector("#counter").addEventListener("click", (event) => {\n  event.target.textContent = `Cliques: ${++count}`;\n});\n',
  };
  return {
    '/App.tsx': 'import { useState } from "react";\nimport "./styles.css";\n\nexport default function App() {\n  const [count, setCount] = useState(0);\n  return <main>\n    <h1>Vamos criar algo incrível.</h1>\n    <p>Seu projeto React está pronto para editar.</p>\n    <button onClick={() => setCount(count + 1)}>Cliques: {count}</button>\n  </main>;\n}\n',
    '/index.tsx': 'import { createRoot } from "react-dom/client";\nimport App from "./App";\ncreateRoot(document.getElementById("root")!).render(<App />);\n',
    '/styles.css': css,
    '/index.html': '<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Meu projeto</title></head><body><div id="root"></div><script type="module" src="/index.tsx"></script></body></html>',
    '/vite.config.ts': 'import { defineConfig } from "vite";\nexport default defineConfig({ esbuild: { jsx: "automatic" }, server: { host: "127.0.0.1" } });\n',
    '/tsconfig.json': JSON.stringify({ compilerOptions: { target: 'ES2020', lib: ['ES2020', 'DOM'], module: 'ESNext', moduleResolution: 'Bundler', jsx: 'react-jsx', strict: true, noEmit: true, skipLibCheck: true, esModuleInterop: true }, include: ['*.tsx'] }, null, 2),
    '/package.json': JSON.stringify({ name: 'meu-projeto', version: '1.0.0', private: true, scripts: { dev: 'vite --host 127.0.0.1', build: 'vite build', preview: 'vite preview --host 127.0.0.1' }, dependencies: { react: '18.3.1', 'react-dom': '18.3.1' }, devDependencies: { vite: '7.3.7', typescript: '5.9.3' }, main: '/index.tsx' }, null, 2),
  };
}

export function createRepository(root, options = {}) {
  const workspaceRoot = options.workspaceRoot || join(root, 'workspaces');
  const folders = new Map();
  // Serializing mutations prevents simultaneous saves from both passing the revision check.
  let queue = Promise.resolve();
  const serial = fn => {
    const result = queue.then(fn);
    queue = result.catch(() => {});
    return result;
  };
  const filePath = id => {
    if (!/^[a-f0-9-]{36}$/.test(id)) throw fail('Identificador inválido.');
    return join(root, `${id}.json`);
  };
  const read = async id => {
    try { const project = JSON.parse(await readFile(filePath(id), 'utf8')); if (project.folderPath && isAbsolute(project.folderPath)) folders.set(id, project.folderPath); return project; }
    catch (error) { if (error.code === 'ENOENT') throw fail('Projeto não encontrado.', 404); throw error; }
  };
  const workspace = id => { filePath(id); return folders.get(id) || join(workspaceRoot, id); };
  const save = async (project, synchronize = true) => {
    await mkdir(root, { recursive: true });
    if (synchronize) {
      let previous = {};
      try { previous = await readWorkspace(workspace(project.id)); } catch (error) { if (error.code !== 'ENOENT') throw error; }
      let prior;
      try { prior = await read(project.id); } catch (error) { if (error.status !== 404) throw error; }
      if (prior && JSON.stringify(Object.entries(previous).sort()) !== JSON.stringify(Object.entries(prior.files).sort())) throw fail('Arquivos alterados externamente durante a gravação. Preserve suas edições e recarregue.', 409);
      await writeWorkspace(workspace(project.id), project.files, previous);
    }
    const target = filePath(project.id);
    const temporary = `${target}.${randomUUID()}.tmp`;
    await atomicWrite(target, JSON.stringify(project), temporary);
    return structuredClone(project);
  };
  const touch = project => ({ ...project, revision: project.revision + 1, updated_at: new Date().toISOString() });
  const nameOf = value => {
    if (typeof value !== 'string' || !value.trim() || value.trim().length > 100) throw fail('Nome obrigatório, com até 100 caracteres.');
    return value.trim();
  };
  const addCheckpoint = (project, label) => {
    const snapshot = { id: randomUUID(), label: String(label).slice(0, 100), created_at: new Date().toISOString(), files: structuredClone(project.files) };
    project.history = [snapshot, ...project.history].slice(0, 30);
    return snapshot;
  };
  const hydrate = async id => {
    let project = await read(id);
    if (project.deleted_at) throw fail('Projeto está na lixeira.', 404);
    let files;
    try { files = await readWorkspace(workspace(id)); }
    catch (error) { if (error.code !== 'ENOENT') throw error; if (project.folderPath) throw fail('A pasta do workspace não está disponível. Verifique o caminho e abra a pasta novamente.', 404); await writeWorkspace(workspace(id), project.files); return project; }
    if (JSON.stringify(Object.entries(files).sort()) !== JSON.stringify(Object.entries(project.files).sort())) {
      addCheckpoint(project, 'Antes das alterações externas');
      // An empty workspace remains recoverable; restore can repopulate it.
      project.files = files;
      project = await save(touch(project), false);
    }
    return project;
  };
  const repo = {
    workspace,
    async list(deleted = false) {
      await mkdir(root, { recursive: true });
      const names = await readdir(root);
      const projects = await Promise.all(names.filter(n => /^[a-f0-9-]{36}\.json$/.test(n)).map(n => read(n.slice(0, -5))));
      return projects.filter(p => Boolean(p.deleted_at) === deleted).sort((a, b) => b.updated_at.localeCompare(a.updated_at)).map(({ files, history, ...metadata }) => metadata);
    },
    get(id) { return serial(() => hydrate(id)); },
    create(input) { return serial(async () => {
      const template = input.template ?? 'react';
      if (!['react', 'static', 'generic', 'next', 'node', 'python', 'java'].includes(template)) throw fail('Template não suportado.');
      const now = new Date().toISOString();
      return save({ id: randomUUID(), name: nameOf(input.name), description: String(input.description ?? '').slice(0, 500), template, files: validateFiles(input.files ?? starterFiles(template)), revision: 1, created_at: now, updated_at: now, deleted_at: null, history: [] });
    }); },
    openFolder(input) { return serial(async () => {
      if (typeof input.path !== 'string' || !isAbsolute(input.path)) throw fail('Informe o caminho completo da pasta.');
      const folderPath = resolve(input.path);
      const files = await readWorkspace(folderPath);
      await mkdir(root, { recursive: true });
      for (const name of await readdir(root)) {
        if (!/^[a-f0-9-]{36}\.json$/.test(name)) continue;
        const existing = await read(name.slice(0, -5));
        if (existing.folderPath?.toLowerCase() === folderPath.toLowerCase() && !existing.deleted_at) return hydrate(existing.id);
      }
      const now = new Date().toISOString(); const id = randomUUID(); folders.set(id, folderPath);
      return save({ id, name: nameOf(input.name || basename(folderPath) || folderPath), description: 'Pasta local', template: 'generic', folderPath, files, revision: 1, created_at: now, updated_at: now, deleted_at: null, history: [] }, false);
    }); },
    update(id, input) { return serial(async () => {
      const project = await hydrate(id);
      if (input.revision !== project.revision) throw fail('Projeto alterado em outra sessão. Exporte suas mudanças antes de recarregar.', 409);
      if (input.name !== undefined) project.name = nameOf(input.name);
      if (input.files !== undefined) project.files = validateFiles(input.files);
      return save(touch(project));
    }); },
    checkpoint(id, label) { return serial(async () => {
      const project = await hydrate(id);
      const snapshot = addCheckpoint(project, label);
      await save(project);
      return snapshot;
    }); },
    restore(id, checkpointId) { return serial(async () => {
      const project = await hydrate(id);
      const snapshot = project.history.find(item => item.id === checkpointId);
      if (!snapshot) throw fail('Versão não encontrada.', 404);
      addCheckpoint(project, 'Antes de restaurar');
      project.files = structuredClone(snapshot.files);
      return save(touch(project));
    }); },
    apply(id, input) { return serial(async () => {
      const project = await hydrate(id);
      if (project.revision !== input.revision) throw fail('Projeto alterado em outra sessão. Gere a proposta novamente.', 409);
      const files = validateFiles(input.files);
      addCheckpoint(project, input.label ?? 'Antes das alterações');
      project.files = files;
      return save(touch(project));
    }); },
    trash(id) { return serial(async () => {
      const project = await hydrate(id);
      project.deleted_at = new Date().toISOString();
      return save(touch(project));
    }); },
    recover(id) { return serial(async () => {
      const project = await read(id);
      let files;
      try { files = await readWorkspace(workspace(id)); }
      catch (error) { if (error.code !== 'ENOENT') throw error; if (project.folderPath) throw fail('A pasta do workspace não está disponível.', 404); await writeWorkspace(workspace(id), project.files); files = project.files; }
      if (JSON.stringify(Object.entries(files).sort()) !== JSON.stringify(Object.entries(project.files).sort())) { addCheckpoint(project, 'Antes de recuperar alterações externas'); project.files = files; }
      project.deleted_at = null;
      return save(touch(project), false);
    }); },
    trust(id, trusted) { return serial(async () => {
      const project = await hydrate(id); project.trusted = trusted === true;
      return save(project, false);
    }); },
  };
  return repo;
}
