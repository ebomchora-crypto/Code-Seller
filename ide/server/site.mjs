import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { resolveInside } from './folder.mjs';

// "Executar" para sites simples (HTML, CSS e JavaScript): serve a pasta do projeto numa porta própria de 127.0.0.1.
// É uma origem diferente da IDE, então o site aberto ali não consegue falar com a API da IDE.
const TYPES = { '.html': 'text/html; charset=utf-8', '.htm': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.webm': 'video/webm', '.wasm': 'application/wasm', '.map': 'application/json' };

export function createSites() {
  const running = new Map();
  async function fileFor(folder, pathname) {
    let path; try { path = decodeURIComponent(pathname); } catch { return null; }
    if (path.includes('\0') || path.split(/[\\/]/).includes('..')) return null;
    if (!path.startsWith('/')) path = `/${path}`;
    for (const candidate of path.endsWith('/') ? [`${path}index.html`] : [path, `${path}/index.html`]) {
      try { const { target } = await resolveInside(folder, candidate); const info = await stat(target); if (info.isFile()) return { target, info }; } catch { /* tenta o próximo */ }
    }
    return null;
  }
  return {
    async start(id, folder) {
      const existing = running.get(id); if (existing && existing.folder === folder) return existing.url;
      if (existing) await new Promise(done => existing.server.close(done));
      const server = createServer(async (request, response) => {
        const send = (status, text) => { response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }); response.end(text); };
        if (!['GET', 'HEAD'].includes(request.method)) return send(405, 'Método não permitido.');
        const url = new URL(request.url, 'http://127.0.0.1');
        const found = await fileFor(folder, url.pathname);
        if (!found) return send(404, 'Arquivo não encontrado neste projeto.');
        response.writeHead(200, { 'Content-Type': TYPES[extname(found.target).toLowerCase()] || 'application/octet-stream', 'Content-Length': found.info.size, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
        if (request.method === 'HEAD') return response.end();
        createReadStream(found.target).on('error', () => response.destroy()).pipe(response);
      });
      await new Promise((done, fail) => { server.once('error', fail); server.listen(0, '127.0.0.1', done); });
      const entry = { server, folder, url: `http://127.0.0.1:${server.address().port}/` }; running.set(id, entry); return entry.url;
    },
    async hasIndex(folder) { return Boolean(await fileFor(folder, '/')); },
    async stopAll() { await Promise.all([...running.values()].map(entry => new Promise(done => entry.server.close(done)))); running.clear(); },
  };
}
