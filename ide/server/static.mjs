import { readFile, realpath } from 'node:fs/promises';
import { resolve, relative, extname, isAbsolute } from 'node:path';
import { fail } from './repository.mjs';

const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
export async function serveStatic(request, response, url, root) {
  if (!['GET', 'HEAD'].includes(request.method)) throw fail('Método não permitido.', 405);
  const pathname = decodeURIComponent(url.pathname);
  if (pathname.includes('\\') || pathname.split('/').some(part => part.startsWith('.'))) throw fail('Rota não encontrada.', 404);
  const base = await realpath(root);
  let candidate = resolve(base, `.${pathname}`);
  if (pathname === '/' || (!extname(pathname) && !pathname.startsWith('/assets/'))) candidate = resolve(base, 'index.html');
  try {
    candidate = await realpath(candidate);
    const rel = relative(base, candidate);
    if (rel.startsWith('..') || isAbsolute(rel)) throw fail('Rota não encontrada.', 404);
    const data = await readFile(candidate);
    response.writeHead(200, { 'Content-Type': mime[extname(candidate)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    response.end(request.method === 'HEAD' ? undefined : data);
  } catch (error) { if (error.status) throw error; throw fail('Arquivo não encontrado.', 404); }
}
