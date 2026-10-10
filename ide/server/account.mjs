import { readFile, mkdir, rm } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomBytes } from 'node:crypto';
import { execFile } from 'node:child_process';
import { atomicWrite } from './atomic.mjs';
import { fail } from './repository.mjs';

// Conta do Code Sellers na IDE instalada. A IDE não guarda chave de IA: ela entra com a conta (pelo navegador,
// como o app de Windows) e o assistente usa a IA do Code Sellers pelo servidor. Só a sessão fica salva aqui.
export const SUPABASE_URL = 'https://mfzlwynqjbusyudstdds.supabase.co';
// Chave pública (anon) do Code Sellers: a mesma que o site já envia a qualquer navegador.
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1memx3eW5xamJ1c3l1ZHN0ZGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxOTI3ODksImV4cCI6MjEwNTc2ODc4OX0.tJWftMdCxLLiWcDEsOUSTmDhLJs5bnY1xYSRcFTMqXc';
const SITE = 'https://codesellers.vercel.app';

export function createAccount(path, { fetchImpl = fetch, open = openInBrowser, supabaseUrl = SUPABASE_URL, siteUrl = SITE } = {}) {
  let session; let loaded = false; let pending = null;
  async function load() { if (loaded) return session; loaded = true; try { session = JSON.parse(await readFile(path, 'utf8')); } catch { session = null; } return session; }
  async function store(next) { session = next; await mkdir(dirname(path), { recursive: true }); await atomicWrite(path, JSON.stringify(next)); }
  const headers = { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' };
  const asSession = body => ({ access_token: body.access_token, refresh_token: body.refresh_token, expires_at: Date.now() + (Number(body.expires_in) || 3600) * 1000, email: body.user?.email || '' });
  return {
    async status() { const current = await load(); return { signedIn: Boolean(current?.refresh_token), email: current?.email || '' }; },
    /** Abre o navegador na página do Code Sellers que devolve o login para esta IDE. */
    async start(port) {
      const state = randomBytes(16).toString('hex'); pending = { state, until: Date.now() + 10 * 60_000 };
      const url = `${siteUrl}/?ide_port=${Number(port)}&ide_state=${state}`;
      await open(url); return { url };
    },
    /** O navegador volta com um código de uso único; troca por uma sessão própria da IDE. */
    async complete(tokenHash, state) {
      if (!pending || pending.state !== state || Date.now() > pending.until) throw fail('Este pedido de login expirou. Clique em "Entrar" na IDE de novo.', 400);
      if (typeof tokenHash !== 'string' || !/^[\w-]{10,200}$/.test(tokenHash)) throw fail('Código de login inválido.', 400);
      pending = null;
      const response = await fetchImpl(`${supabaseUrl}/auth/v1/verify`, { method: 'POST', headers, body: JSON.stringify({ type: 'magiclink', token_hash: tokenHash }), signal: AbortSignal.timeout(15000) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.access_token || !body.refresh_token) throw fail('Não foi possível entrar com o Code Sellers. Tente de novo.', 401);
      await store(asSession(body)); return { email: session.email };
    },
    /** Sessão válida (renova perto de vencer) ou null. */
    async accessToken() {
      const current = await load(); if (!current?.refresh_token) return null;
      if (current.expires_at - Date.now() > 60_000) return current.access_token;
      const response = await fetchImpl(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, { method: 'POST', headers, body: JSON.stringify({ refresh_token: current.refresh_token }), signal: AbortSignal.timeout(15000) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.access_token) { if (response.status >= 400 && response.status < 500) { session = null; await rm(path, { force: true }); } return null; }
      await store({ ...asSession(body), email: body.user?.email || current.email }); return session.access_token;
    },
    async logout() { session = null; loaded = true; pending = null; await rm(path, { force: true }); },
    supabaseUrl,
  };
}

export function openInBrowser(url) {
  return new Promise(resolve => {
    const [command, args] = process.platform === 'win32' ? ['rundll32.exe', ['url.dll,FileProtocolHandler', url]] : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
    execFile(command, args, { windowsHide: true }, () => resolve());
  });
}
