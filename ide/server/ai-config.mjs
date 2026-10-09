import { readFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { atomicWrite } from './atomic.mjs';
import { fail } from './repository.mjs';
export function createAiConfig(path, initial = {}) {
  let value = { ...initial }; let loaded = false;
  async function get() { if (!loaded) { try { value = { ...initial, ...JSON.parse(await readFile(path, 'utf8')) }; } catch (error) { if (error.code !== 'ENOENT') throw error; } loaded = true; } return { ...value }; }
  function publicValue(config) { return { baseUrl: config.baseUrl || '', model: config.model || '', keyPresent: Boolean(config.key), ai: Boolean(config.baseUrl && config.model) }; }
  return {
    get,
    async public() { return publicValue(await get()); },
    async set(input) {
      if (typeof input.baseUrl !== 'string' || typeof input.model !== 'string' || input.model.length > 200) throw fail('Configuração de IA inválida.');
      if (input.baseUrl) { let url; try { url = new URL(input.baseUrl); } catch { throw fail('Endereço da IA inválido.'); } if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw fail('Use endereço HTTP ou HTTPS sem credenciais na URL.'); }
      const previous = await get(); const next = { baseUrl: input.baseUrl.trim().replace(/\/$/, ''), model: input.model.trim(), key: previous.key || '' };
      if (input.clearKey === true) next.key = '';
      else if (input.key !== undefined && input.key !== '') { if (typeof input.key !== 'string' || input.key.length > 4000 || /[\r\n]/.test(input.key)) throw fail('Chave inválida.'); next.key = input.key; }
      await mkdir(dirname(path), { recursive: true }); await atomicWrite(path, JSON.stringify(next)); value = next; return publicValue(value);
    },
  };
}
