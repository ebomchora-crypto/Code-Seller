import { createClient } from '@supabase/supabase-js';

// Chave pública (anon) do Code Sellers: a mesma que o site já envia ao navegador. Quem protege os dados é o RLS.
export const SUPABASE_URL = 'https://mfzlwynqjbusyudstdds.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1memx3eW5xamJ1c3l1ZHN0ZGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxOTI3ODksImV4cCI6MjEwNTc2ODc4OX0.tJWftMdCxLLiWcDEsOUSTmDhLJs5bnY1xYSRcFTMqXc';

// Mesmo armazenamento do site (localStorage, ou sessionStorage quando "manter conectado" está desligado): a sessão é compartilhada.
const read = (store: () => Storage, key: string) => { try { return store().getItem(key); } catch { return null; } };
const storage = {
  getItem: (key: string) => read(() => localStorage, key) ?? read(() => sessionStorage, key),
  setItem: (key: string, value: string) => { try { if (read(() => sessionStorage, key) !== null && read(() => localStorage, key) === null) sessionStorage.setItem(key, value); else localStorage.setItem(key, value); } catch { /* sem armazenamento */ } },
  removeItem: (key: string) => { try { localStorage.removeItem(key); sessionStorage.removeItem(key); } catch { /* sem armazenamento */ } },
};
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { storage } });
