import { fail } from './repository.mjs';
const localHosts = new Set(['localhost', '127.0.0.1', '[::1]']);
export function localRequest(request, requireOrigin = false) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (!localHosts.has(url.hostname)) throw fail('Servidor disponível apenas localmente.', 403);
  if (requireOrigin && !request.headers.origin) throw fail('Origem obrigatória.', 403);
  if (request.headers.origin) {
    const origin = new URL(request.headers.origin);
    if (!localHosts.has(origin.hostname) || origin.host !== url.host) throw fail('Origem não autorizada.', 403);
  }
  if (request.headers['sec-fetch-site'] === 'cross-site') throw fail('Origem não autorizada.', 403);
  return url;
}
